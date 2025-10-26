import React, { useState } from "react";

const Dashboard = ({ user, recetas, onViewRecetas, onViewPerfil }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const recetasDisponibles = recetas.filter(r => !r.bloqueada);
  const recetasBloqueadas = recetas.filter(r => r.bloqueada);

  const filteredRecetas = recetasDisponibles.filter(receta =>
    receta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receta.ingredientes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👵 ¡Bienvenida de vuelta, {user.username}!</h1>
        <p>Tu libro de recetas secretas familiares</p>
      </div>

      <div className="dashboard-actions">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar recetas por nombre o ingredientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="action-buttons">
          <button onClick={onViewRecetas} className="btn btn-secondary">
            📖 Ver Todas las Recetas
          </button>
          <button onClick={onViewPerfil} className="btn btn-info">
            👤 Mi Perfil
          </button>
        </div>
      </div>

      <div className="recipes-section">
        <h2>🍽️ Recetas Disponibles</h2>
        <div className="recipes-grid">
          {filteredRecetas.map(receta => (
            <div key={receta.id} className="recipe-card">
              <div className="recipe-category">{receta.categoria}</div>
              <h3>{receta.nombre}</h3>
              <p className="recipe-ingredients">
                <strong>Ingredientes:</strong> {receta.ingredientes}
              </p>
              <div className="recipe-actions">
                <button className="btn btn-small btn-primary">
                  Ver Receta Completa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {recetasBloqueadas.length > 0 && (
        <div className="blocked-section">
          <h2>🔒 Recetas Bloqueadas por el Chef Obscuro</h2>
          <p>¡El Chef Obscuro ha bloqueado estas recetas familiares secretas!</p>
          <div className="recipes-grid">
            {recetasBloqueadas.map(receta => (
              <div key={receta.id} className="recipe-card blocked">
                <div className="recipe-category secret">{receta.categoria}</div>
                <h3>{receta.nombre}</h3>
                <p className="recipe-status">🔐 BLOQUEADA - Se requiere contraseña</p>
                <div className="recipe-actions">
                  <button className="btn btn-small btn-warning">
                    Intentar Desbloquear
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {user.role === 'admin' && (
        <div className="admin-panel">
          <div className="admin-notice">
            <h3>⚙️ Modo Administrador Activado</h3>
            <p>Tienes acceso completo al sistema de recetas.</p>
          </div>
        </div>
      )}

      {/* VULNERABILIDAD: Pista para IDOR */}
      <div className="security-hint">
        <h3>🔍 Desafío de Seguridad</h3>
        <p>¿Puedes acceder a las recetas de otros usuarios? Prueba cambiar los IDs en las URLs.</p>
      </div>
    </div>
  );
};

export default Dashboard;