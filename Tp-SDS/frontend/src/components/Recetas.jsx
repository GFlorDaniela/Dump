import React, { useState, useEffect } from "react";

const Recetas = ({ recetas, onBack }) => {
  const [recetasFiltradas, setRecetasFiltradas] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [password, setPassword] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  // Categorías disponibles
  const categorias = [
    "todas",
    "sopas",
    "postres", 
    "salsas",
    "guisos",
    "ensaladas",
    "pastas"
  ];

  // Efecto para filtrar recetas
  useEffect(() => {
    let resultado = [...recetas];

    // Filtrar por categoría
    if (filtroCategoria !== "todas") {
      resultado = resultado.filter(receta => 
        receta.categoria === filtroCategoria
      );
    }

    // Filtrar por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(receta =>
        receta.nombre.toLowerCase().includes(termino) ||
        receta.ingredientes.toLowerCase().includes(termino) ||
        receta.categoria.toLowerCase().includes(termino)
      );
    }

    setRecetasFiltradas(resultado);
  }, [recetas, filtroCategoria, busqueda]);

  // Manejar ver receta (con vulnerabilidad IDOR)
  const handleVerReceta = (recetaId) => {
    // VULNERABILIDAD IDOR: No verifica permisos, permite ver cualquier receta
    const receta = recetas.find(r => r.id === recetaId);
    
    if (receta) {
      if (receta.bloqueada) {
        setRecetaSeleccionada(receta);
        setPassword("");
        setErrorPassword("");
      } else {
        setRecetaSeleccionada(receta);
      }
    }
  };

  // Manejar desbloqueo de receta
  const handleDesbloquearReceta = () => {
    if (!recetaSeleccionada) return;

    // VULNERABILIDAD: Verificación débil de contraseña
    if (password === recetaSeleccionada.password_bloqueo) {
      setErrorPassword("");
      // En una app real, aquí marcaríamos la receta como desbloqueada
      alert(`¡Éxito! Receta "${recetaSeleccionada.nombre}" desbloqueada.`);
      setRecetaSeleccionada(null);
      setPassword("");
    } else {
      setErrorPassword("Contraseña incorrecta. El Chef Obscuro ha bloqueado esta receta.");
    }
  };

  // Obtener icono por categoría
  const getIconoCategoria = (categoria) => {
    const iconos = {
      sopas: "🍲",
      postres: "🍰",
      salsas: "🥫",
      guisos: "🍛",
      ensaladas: "🥗",
      pastas: "🍝"
    };
    return iconos[categoria] || "📄";
  };

  // Obtener color por categoría
  const getColorCategoria = (categoria) => {
    const colores = {
      sopas: "bg-orange-100 border-orange-300 text-orange-800",
      postres: "bg-pink-100 border-pink-300 text-pink-800",
      salsas: "bg-red-100 border-red-300 text-red-800",
      guisos: "bg-amber-100 border-amber-300 text-amber-800",
      ensaladas: "bg-green-100 border-green-300 text-green-800",
      pastas: "bg-blue-100 border-blue-300 text-blue-800"
    };
    return colores[categoria] || "bg-gray-100 border-gray-300 text-gray-800";
  };

  // Modal de receta
  const ModalReceta = () => {
    if (!recetaSeleccionada) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              {recetaSeleccionada.bloqueada ? "🔒" : "📜"} {recetaSeleccionada.nombre}
            </h2>
            <button 
              onClick={() => setRecetaSeleccionada(null)}
              className="modal-close"
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            {recetaSeleccionada.bloqueada ? (
              <div className="receta-bloqueada">
                <div className="bloqueo-icono">🔒</div>
                <h3 className="bloqueo-titulo">Receta Bloqueada</h3>
                <p className="bloqueo-descripcion">
                  El Chef Obscuro ha protegido esta receta familiar con una contraseña.
                </p>
                
                <div className="bloqueo-form">
                  <label htmlFor="password" className="bloqueo-label">
                    Contraseña de desbloqueo:
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa la contraseña secreta..."
                    className="bloqueo-input"
                  />
                  {errorPassword && (
                    <p className="error-message">{errorPassword}</p>
                  )}
                  
                  <button 
                    onClick={handleDesbloquearReceta}
                    className="btn btn-warning bloqueo-btn"
                  >
                    🔓 Desbloquear Receta
                  </button>
                </div>

                <div className="bloqueo-pistas">
                  <h4>💡 Pistas para encontrar la contraseña:</h4>
                  <ul>
                    <li>Revisa los logs del sistema en el dashboard</li>
                    <li>Busca información en los perfiles de usuario</li>
                    <li>Examina todas las recetas disponibles</li>
                    <li>Prueba con contraseñas comunes del Chef Obscuro</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="receta-completa">
                <div className="receta-info">
                  <div className={`categoria-badge ${getColorCategoria(recetaSeleccionada.categoria)}`}>
                    {getIconoCategoria(recetaSeleccionada.categoria)} {recetaSeleccionada.categoria}
                  </div>
                  
                  <div className="receta-seccion">
                    <h3>📋 Ingredientes</h3>
                    <p className="receta-texto">{recetaSeleccionada.ingredientes}</p>
                  </div>

                  <div className="receta-seccion">
                    <h3>👩‍🍳 Instrucciones</h3>
                    <p className="receta-texto">{recetaSeleccionada.instrucciones}</p>
                  </div>

                  {/* VULNERABILIDAD: Information Disclosure */}
                  <div className="receta-metadata">
                    <p><strong>ID de Receta:</strong> {recetaSeleccionada.id}</p>
                    <p><strong>ID del Usuario:</strong> {recetaSeleccionada.user_id}</p>
                    <p><strong>Estado:</strong> {recetaSeleccionada.bloqueada ? "🔒 Bloqueada" : "🔓 Disponible"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="recetas-container">
      {/* Header */}
      <div className="recetas-header">
        <button onClick={onBack} className="btn btn-back">
          ← Volver al Dashboard
        </button>
        <h1>📚 Todas las Recetas</h1>
        <p className="recetas-subtitle">
          Explora nuestra colección completa de recetas familiares
        </p>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filtros-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar recetas por nombre, ingredientes o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filtros-categorias">
          <label htmlFor="categoria-select" className="filtro-label">
            Filtrar por categoría:
          </label>
          <select
            id="categoria-select"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="filtro-select"
          >
            {categorias.map(categoria => (
              <option key={categoria} value={categoria}>
                {categoria === "todas" ? "🌈 Todas las categorías" : 
                 `${getIconoCategoria(categoria)} ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Información de resultados */}
      <div className="resultados-info">
        <p>
          Mostrando <strong>{recetasFiltradas.length}</strong> receta{recetasFiltradas.length !== 1 ? 's' : ''}
          {filtroCategoria !== "todas" && ` en ${filtroCategoria}`}
          {busqueda && ` para "${busqueda}"`}
        </p>
      </div>

      {/* Grid de Recetas */}
      <div className="recetas-grid">
        {recetasFiltradas.map(receta => (
          <div 
            key={receta.id} 
            className={`recipe-card ${receta.bloqueada ? 'blocked' : ''}`}
            onClick={() => handleVerReceta(receta.id)}
          >
            <div className="recipe-card-header">
              <div className={`categoria-badge ${getColorCategoria(receta.categoria)}`}>
                {getIconoCategoria(receta.categoria)} {receta.categoria}
              </div>
              {receta.bloqueada && (
                <div className="bloqueada-badge">
                  🔒 BLOQUEADA
                </div>
              )}
            </div>

            <h3 className="recipe-card-title">
              {receta.bloqueada ? "🔒 " : ""}{receta.nombre}
            </h3>

            <p className="recipe-card-ingredients">
              <strong>Ingredientes:</strong> {receta.ingredientes}
            </p>

            <div className="recipe-card-footer">
              <div className="recipe-meta">
                <span className="recipe-id">ID: {receta.id}</span>
                <span className="recipe-user">Usuario: {receta.user_id}</span>
              </div>
              
              <button className="btn btn-small btn-primary">
                {receta.bloqueada ? "🔓 Desbloquear" : "👀 Ver Receta"}
              </button>
            </div>

            {/* VULNERABILIDAD: Information Disclosure en tooltip */}
            <div className="vulnerability-hint">
              <small>
                💡 <strong>IDOR:</strong> Puedes acceder a cualquier receta cambiando el ID
              </small>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje si no hay resultados */}
      {recetasFiltradas.length === 0 && (
        <div className="no-resultados">
          <div className="no-resultados-icono">🔍</div>
          <h3>No se encontraron recetas</h3>
          <p>Intenta con otros términos de búsqueda o selecciona otra categoría.</p>
          <button 
            onClick={() => {
              setBusqueda("");
              setFiltroCategoria("todas");
            }}
            className="btn btn-secondary"
          >
            🔄 Limpiar filtros
          </button>
        </div>
      )}

      {/* Sección educativa sobre vulnerabilidades */}
      <div className="security-education">
        <h3>🔓 Vulnerabilidades de Seguridad en este Componente</h3>
        
        <div className="vulnerability-cards">
          <div className="vuln-card">
            <h4>🚫 IDOR (Insecure Direct Object References)</h4>
            <p>
              <strong>Problema:</strong> Los usuarios pueden acceder a cualquier receta 
              cambiando el ID en la URL o parámetros, sin verificación de permisos.
            </p>
            <p>
              <strong>Explotación:</strong> Cambia el ID de receta para acceder a recetas 
              bloqueadas o de otros usuarios.
            </p>
            <code className="vuln-code">
              /receta/1 → Tu receta<br/>
              /receta/3 → Receta secreta bloqueada<br/>
              /receta/5 → Receta ultra secreta
            </code>
          </div>

          <div className="vuln-card">
            <h4>🔓 Contraseñas Débiles</h4>
            <p>
              <strong>Problema:</strong> Las recetas bloqueadas usan contraseñas hardcodeadas 
              que pueden ser adivinadas o encontradas en logs.
            </p>
            <p>
              <strong>Explotación:</strong> Busca contraseñas en los logs del sistema o 
              prueba con valores comunes.
            </p>
          </div>

          <div className="vuln-card">
            <h4>📢 Information Disclosure</h4>
            <p>
              <strong>Problema:</strong> Se muestran IDs internos y metadatos que 
              ayudan a los atacantes a entender la estructura de la aplicación.
            </p>
            <p>
              <strong>Explotación:</strong> Usa los IDs mostrados para explotar otras vulnerabilidades.
            </p>
          </div>
        </div>

        <div className="prevention-tips">
          <h4>🛡️ Cómo Prevenir estas Vulnerabilidades:</h4>
          <ul>
            <li>✅ Implementar autorización a nivel de objeto para cada recurso</li>
            <li>✅ Usar UUIDs en lugar de IDs secuenciales predecibles</li>
            <li>✅ Validar permisos en cada endpoint antes de devolver datos</li>
            <li>✅ No mostrar IDs internos ni información sensible en el frontend</li>
            <li>✅ Usar sistemas robustos de autenticación y autorización</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      <ModalReceta />
    </div>
  );
};

export default Recetas;