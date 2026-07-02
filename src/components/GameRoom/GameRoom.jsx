import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import TableSeat from './TableSeat';
import { X, DollarSign } from 'lucide-react';
import './GameRoom.css';

const GameRoom = () => {
  const { players, buyIn, totalPot } = useGame();
  const totalSeats = 10;
  
  const [showModal, setShowModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [amount, setAmount] = useState('');

  const handleBuyIn = (e) => {
    e.preventDefault();
    if (selectedPlayer && amount) {
      buyIn(Number(selectedPlayer), Number(amount));
      setAmount('');
      setShowModal(false);
    }
  };

  // Render seats 1 to 10
  const renderSeats = () => {
    let seats = [];
    for (let i = 1; i <= totalSeats; i++) {
      const player = players.find(p => p.position === i);
      seats.push(<TableSeat key={i} position={i} player={player} totalSeats={totalSeats} />);
    }
    return seats;
  };

  return (
    <div className="game-room animate-fade-in">
      <div className="room-header flex-between">
        <div>
          <h2 className="text-gradient">Sala Principal VIP</h2>
          <p className="text-muted">Ciegas: S/. 5 / S/. 10</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Comprar Fichas (Buy-in)
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay flex-center">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} className="text-gradient-green" />
                Nueva Transacción (Buy-in)
              </h3>
              <button className="btn-icon" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
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
        </div>
      )}

      <div className="poker-table-container">
        <div className="poker-table glass-panel">
          <div className="table-inner">
            <span className="table-logo">PokerFull</span>
            <span className="pot-total text-gradient-green">S/. {totalPot.toFixed(2)}</span>
          </div>
          {renderSeats()}
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
