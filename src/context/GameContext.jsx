import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const GameContext = createContext();

const initialMockPlayers = [
  { id: 1, name: 'Juan Perez', phone: '+51999999991', balance: 500, current_stack: 500, position: 1 },
  { id: 2, name: 'Maria Gomez', phone: '+51999999992', balance: 250, current_stack: 250, position: 3 },
  { id: 3, name: 'Carlos Diaz', phone: '+51999999993', balance: 1000, current_stack: 1000, position: 5 },
  { id: 4, name: 'Ana Rojas', phone: '+51999999994', balance: 150, current_stack: 150, position: 8 }
];

export const GameProvider = ({ children }) => {
  const [players, setPlayers] = useState([]);
  const [totalPot, setTotalPot] = useState(0);
  const [dealtCards, setDealtCards] = useState([]); // { playerId, playerName, imageUrl, timestamp }
  const [sessionPhotos, setSessionPhotos] = useState([]); // Global photos for the entire session
  const [retiredPlayers, setRetiredPlayers] = useState([]); // Players removed during the current session
  const [pastSessions, setPastSessions] = useState([]); // History of closed sessions

  useEffect(() => {
    if (!supabase) {
      // Fallback to mock data if Supabase isn't configured
      setPlayers(initialMockPlayers);
      const initialPot = initialMockPlayers.reduce((acc, curr) => acc + curr.balance, 0);
      setTotalPot(initialPot);
      return;
    }

    // Fetch initial data
    const fetchInitialData = async () => {
      // 1. Fetch active players
      const { data: playersData, error: playersError } = await supabase.from('players').select('*');
      if (playersError) console.error("Error fetching players:", playersError);
      else {
        setPlayers(playersData);
        const pot = playersData.reduce((acc, curr) => acc + Number(curr.balance), 0);
        setTotalPot(pot);
      }

      // 2. Fetch current session retired players (where session_id is null)
      const { data: retiredData } = await supabase.from('player_history').select('*').is('session_id', null);
      if (retiredData) {
        const formattedRetired = retiredData.map(p => ({
          ...p,
          balance: p.total_buyin,
          current_stack: p.final_stack,
          retiredAt: new Date(p.created_at).toLocaleTimeString()
        }));
        setRetiredPlayers(formattedRetired);
      }

      // 3. Fetch current session photos
      const { data: photosData } = await supabase.from('sent_photos').select('*');
      if (photosData) {
        const formattedPhotos = photosData.map(p => ({
          id: p.id,
          playerId: p.player_id,
          playerName: p.player_name,
          imageUrl: p.image_url,
          timestamp: new Date(p.created_at).toLocaleTimeString()
        }));
        setSessionPhotos(formattedPhotos);
      }

      // 4. Fetch past game sessions with their players
      const { data: sessionsData } = await supabase.from('game_sessions').select('*, player_history(*)').order('created_at', { ascending: false });
      if (sessionsData) {
        setPastSessions(sessionsData);
      }
    };

    fetchInitialData();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('players-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        console.log("Change received!", payload);
        // We only re-fetch players on realtime change to avoid heavy re-fetching of history
        supabase.from('players').select('*').then(({data}) => {
          if (data) {
            setPlayers(data);
            setTotalPot(data.reduce((acc, curr) => acc + Number(curr.balance), 0));
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const buyIn = async (playerId, amount) => {
    if (!supabase) {
      // Mock update
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, balance: p.balance + amount, current_stack: (p.current_stack || 0) + amount } : p
      ));
      setTotalPot(prev => prev + amount);
      return;
    }

    // Real Supabase update
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const newBalance = Number(player.balance) + amount;
    const newStack = Number(player.current_stack || 0) + amount;

    // 1. Update player balance and current_stack
    const { error: updateError } = await supabase
      .from('players')
      .update({ balance: newBalance, current_stack: newStack })
      .eq('id', playerId);
      
    if (updateError) {
      console.error("Error updating balance:", updateError);
      return;
    }

    // 2. Insert transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert([{ player_id: playerId, amount: amount, type: 'buy-in' }]);

    if (txError) {
      console.error("Error recording transaction:", txError);
    }
  };

  const addPlayer = async (newPlayer) => {
    if (!supabase) {
      // Mock insert
      const id = players.length > 0 ? Math.max(...players.map(p => p.id)) + 1 : 1;
      const playerToInsert = { ...newPlayer, id, balance: 0, current_stack: 0 };
      setPlayers(prev => [...prev, playerToInsert]);
      return;
    }

    // Supabase insert
    const { error } = await supabase
      .from('players')
      .insert([{ 
        name: newPlayer.name, 
        phone: newPlayer.phone, 
        position: newPlayer.position,
        balance: 0,
        current_stack: 0
      }]);
      
    if (error) {
      console.error("Error adding player:", error);
      alert("Error al agregar jugador: " + error.message);
    }
  };

  const removePlayer = async (playerId) => {
    const playerToRetire = players.find(p => p.id === playerId);
    if (!playerToRetire) return;

    const currentStack = Number(playerToRetire.current_stack !== undefined ? playerToRetire.current_stack : playerToRetire.balance);
    const totalBuyIn = Number(playerToRetire.balance);
    const profit = currentStack - totalBuyIn;

    const retiredRecord = {
      ...playerToRetire,
      final_stack: currentStack,
      profit: profit,
      retiredAt: new Date().toLocaleTimeString()
    };

    setRetiredPlayers(prev => [...prev, retiredRecord]);

    if (!supabase) {
      // Mock delete
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      return;
    }

    // Save to player_history in Supabase (we'll save session_id when we close the session)
    // For now, we can just save it to player_history with session_id = null or we wait until session close.
    // Let's insert it immediately so it's not lost on refresh
    const { error: historyError } = await supabase
      .from('player_history')
      .insert([{ 
        name: playerToRetire.name,
        phone: playerToRetire.phone,
        total_buyin: totalBuyIn,
        final_stack: currentStack,
        profit: profit
      }]);
      
    if (historyError) console.error("Error saving player history:", historyError);

    // Supabase delete
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) {
      console.error("Error removing player:", error);
      alert("Error al retirar jugador: " + error.message);
    }
  };

  const changeSeat = async (playerId, newPosition) => {
    // Basic validation
    if (newPosition < 1 || newPosition > 10) {
      alert("La posición debe estar entre 1 y 10.");
      return;
    }
    
    // Check if seat is occupied
    const isOccupied = players.some(p => p.position === newPosition && p.id !== playerId);
    if (isOccupied) {
      alert(`El asiento ${newPosition} ya está ocupado.`);
      return;
    }

    if (!supabase) {
      // Mock update
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, position: newPosition } : p
      ));
      return;
    }

    // Supabase update
    const { error } = await supabase
      .from('players')
      .update({ position: newPosition })
      .eq('id', playerId);

    if (error) {
      console.error("Error changing seat:", error);
      alert("Error al cambiar asiento: " + error.message);
    }
  };

  const recordDealtCards = async (playerId, playerName, imageUrl) => {
    const record = {
      id: Date.now(),
      playerId,
      playerName,
      imageUrl,
      timestamp: new Date().toLocaleTimeString()
    };
    
    // Update local states
    setDealtCards(prev => [record, ...prev]);
    setSessionPhotos(prev => [record, ...prev]);

    // Optional: Save to Supabase for permanent persistence
    if (supabase) {
      await supabase.from('sent_photos').insert([{
        player_id: playerId,
        player_name: playerName,
        image_url: imageUrl
      }]);
    }
  };

  const clearDealtCards = () => {
    setDealtCards([]);
  };

  const updateStack = async (playerId, newStackAmount) => {
    if (!supabase) {
      // Mock update
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, current_stack: newStackAmount } : p
      ));
      return;
    }

    // Supabase update
    const { error } = await supabase
      .from('players')
      .update({ current_stack: newStackAmount })
      .eq('id', playerId);

    if (error) {
      console.error("Error updating stack:", error);
      alert("Error al actualizar fichas: " + error.message);
    }
  };

  const updatePlayerDetails = async (playerId, newName, newPhone, newBalance) => {
    if (!supabase) {
      // Mock update
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, name: newName, phone: newPhone, balance: newBalance } : p
      ));
      return;
    }

    // Supabase update
    const { error } = await supabase
      .from('players')
      .update({ name: newName, phone: newPhone, balance: newBalance })
      .eq('id', playerId);

    if (error) {
      console.error("Error updating player details:", error);
      alert("Error al actualizar datos: " + error.message);
    }
  };

  const closeGameSession = async () => {
    const activePlayersAsRetired = players.map(p => {
      const currentStack = Number(p.current_stack !== undefined ? p.current_stack : p.balance);
      const totalBuyIn = Number(p.balance);
      return {
        ...p,
        total_buyin: totalBuyIn,
        final_stack: currentStack,
        profit: currentStack - totalBuyIn,
        retiredAt: new Date().toLocaleTimeString()
      };
    });

    const allSessionPlayers = [...retiredPlayers, ...activePlayersAsRetired];
    
    if (allSessionPlayers.length === 0) {
      alert("No hay jugadores en esta sesión.");
      return null;
    }

    const totalBuyIn = allSessionPlayers.reduce((sum, p) => sum + (p.total_buyin || p.balance), 0);
    const totalCashout = allSessionPlayers.reduce((sum, p) => sum + p.final_stack, 0);
    const houseProfit = totalBuyIn - totalCashout;

    const sessionData = {
      date: new Date().toLocaleString(),
      total_players: allSessionPlayers.length,
      total_pot: totalBuyIn,
      total_cashout: totalCashout,
      house_profit: houseProfit
    };

    if (supabase) {
      const { data: sessionRecord, error: sessionError } = await supabase
        .from('game_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (sessionError) {
        console.error("Error saving session:", sessionError);
        alert("Error al guardar la sesión: " + sessionError.message);
      } else if (sessionRecord) {
        const activeToHistory = activePlayersAsRetired.map(p => ({
          session_id: sessionRecord.id,
          name: p.name,
          phone: p.phone,
          total_buyin: p.total_buyin,
          final_stack: p.final_stack,
          profit: p.profit
        }));

        if (activeToHistory.length > 0) {
          await supabase.from('player_history').insert(activeToHistory);
        }

        // Clear active players from Supabase
        await supabase.from('players').delete().neq('id', 0);
        
        // Clear session photos from Supabase (they are tied to the round, or we can keep them. The user wanted a history per session. For now we clear to start fresh)
        await supabase.from('sent_photos').delete().neq('id', 0);
        
        // Refresh past sessions with players
        const { data: newSessions } = await supabase.from('game_sessions').select('*, player_history(*)').order('created_at', { ascending: false });
        if (newSessions) setPastSessions(newSessions);
      }
    }

    // Clear local state
    setPlayers([]);
    setRetiredPlayers([]);
    setTotalPot(0);
    setDealtCards([]);
    setSessionPhotos([]);

    return {
      ...sessionData,
      players: allSessionPlayers
    };
  };

  return (
    <GameContext.Provider value={{ 
      players, 
      setPlayers, 
      totalPot, 
      buyIn, 
      addPlayer, 
      removePlayer, 
      changeSeat,
      dealtCards,
      sessionPhotos,
      retiredPlayers,
      pastSessions,
      setRetiredPlayers,
      recordDealtCards,
      clearDealtCards,
      updateStack,
      updatePlayerDetails,
      closeGameSession
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
