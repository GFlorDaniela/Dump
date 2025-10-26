import React, { useState } from "react";
import "../css/form.css";

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simular autenticación con vulnerabilidades
      // VULNERABILIDAD: SQL Injection posible
      const users = [
        { id: 1, username: "abuela", password: "abuela123", role: "user", email: "abuela@recetas.com" },
        { id: 2, username: "admin", password: "ChefObscuro123!", role: "admin", email: "admin@recetas.com" },
        { id: 3, username: "chef_obscuro", password: "DarkChef2024!", role: "admin", email: "chef@obscuro.com" }
      ];

      // Vulnerabilidad SQL Injection simulada
      const user = users.find(u => 
        u.username === formData.username && u.password === formData.password
      );

      if (user) {
        onLogin(user);
      } else {
        setError("Credenciales incorrectas");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
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
          <h3>💡 Credenciales de Prueba:</h3>
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
          </div>
        </div>

        {/* VULNERABILIDAD: Pista oculta para SQL Injection */}
        <div className="vulnerability-hint">
          <p><small>💡 Pista de seguridad: Intenta usar <code>' OR '1'='1' --</code> en usuario</small></p>
        </div>
      </div>
    </div>
  );
};

export default Login;