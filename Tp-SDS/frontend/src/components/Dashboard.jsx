// components/Dashboard.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from "react";

const Dashboard = ({ 
  user, 
  recetas, 
  recetasBloqueadas,
  onViewRecetas, 
  onViewPerfil,
  onBuscarRecetas,
  onGetLogs,
  gamePlayer,
  onShowFlagSubmission,
  onShowLeaderboard
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [recetasBuscadas, setRecetasBuscadas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [mostrandoBusqueda, setMostrandoBusqueda] = useState(false);
  
  // Cargar logs al montar el componente
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const logsData = await onGetLogs();
        // Asegurarnos de que logs sea un array
        if (logsData && Array.isArray(logsData.logs)) {
          setLogs(logsData.logs);
        } else if (Array.isArray(logsData)) {
          setLogs(logsData);
        } else {
          setLogs([]);
        }
      } catch (error) {
        console.error("Error cargando logs:", error);
        setLogs([]);
      }
    };
    loadLogs();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      try {
        const resultados = await onBuscarRecetas(searchTerm);
        // Asegurarnos de que sea un array
        if (resultados && Array.isArray(resultados.recetas)) {
          setRecetasBuscadas(resultados.recetas);
        } else if (Array.isArray(resultados)) {
          setRecetasBuscadas(resultados);
        } else {
          setRecetasBuscadas([]);
        }
        setMostrandoBusqueda(true);
      } catch (error) {
        console.error("Error en búsqueda:", error);
        setRecetasBuscadas([]);
        setMostrandoBusqueda(true);
      }
    } else {
      setMostrandoBusqueda(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setMostrandoBusqueda(false);
    setRecetasBuscadas([]);
  };

  // Asegurarnos de que recetasParaMostrar sea siempre un array
  const recetasParaMostrar = mostrandoBusqueda 
    ? (Array.isArray(recetasBuscadas) ? recetasBuscadas : [])
    : (Array.isArray(recetas) ? recetas.filter(r => !r.bloqueada) : []);

  return (
    <div className="dashboard-container">
      {/* Header con controles de juego */}
      <div className="dashboard-header">
        <div className="header-main">
          <h1>👵 ¡Bienvenida de vuelta, {user?.username}!</h1>
          <p>Tu libro de recetas secretas familiares</p>
        </div>

        {/* Controles de gamificación */}
        <div className="game-controls-panel">
          {gamePlayer ? (
            <div className="player-stats">
              <div className="player-info-card">
                <h4>🎮 Jugador: {gamePlayer.nickname}</h4>
                <div className="player-stats-grid">
                  <div className="stat">
                    <span className="stat-label">Puntos:</span>
                    <span className="stat-value">{gamePlayer.total_score || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Nivel:</span>
                    <span className="stat-value">
                      {(gamePlayer.total_score || 0) >= 500 ? 'Hacker Senior' : 
                       (gamePlayer.total_score || 0) >= 300 ? 'Hacker Intermedio' : 
                       (gamePlayer.total_score || 0) >= 100 ? 'Hacker Junior' : 'Novato'}
                    </span>
                  </div>
                </div>
                <div className="game-buttons">
                  <button onClick={onShowFlagSubmission} className="btn btn-success btn-small">
                    🚩 Enviar Flag
                  </button>
                  <button onClick={onShowLeaderboard} className="btn btn-warning btn-small">
                    🏆 Ver Podio
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="game-invite">
              <p>🎯 <strong>¿Listo para el desafío?</strong></p>
              <p>Regístrate para competir y ganar puntos</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary btn-small"
              >
                🎮 Registrarse
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sección de búsqueda y acciones */}
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

      {/* Información de búsqueda */}
      {mostrandoBusqueda && (
        <div className="search-results-info">
          <p>
            Resultados de búsqueda para: <strong>"{searchTerm}"</strong> 
            ({recetasBuscadas.length} recetas encontradas)
          </p>
        </div>
      )}

      {/* Recetas disponibles */}
      <div className="recipes-section">
        <h2>🍽️ {mostrandoBusqueda ? 'Recetas Encontradas' : 'Recetas Disponibles'}</h2>
        <div className="recipes-grid">
          {recetasParaMostrar.length > 0 ? (
            recetasParaMostrar.map(receta => (
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
            ))
          ) : (
            <div className="no-recipes">
              <p>No se encontraron recetas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recetas bloqueadas */}
      {recetasBloqueadas && recetasBloqueadas.length > 0 && (
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
                {gamePlayer && (
                  <div className="flag-hint">
                    <small>💡 Encuentra la flag al desbloquear esta receta</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VULNERABILIDAD: Information Disclosure - Logs visibles para todos */}
      <div className="logs-section">
        <h3>📋 Logs del Sistema (Visible para todos los usuarios)</h3>
        <div className="logs-container">
          {Array.isArray(logs) && logs.length > 0 ? (
            logs.slice(0, 5).map(log => (
              <div key={log.id} className="log-entry">
                <span className="log-time">{log.timestamp}</span>
                <span className="log-event">{log.event}</span>
                <span className="log-details">{log.details}</span>
              </div>
            ))
          ) : (
            <p>No hay logs disponibles</p>
          )}
        </div>
        <p className="hint-text">
          💡 <strong>VULNERABILIDAD:</strong> Los logs del sistema deberían ser solo para administradores
        </p>
        {gamePlayer && (
          <div className="flag-alert">
            <p>🎯 <strong>Flag disponible:</strong> Revisa los logs cuidadosamente</p>
          </div>
        )}
      </div>

      {/* Panel de administrador */}
      {user?.role === 'admin' && (
        <div className="admin-panel">
          <div className="admin-notice">
            <h3>⚙️ Modo Administrador Activado</h3>
            <p>Tienes acceso completo al sistema de recetas.</p>
          </div>
        </div>
      )}

      {/* Sección educativa de seguridad */}
      <div className="security-hint">
        <h3>🔍 Desafío de Seguridad</h3>
        <div className="vulnerability-list">
          <div className="vuln-item">
            <h4>💉 SQL Injection</h4>
            <p>Prueba: <code>' OR '1'='1' --</code> en usuario o contraseña</p>
            {gamePlayer && <span className="flag-indicator">🚩 Flag disponible</span>}
          </div>
          <div className="vuln-item">
            <h4>🔓 IDOR</h4>
            <p>Cambia los IDs en las URLs para acceder a recursos de otros usuarios</p>
            {gamePlayer && <span className="flag-indicator">🚩 Flag disponible</span>}
          </div>
          <div className="vuln-item">
            <h4>📢 Information Disclosure</h4>
            <p>Encuentra información sensible en los logs del sistema</p>
            {gamePlayer && <span className="flag-indicator">🚩 Flag disponible</span>}
          </div>
          <div className="vuln-item">
            <h4>🔐 Weak Authentication</h4>
            <p>Adivina contraseñas débiles en recetas bloqueadas</p>
            {gamePlayer && <span className="flag-indicator">🚩 Flag disponible</span>}
          </div>
        </div>

        {gamePlayer && (
          <div className="game-instructions">
            <h4>🎮 Instrucciones del Juego:</h4>
            <ul>
              <li>🔍 Explota vulnerabilidades para encontrar flags</li>
              <li>🚩 Envía las flags encontradas para ganar puntos</li>
              <li>🏆 Compite por el primer lugar en el podio</li>
              <li>💡 Revisa logs y perfiles para encontrar pistas</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;