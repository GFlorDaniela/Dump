// components/Dashboard.jsx
import React, { useState, useEffect } from "react";

const Dashboard = ({ 
  user, 
  recetas, 
  recetasBloqueadas,
  onViewRecetas, 
  onViewPerfil,
  onBuscarRecetas,
  onGetLogs
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [recetasBuscadas, setRecetasBuscadas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [mostrandoBusqueda, setMostrandoBusqueda] = useState(false);
  
  // Cargar logs al montar el componente
  useEffect(() => {
    const loadLogs = async () => {
      const logsData = await onGetLogs();
      setLogs(logsData);
    };
    loadLogs();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const resultados = await onBuscarRecetas(searchTerm);
      setRecetasBuscadas(resultados);
      setMostrandoBusqueda(true);
    } else {
      setMostrandoBusqueda(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setMostrandoBusqueda(false);
    setRecetasBuscadas([]);
  };

  const recetasParaMostrar = mostrandoBusqueda ? recetasBuscadas : recetas.filter(r => !r.bloqueada);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👵 ¡Bienvenida de vuelta, {user?.username}!</h1>
        <p>Tu libro de recetas secretas familiares</p>
      </div>

      <div className="dashboard-actions">
        <form onSubmit={handleSearch} className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar recetas por nombre o ingredientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
          {mostrandoBusqueda && (
            <button type="button" onClick={clearSearch} className="btn btn-secondary">
              Limpiar
            </button>
          )}
        </form>

        <div className="action-buttons">
          <button onClick={onViewRecetas} className="btn btn-secondary">
            📖 Ver Todas las Recetas
          </button>
          <button onClick={onViewPerfil} className="btn btn-info">
            👤 Mi Perfil
          </button>
        </div>
      </div>

      {mostrandoBusqueda && (
        <div className="search-results-info">
          <p>
            Resultados de búsqueda para: <strong>"{searchTerm}"</strong> 
            ({recetasBuscadas.length} recetas encontradas)
          </p>
        </div>
      )}

      <div className="recipes-section">
        <h2>🍽️ {mostrandoBusqueda ? 'Recetas Encontradas' : 'Recetas Disponibles'}</h2>
        <div className="recipes-grid">
          {recetasParaMostrar.map(receta => (
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

        {recetasParaMostrar.length === 0 && (
          <div className="no-recipes">
            <p>No se encontraron recetas.</p>
          </div>
        )}
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

      {/* VULNERABILIDAD: Information Disclosure - Logs visibles para todos */}
      <div className="logs-section">
        <h3>📋 Logs del Sistema (Visible para todos los usuarios)</h3>
        <div className="logs-container">
          {logs.slice(0, 5).map(log => (
            <div key={log.id} className="log-entry">
              <span className="log-time">{log.timestamp}</span>
              <span className="log-event">{log.event}</span>
              <span className="log-details">{log.details}</span>
            </div>
          ))}
        </div>
        <p className="hint-text">
          💡 <strong>VULNERABILIDAD:</strong> Los logs del sistema deberían ser solo para administradores
        </p>
      </div>

      {user?.role === 'admin' && (
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
        <p>💡 Prueba usar <code>' OR '1'='1' --</code> en la búsqueda para SQL Injection</p>
      </div>
    </div>
  );
};

export default Dashboard;