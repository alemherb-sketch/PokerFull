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

  useEffect(() => {
    if (!supabase) {
      // Fallback to mock data if Supabase isn't configured
      setPlayers(initialMockPlayers);
      const initialPot = initialMockPlayers.reduce((acc, curr) => acc + curr.balance, 0);
      setTotalPot(initialPot);
      return;
    }

    // Fetch initial data
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*');
      if (error) console.error("Error fetching players:", error);
      else {
        setPlayers(data);
        const pot = data.reduce((acc, curr) => acc + Number(curr.balance), 0);
        setTotalPot(pot);
      }
    };

    fetchPlayers();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('players-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        console.log("Change received!", payload);
        fetchPlayers(); // Re-fetch all to re-calculate pot safely
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
    if (!supabase) {
      // Mock delete
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      return;
    }

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

  const recordDealtCards = (playerId, playerName, imageUrl) => {
    const record = {
      id: Date.now(),
      playerId,
      playerName,
      imageUrl,
      timestamp: new Date().toLocaleTimeString()
    };
    setDealtCards(prev => [record, ...prev]);
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
      recordDealtCards,
      clearDealtCards,
      updateStack
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
