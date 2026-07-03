import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { supabase } from '../../supabaseClient';
import { Users, Plus, DollarSign, X, Trash2, Move, Coins, Edit2, Save, Calendar, Download, ChevronDown, ChevronUp, MessageCircle, QrCode, BookUser } from 'lucide-react';
import { exportSessionToExcel } from '../../utils/excelExport';

const AdminDashboard = () => {
  const { players, retiredPlayers, pastSessions, totalPot, buyIn, addPlayer, removePlayer, changeSeat, updateStack, updatePlayerDetails, closeGameSession } = useGame();
  
  // Bot state
  const [botStatus, setBotStatus] = useState('DISCONNECTED');
  const [botQR, setBotQR] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  React.useEffect(() => {
    // Poll the bot status every 5 seconds
    const fetchBotStatus = async () => {
      try {
        const botUrl = import.meta.env.VITE_BOT_URL || 'http://localhost:3001';
        const res = await fetch(`${botUrl}/api/status`);
        const data = await res.json();
        setBotStatus(data.status);
        if (data.qr) {
          setBotQR(data.qr);
        }
      } catch (err) {
        setBotStatus('DISCONNECTED');
      }
    };
    
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Buy-in state
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [amount, setAmount] = useState('');

  // Helper to check seat status
  const getSeatStatus = (seatNum) => {
    return players.find(p => p.position === seatNum);
  };

  // Add Player state
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('');

  // Change Seat state
  const [showChangeSeat, setShowChangeSeat] = useState(false);
  const [seatPlayer, setSeatPlayer] = useState(null);
  const [newSeat, setNewSeat] = useState(1);

  // Update Stack state
  const [showUpdateStack, setShowUpdateStack] = useState(false);
  const [stackPlayer, setStackPlayer] = useState(null);
  const [newStackAmount, setNewStackAmount] = useState('');

  // Edit Player state
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBalance, setEditBalance] = useState('');

  // Expandable Session state
  const [expandedSessions, setExpandedSessions] = useState({});
  
  const toggleSessionDetails = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const handleBuyIn = (e) => {
    e.preventDefault();
    if (selectedPlayer && amount) {
      buyIn(Number(selectedPlayer), Number(amount));
      setAmount('');
    }
  };

  const handleContactSearch = async () => {
    const supported = ('contacts' in navigator && 'ContactsManager' in window);
    if (!supported) {
      alert("La búsqueda de contactos no está soportada en este navegador o dispositivo. Por favor, usa Chrome en Android o Safari en iOS.");
      return;
    }
    
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      
      const contacts = await navigator.contacts.select(props, opts);
      
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        if (contact.name && contact.name.length > 0) {
          setNewPlayerName(contact.name[0]);
        }
        if (contact.tel && contact.tel.length > 0) {
          const phone = contact.tel[0].replace(/\\D/g, ''); // Remove non-numeric characters
          setNewPlayerPhone(phone);
        }
      }
    } catch (ex) {
      console.error("Error al acceder a los contactos:", ex);
    }
  };

  return (
    <>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="text-gradient">Panel de Administración</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '1rem 2rem' }}>
            <span className="text-muted">Caja Total (PEN): </span>
            <span className="currency-pen text-gradient-green" style={{ fontSize: '1.5rem' }}>S/. {totalPot.toFixed(2)}</span>
          </div>
          
          {/* Bot Status Indicator */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={20} color={botStatus === 'CONNECTED' ? '#10b981' : botStatus === 'QR_READY' ? '#fbbf24' : '#ef4444'} />
            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
              Bot: {botStatus === 'CONNECTED' ? 'Conectado' : botStatus === 'QR_READY' ? 'Esperando QR' : 'Desconectado'}
            </span>
            {botStatus === 'QR_READY' && (
              <button 
                className="btn-icon" 
                onClick={() => setShowQRModal(true)} 
                title="Escanear Código QR"
                style={{ marginLeft: '0.5rem', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
              >
                <QrCode size={18} /> Ver QR
              </button>
            )}
          </div>
          
          <button 
            className="btn btn-secondary pulse-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.5)', height: '100%' }}
            onClick={async () => {
              if (players.length === 0 && retiredPlayers.length === 0) {
                alert("No hay datos en esta sesión para guardar.");
                return;
              }
              if (window.confirm("🚨 ¿Estás seguro de CERRAR LA SESIÓN DE JUEGO? Esto limpiará la mesa, guardará el historial final y generará un reporte Excel.")) {
                const sessionData = await closeGameSession();
                if (sessionData) {
                  exportSessionToExcel(sessionData);
                  alert("✅ ¡Sesión cerrada exitosamente! Se ha descargado el archivo Excel con el resumen.");
                }
              }
            }}
          >
            <Save size={20} />
            Cerrar Sesión de Juego
          </button>
        </div>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Buy-in Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} className="text-gradient-green" />
            Nueva Transacción (Buy-in)
          </h3>
          <form onSubmit={handleBuyIn}>
            <div className="input-group">
              <label>Seleccionar Jugador</label>
              <select 
                className="input-field" 
                value={selectedPlayer} 
                onChange={(e) => setSelectedPlayer(e.target.value)}
                required
              >
                <option value="">-- Elija un jugador --</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Asiento {p.position})</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label>Monto (S/.)</label>
              <input 
                type="number" 
                className="input-field" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                min="1" 
                step="0.5"
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Procesar Buy-in
            </button>
          </form>
        </div>

        {/* Players List */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} className="text-gradient" />
              Jugadores Activos
            </h3>
            <button 
              className="btn-icon" 
              onClick={() => setShowAddPlayer(true)}
              title="Añadir Jugador"
              style={{ 
                background: 'linear-gradient(135deg, var(--primary), #d97706)', 
                border: 'none', 
                color: '#fff', 
                cursor: 'pointer', 
                padding: '0.6rem', 
                borderRadius: '50%',
                boxShadow: '0 4px 15px var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {players.length === 0 && <p className="text-muted">No hay jugadores en la mesa.</p>}
            {players.map(p => {
              const currentStack = Number(p.current_stack !== undefined ? p.current_stack : p.balance);
              const totalBuyIn = Number(p.balance);
              const profit = currentStack - totalBuyIn;
              const isWinning = profit > 0;
              const isLosing = profit < 0;

              return (
                <div key={p.id} className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', padding: '1rem', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: '1', minWidth: '150px' }}>
                    <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem', overflowWrap: 'break-word' }}>
                      Asiento {p.position} • <br/>{p.phone}
                    </div>
                  </div>
                  <div className="flex-center" style={{ gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                      <div className="currency-pen text-gradient-green" style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>
                        S/. {totalBuyIn.toFixed(2)}
                      </div>
                      {(isWinning || isLosing) && (
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: isWinning ? '#10b981' : '#f87171' }}>
                          {isWinning ? '+' : '-'} S/. {Math.abs(profit).toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className="btn-icon" 
                      title="Actualizar Fichas en Mesa"
                      style={{ background: 'rgba(245, 158, 11, 0.2)', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
                      onClick={() => {
                        setStackPlayer(p);
                        setNewStackAmount(currentStack);
                        setShowUpdateStack(true);
                      }}
                    >
                      <Coins size={16} />
                    </button>
                    <button 
                      className="btn-icon" 
                      title="Editar Jugador"
                      style={{ background: 'rgba(16, 185, 129, 0.2)', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
                      onClick={() => {
                        setEditPlayer(p);
                        setEditName(p.name);
                        setEditPhone(p.phone);
                        setEditBalance(p.balance);
                        setShowEditPlayer(true);
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon" 
                      title="Mover de Asiento"
                      style={{ background: 'rgba(59, 130, 246, 0.2)', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
                      onClick={() => {
                        setSeatPlayer(p);
                        setNewSeat(p.position);
                        setShowChangeSeat(true);
                      }}
                    >
                      <Move size={16} />
                    </button>
                    <button 
                      className="btn-icon" 
                      title="Retirar Jugador"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de retirar a ${p.name} de la mesa?`)) {
                          removePlayer(p.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Retired Players List */}
        {retiredPlayers.length > 0 ? (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Users size={20} />
                Jugadores Retirados (Historial)
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {retiredPlayers.map(p => {
                const isWinning = p.profit > 0;
                const isLosing = p.profit < 0;

                return (
                  <div key={p.id} className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', padding: '1rem', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', opacity: 0.8 }}>
                    <div style={{ flex: '1', minWidth: '150px' }}>
                      <div style={{ fontWeight: '600' }}>{p.name} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>(Retirado: {p.retiredAt})</span></div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Inversión Total: S/. {p.total_buyin || (p.balance)}
                      </div>
                    </div>
                    <div className="flex-center" style={{ gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                        <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                          Retiró: S/. {p.final_stack !== undefined ? p.final_stack.toFixed(2) : '0.00'}
                        </div>
                        {(isWinning || isLosing) && (
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: isWinning ? '#10b981' : '#f87171' }}>
                            {isWinning ? '+' : '-'} S/. {Math.abs(p.profit).toFixed(2)}
                          </div>
                        )}
                        {p.profit === 0 && (
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            S/. 0.00 (Empate)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginTop: '2rem', textAlign: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <Users size={20} />
              Jugadores Retirados (Historial)
            </h3>
            <p className="text-muted">No hay jugadores retirados en esta sesión todavía.</p>
          </div>
        )}

        {/* Past Sessions List */}
        {pastSessions && pastSessions.length > 0 ? (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Calendar size={20} />
                Historial de Sesiones de Juego
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pastSessions.map(session => (
                <div key={session.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>Sesión: {session.date}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Jugadores Totales: {session.total_players}
                      </div>
                    </div>
                    <div className="flex-center" style={{ gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Total Jugado (Caja)</div>
                        <div style={{ fontWeight: '700', color: '#fbbf24' }}>S/. {Number(session.total_pot).toFixed(2)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Total Retirado</div>
                        <div style={{ fontWeight: '700', color: 'var(--text-muted)' }}>S/. {Number(session.total_cashout).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Players in this session (Toggleable) */}
                  {session.player_history && session.player_history.length > 0 && (
                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <button 
                        onClick={() => toggleSessionDetails(session.id)}
                        style={{ 
                          width: '100%', 
                          background: 'transparent', 
                          border: 'none', 
                          padding: '0.75rem 0', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '0.5rem', 
                          color: 'var(--text-muted)', 
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {expandedSessions[session.id] ? (
                          <><ChevronUp size={16} /> Ocultar Jugadores</>
                        ) : (
                          <><ChevronDown size={16} /> Ver Jugadores de la Sesión ({session.player_history.length})</>
                        )}
                      </button>

                      {expandedSessions[session.id] && (
                        <div style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                        {session.player_history.map(player => (
                          <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: player.profit > 0 ? '#10b981' : player.profit < 0 ? '#f87171' : 'gray' }}></div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{player.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{player.phone || 'Sin número'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginTop: '2rem', textAlign: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <Calendar size={20} />
              Historial de Sesiones de Juego
            </h3>
            <p className="text-muted">Aún no has cerrado ninguna sesión de juego.</p>
          </div>
        )}
      </div>

      </div>

      {/* Add Player Modal */}
      {showAddPlayer && (
        <div className="modal-overlay flex-center">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} className="text-gradient" />
                Añadir Nuevo Jugador
              </h3>
              <button className="btn-icon" onClick={() => setShowAddPlayer(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              addPlayer({ name: newPlayerName, phone: newPlayerPhone, position: Number(newPlayerPosition) });
              setNewPlayerName('');
              setNewPlayerPhone('');
              setNewPlayerPosition(1);
              setShowAddPlayer(false);
            }}>
              
              <div style={{ marginBottom: '1.2rem' }}>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px dashed #60a5fa', padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                  onClick={handleContactSearch}
                >
                  <BookUser size={18} />
                  Buscar en Contactos del Celular
                </button>
              </div>

              <div className="input-group">
                <label>Nombre del Jugador</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newPlayerName} 
                  onChange={(e) => setNewPlayerName(e.target.value)} 
                  required 
                  placeholder="Ej. Martín Solis"
                />
              </div>

              <div className="input-group">
                <label>Teléfono (WhatsApp)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newPlayerPhone} 
                  onChange={(e) => setNewPlayerPhone(e.target.value)} 
                  required 
                  placeholder="Ej. 999888777"
                />
              </div>
              
              <div className="input-group">
                <label>Asiento en la Mesa</label>
                <select 
                  className="input-field" 
                  value={newPlayerPosition} 
                  onChange={(e) => setNewPlayerPosition(e.target.value)} 
                  required 
                >
                  <option value="">-- Elija un asiento libre --</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                    const occupant = getSeatStatus(num);
                    return (
                      <option key={num} value={num} disabled={!!occupant}>
                        Asiento {num} {occupant ? `(Ocupado por ${occupant.name})` : '(Libre)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Añadir a la Mesa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Seat Modal */}
      {showChangeSeat && seatPlayer && (
        <div className="modal-overlay flex-center">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Move size={20} className="text-gradient" />
                Mover a {seatPlayer.name}
              </h3>
              <button className="btn-icon" onClick={() => setShowChangeSeat(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              changeSeat(seatPlayer.id, Number(newSeat));
              setShowChangeSeat(false);
            }}>
              <div className="input-group">
                <label>Nuevo Asiento</label>
                <select 
                  className="input-field" 
                  value={newSeat} 
                  onChange={(e) => setNewSeat(e.target.value)} 
                  required 
                >
                  <option value="">-- Elija un asiento libre --</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                    const occupant = getSeatStatus(num);
                    const isCurrent = seatPlayer.position === num;
                    return (
                      <option key={num} value={num} disabled={!!occupant && !isCurrent}>
                        Asiento {num} {isCurrent ? '(Actual)' : (occupant ? `(Ocupado por ${occupant.name})` : '(Libre)')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Guardar Posición
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Update Stack Modal */}
      {showUpdateStack && stackPlayer && (
        <div className="modal-overlay flex-center">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Coins size={20} className="text-gradient-amber" style={{ color: '#fbbf24' }} />
                Contar Fichas de {stackPlayer.name}
              </h3>
              <button className="btn-icon" onClick={() => setShowUpdateStack(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              updateStack(stackPlayer.id, Number(newStackAmount));
              setShowUpdateStack(false);
            }}>
              <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                Ingresa el valor total de las fichas que el jugador tiene físicamente en su asiento en este momento.
              </p>
              
              <div className="input-group">
                <label>Fichas en Mesa (S/.)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={newStackAmount} 
                  onChange={(e) => setNewStackAmount(e.target.value)} 
                  min="0"
                  step="0.5"
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                Actualizar Fichas
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {showEditPlayer && editPlayer && (
        <div className="modal-overlay flex-center">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={20} className="text-gradient-green" style={{ color: '#10b981' }} />
                Editar Jugador
              </h3>
              <button className="btn-icon" onClick={() => setShowEditPlayer(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              updatePlayerDetails(editPlayer.id, editName, editPhone, Number(editBalance));
              setShowEditPlayer(false);
            }}>
              <div className="input-group">
                <label>Nombre del Jugador</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label>Número de Teléfono</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label>Total Inversión (S/.)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={editBalance} 
                  onChange={(e) => setEditBalance(e.target.value)} 
                  min="0"
                  step="0.5"
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Bot QR Modal */}
      {showQRModal && (
        <div className="modal-overlay animate-fade-in flex-center" style={{ zIndex: 100 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="flex-between mb-4">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={24} /> Escanear para conectar Bot
              </h3>
              <button className="btn-icon" onClick={() => setShowQRModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <p className="text-muted" style={{ marginBottom: '1rem' }}>Abre WhatsApp en tu celular, ve a "Dispositivos Vinculados" y escanea este código para conectar el sistema de envío automático.</p>
              {botQR ? (
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', display: 'inline-block' }}>
                  <img src={botQR} alt="WhatsApp QR Code" style={{ width: '250px', height: '250px' }} />
                </div>
              ) : (
                <div className="text-muted">Generando código QR...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
