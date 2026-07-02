import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { supabase } from '../../supabaseClient';
import { Users, Plus, DollarSign, X, Trash2, Move, Coins, Edit2, Save } from 'lucide-react';
import { exportSessionToExcel } from '../../utils/excelExport';

const AdminDashboard = () => {
  const { players, retiredPlayers, totalPot, buyIn, addPlayer, removePlayer, changeSeat, updateStack, updatePlayerDetails, closeGameSession } = useGame();
  
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

  const handleBuyIn = (e) => {
    e.preventDefault();
    if (selectedPlayer && amount) {
      buyIn(Number(selectedPlayer), Number(amount));
      setAmount('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="text-gradient">Panel de Administración</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '1rem 2rem' }}>
            <span className="text-muted">Caja Total (PEN): </span>
            <span className="currency-pen text-gradient-green" style={{ fontSize: '1.5rem' }}>S/. {totalPot.toFixed(2)}</span>
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
              className="btn btn-secondary btn-icon" 
              onClick={() => setShowAddPlayer(true)}
              title="Añadir Jugador"
            >
              <Plus size={18} />
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
        {retiredPlayers.length > 0 && (
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
        )}
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
                  placeholder="Ej. +51999888777"
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
    </div>
  );
};

export default AdminDashboard;
