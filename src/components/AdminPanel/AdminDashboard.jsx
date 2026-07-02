import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Users, Plus, DollarSign, X, Trash2, Move, Coins, Smartphone } from 'lucide-react';

const AdminDashboard = () => {
  const { players, totalPot, buyIn, addPlayer, removePlayer, changeSeat, updateStack, updatePhone } = useGame();
  
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

  // Update Phone state
  const [showUpdatePhone, setShowUpdatePhone] = useState(false);
  const [phonePlayer, setPhonePlayer] = useState(null);
  const [newPhone, setNewPhone] = useState('');

  const handleBuyIn = (e) => {
    e.preventDefault();
    if (selectedPlayer && amount) {
      buyIn(Number(selectedPlayer), Number(amount));
      setAmount('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <h2 className="text-gradient">Panel de Administración</h2>
        <div className="glass-panel" style={{ padding: '1rem 2rem' }}>
          <span className="text-muted">Caja Total (PEN): </span>
          <span className="currency-pen text-gradient-green" style={{ fontSize: '1.5rem' }}>S/. {totalPot.toFixed(2)}</span>
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
                <div key={p.id} className="glass-panel flex-between" style={{ padding: '1rem', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: '1', minWidth: 0, paddingRight: '0.5rem' }}>
                    <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem', overflowWrap: 'break-word' }}>
                      Asiento {p.position} • <br/>{p.phone}
                    </div>
                  </div>
                  <div className="flex-center" style={{ gap: '0.75rem', flexShrink: 0 }}>
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
                      title="Editar Número"
                      style={{ background: 'rgba(16, 185, 129, 0.2)', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
                      onClick={() => {
                        setPhonePlayer(p);
                        setNewPhone(p.phone);
                        setShowUpdatePhone(true);
                      }}
                    >
                      <Smartphone size={16} />
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

      {/* Update Phone Modal */}
      {showUpdatePhone && phonePlayer && (
        <div className="modal-overlay flex-center">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smartphone size={20} className="text-gradient-green" style={{ color: '#10b981' }} />
                Editar Número de {phonePlayer.name}
              </h3>
              <button className="btn-icon" onClick={() => setShowUpdatePhone(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              updatePhone(phonePlayer.id, newPhone);
              setShowUpdatePhone(false);
            }}>
              
              <div className="input-group">
                <label>Número de Teléfono</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)} 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                Guardar Número
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
