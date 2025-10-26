import React, { useState, useEffect } from "react";

const Perfil = ({ user, onBack }) => {
  const [perfilUsuario, setPerfilUsuario] = useState(user);
  const [userId, setUserId] = useState(user.id);

  // VULNERABILIDAD IDOR: Permite ver cualquier perfil cambiando el ID
  const usuarios = [
    { id: 1, username: "abuela", role: "user", email: "abuela@recetas.com", full_name: "María González" },
    { id: 2, username: "admin", role: "admin", email: "admin@recetas.com", full_name: "Administrador Sistema" },
    { id: 3, username: "chef_obscuro", role: "admin", email: "chef@obscuro.com", full_name: "Chef Obscuro" },
    { id: 4, username: "juan_perez", role: "user", email: "juan@recetas.com", full_name: "Juan Pérez" }
  ];

  useEffect(() => {
    const usuarioEncontrado = usuarios.find(u => u.id === parseInt(userId));
    if (usuarioEncontrado) {
      setPerfilUsuario(usuarioEncontrado);
    }
  }, [userId]);

  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button onClick={onBack} className="btn btn-back">
          ← Volver al Dashboard
        </button>
        <h1>👤 Perfil de Usuario</h1>
      </div>

      {/* VULNERABILIDAD IDOR: Selector de usuario */}
      <div className="idor-section">
        <div className="idor-controls">
          <label htmlFor="userSelect">Ver perfil del usuario ID:</label>
          <select 
            id="userSelect"
            value={userId} 
            onChange={handleUserIdChange}
            className="form-select"
          >
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>
                {u.username} (ID: {u.id})
              </option>
            ))}
          </select>
        </div>
        <p className="hint-text">
          💡 <strong>VULNERABILIDAD IDOR:</strong> Puedes ver el perfil de cualquier usuario sin autorización
        </p>
      </div>

      {perfilUsuario && (
        <div className="profile-card">
          <div className="profile-avatar">
            {perfilUsuario.username.charAt(0).toUpperCase()}
          </div>
          
          <div className="profile-info">
            <h2>{perfilUsuario.full_name}</h2>
            <div className={`role-badge role-${perfilUsuario.role}`}>
              {perfilUsuario.role}
            </div>
            
            <div className="profile-details">
              <div className="detail-item">
                <strong>👤 Username:</strong> {perfilUsuario.username}
              </div>
              <div className="detail-item">
                <strong>📧 Email:</strong> {perfilUsuario.email}
              </div>
              <div className="detail-item">
                <strong>🆔 ID de Usuario:</strong> {perfilUsuario.id}
              </div>
              <div className="detail-item">
                <strong>🔑 Rol:</strong> {perfilUsuario.role}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="vulnerability-explanation">
        <h3>🔓 Explicación de la Vulnerabilidad IDOR</h3>
        <p>
          <strong>Insecure Direct Object References (IDOR)</strong> ocurre cuando una aplicación permite 
          a un usuario acceder a recursos (como perfiles de otros usuarios) cambiando simplemente 
          el ID en la URL o parámetros, sin verificar permisos adecuados.
        </p>
        
        <div className="vulnerability-example">
          <h4>📝 Ejemplo de Explotación:</h4>
          <code>
            /perfil?user_id=1 → Tu perfil<br/>
            /perfil?user_id=2 → Perfil del administrador<br/>
            /perfil?user_id=3 → Perfil del Chef Obscuro
          </code>
        </div>

        <div className="prevention-tips">
          <h4>🛡️ Cómo Prevenir IDOR:</h4>
          <ul>
            <li>Implementar autorización a nivel de objeto</li>
            <li>Usar UUIDs en lugar de IDs secuenciales</li>
            <li>Verificar permisos en cada endpoint</li>
            <li>Utilizar sistemas de ACL (Access Control Lists)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Perfil;