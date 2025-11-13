import React, { useState } from "react";

const GameRegistration = ({ onRegister, onCancel }) => {
  const [formData, setFormData] = useState({
    nickname: "",
    email: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(formData.nickname, formData.email);
  };

  return (
    <div className="game-registration">
      <div className="registration-card">
        <div className="registration-header">
          <h2>🎮 Registro para el Desafío de Seguridad</h2>
          <p>¡Compite con otros hackers y demuestra tus habilidades!</p>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="nickname">🎯 Nickname</label>
            <input
              type="text"
              id="nickname"
              value={formData.nickname}
              onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              required
              placeholder="Tu nombre de hacker"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">📧 Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              placeholder="tu.email@ejemplo.com"
              className="form-input"
            />
          </div>

          <div className="registration-actions">
            <button type="submit" className="btn btn-primary">
              🚀 Comenzar Desafío
            </button>
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              ↩️ Volver
            </button>
          </div>
        </form>

        <div className="game-rules">
          <h3>📋 Reglas del Juego</h3>
          <ul>
            <li>🎯 Encuentra y explota vulnerabilidades en la aplicación</li>
            <li>🚩 Cada vulnerabilidad tiene un flag único</li>
            <li>📊 Gana puntos por cada flag encontrada</li>
            <li>🏆 Compite por el primer lugar en el podio</li>
            <li>⚠️ Solo fines educativos - No uses en sistemas reales</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameRegistration;