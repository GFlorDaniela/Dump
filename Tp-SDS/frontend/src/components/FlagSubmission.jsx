import React, { useState } from "react";

const FlagSubmission = ({ player, onSubmitFlag, onClose }) => {
  const [flag, setFlag] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flag.trim()) return;

    const result = await onSubmitFlag(player.id, flag.trim());
    setMessage(result.message);
    
    if (result.success) {
      setFlag("");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="flag-submission">
      <div className="flag-card">
        <div className="flag-header">
          <h3>🚩 Enviar Flag</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="player-info">
          <strong>Jugador:</strong> {player.nickname} | 
          <strong> Puntos:</strong> {player.total_score}
        </div>

        <form onSubmit={handleSubmit} className="flag-form">
          <div className="form-group">
            <label htmlFor="flag">🔑 Flag Encontrada</label>
            <input
              type="text"
              id="flag"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Pega aquí el flag que encontraste"
              className="form-input"
            />
          </div>

          <button type="submit" className="btn btn-success">
            ✅ Enviar Flag
          </button>
        </form>

        {message && (
          <div className={`flag-message ${message.includes('¡') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="flag-hints">
          <h4>💡 ¿Dónde encontrar flags?</h4>
          <ul>
            <li>🔓 Al desbloquear recetas secretas</li>
            <li>💉 Al explotar SQL Injection exitosamente</li>
            <li>👥 Al acceder a recursos con IDOR</li>
            <li>📋 En información sensible encontrada</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FlagSubmission;