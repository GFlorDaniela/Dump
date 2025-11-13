import React, { useState, useEffect } from "react";

const Leaderboard = ({ currentPlayer, onClose }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/game/leaderboard');
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedal = (position) => {
    switch(position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return position;
    }
  };

  if (loading) {
    return <div className="loading">Cargando podio...</div>;
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <h2>🏆 Podio de Hackers</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="leaderboard-list">
          {leaderboard.map(player => (
            <div 
              key={player.position} 
              className={`leaderboard-item ${currentPlayer && currentPlayer.id === player.id ? 'current-player' : ''}`}
            >
              <div className="player-position">
                {getMedal(player.position)}
              </div>
              
              <div className="player-info">
                <div className="player-nickname">{player.nickname}</div>
                <div className="player-stats">
                  {player.total_score} pts • {player.flags_completed} flags
                </div>
              </div>
              
              <div className="player-score">
                {player.total_score}
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="empty-leaderboard">
            <p>🎯 Sé el primero en completar una vulnerabilidad!</p>
          </div>
        )}

        <div className="leaderboard-actions">
          <button onClick={loadLeaderboard} className="btn btn-secondary">
            🔄 Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;