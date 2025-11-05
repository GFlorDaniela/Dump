// components/Login.jsx - Versión actualizada
import React, { useState } from "react";
import "../css/form.css";

const Login = ({ onLogin, error, loading }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onLogin(formData.username, formData.password);
  };

  return (
    <div className="login-container">
      <div className="recipe-card">
        <div className="recipe-header">
          <h1>🍪 Abuela Cripto</h1>
          <p className="recipe-subtitle">Recetas Secretas Familiares</p>
        </div>

        <div className="recipe-info">
          <p>El Chef Obscuro ha bloqueado nuestras recetas familiares. ¡Necesitamos tu ayuda para recuperarlas!</p>
        </div>

        <form onSubmit={handleSubmit} className="recipe-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">👤 Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Ingresa tu usuario"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">🔑 Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Ingresa tu contraseña"
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : '🔑 Entrar a la Cocina'}
          </button>
        </form>

        <div className="login-hints">
          <h3>💡 Credenciales de Prueba (Backend Real):</h3>
          <div className="credentials-grid">
            <div className="credential-card">
              <strong>Usuario:</strong> abuela<br/>
              <strong>Contraseña:</strong> abuela123<br/>
              <em>Rol: Usuario normal</em>
            </div>
            <div className="credential-card">
              <strong>Usuario:</strong> admin<br/>
              <strong>Contraseña:</strong> ChefObscuro123!<br/>
              <em>Rol: Administrador</em>
            </div>
            <div className="credential-card">
              <strong>Usuario:</strong> chef_obscuro<br/>
              <strong>Contraseña:</strong> DarkChef2024!<br/>
              <em>Rol: Administrador</em>
            </div>
          </div>
        </div>

        {/* VULNERABILIDAD: Pista oculta para SQL Injection */}
        <div className="vulnerability-hint">
          <p><small>💡 Pista de seguridad: Intenta usar <code>' OR '1'='1' --</code> en usuario o contraseña</small></p>
        </div>
      </div>
    </div>
  );
};

export default Login;