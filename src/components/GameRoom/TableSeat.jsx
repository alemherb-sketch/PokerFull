import React from 'react';

const TableSeat = ({ position, player, totalSeats }) => {
  // Fixed optimal positions for a 10-seat oval poker table (percentages)
  const seatPositions = [
    { left: 50, top: -5 },   // Seat 1: Top Center
    { left: 85, top: 8 },    // Seat 2: Top Right
    { left: 102, top: 32 },  // Seat 3: Mid-Top Right
    { left: 102, top: 68 },  // Seat 4: Mid-Bottom Right
    { left: 85, top: 92 },   // Seat 5: Bottom Right
    { left: 50, top: 105 },  // Seat 6: Bottom Center
    { left: 15, top: 92 },   // Seat 7: Bottom Left
    { left: -2, top: 68 },   // Seat 8: Mid-Bottom Left
    { left: -2, top: 32 },   // Seat 9: Mid-Top Left
    { left: 15, top: 8 },    // Seat 10: Top Left
  ];

  // Fallback to center if position is invalid
  const posIndex = (position - 1) % 10;
  const { left, top } = seatPositions[posIndex] || { left: 50, top: 50 };

  let profit = 0;
  let isWinning = false;
  let isLosing = false;

  if (player) {
    const currentStack = Number(player.current_stack !== undefined ? player.current_stack : player.balance);
    const totalBuyIn = Number(player.balance);
    profit = currentStack - totalBuyIn;
    isWinning = profit > 0;
    isLosing = profit < 0;
  }

  return (
    <div 
      className={`table-seat ${player ? 'occupied' : 'empty'}`}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="seat-avatar flex-center">
        {player ? (
          <span className="initials">{player.name.substring(0,2).toUpperCase()}</span>
        ) : (
          <span className="seat-number">{position}</span>
        )}
      </div>
      
      {player && (
        <div className="seat-info glass-panel">
          <span className="player-name">{player.name}</span>
          <span className="player-balance currency-pen">
            S/. {Number(player.balance).toFixed(2)}
          </span>
          {(isWinning || isLosing) && (
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isWinning ? '#10b981' : '#f87171', marginTop: '0.1rem' }}>
              {isWinning ? '+' : '-'} S/. {Math.abs(profit).toFixed(2)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TableSeat;
