import React, { useState } from "react";
import logo from "../assets/logo_reducido.png";
import "../css/header.css";

const Header = ({ user, onLogout, currentView }) => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleNavigation = (view) => {
    // Aquí puedes agregar lógica de navegación si es necesario
    setMenuAbierto(false);
  };

  return (
    <header className="recipe-header">
      <div className="header-container">
        
        {/* Logo y Título */}
        <div className="logo-section">
          <img
            src={logo}
            alt="Abuela Cripto Logo"
            className="logo"
          />
          <div className="title-section">
            <h1 className="site-title">🍪 Abuela Cripto</h1>
            <p className="site-subtitle">Recetas Secretas Familiares</p>
          </div>
        </div>

        {/* Botón de menú para móviles */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? (
            <span className="close-icon">✕</span>
          ) : (
            <span className="menu-icon">☰</span>
          )}
        </button>

        {/* Navegación para desktop */}
        <nav className="desktop-nav">
          {user ? (
            <div className="nav-content">
              <ul className="nav-links">
                <li 
                  className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavigation('dashboard')}
                >
                  📖 Mi Cocina
                </li>
                <li 
                  className={`nav-item ${currentView === 'recetas' ? 'active' : ''}`}
                  onClick={() => handleNavigation('recetas')}
                >
                  🍽️ Todas las Recetas
                </li>
                <li 
                  className={`nav-item ${currentView === 'perfil' ? 'active' : ''}`}
                  onClick={() => handleNavigation('perfil')}
                >
                  👤 Mi Perfil
                </li>
              </ul>
              
              <div className="user-section">
                <div className="user-info">
                  <span className="user-name">Hola, {user.username}</span>
                  <span className={`user-role ${user.role}`}>
                    {user.role === 'admin' ? '👑 Administrador' : '👵 Cocinera'}
                  </span>
                </div>
                <button 
                  onClick={onLogout}
                  className="logout-btn"
                >
                  🚪 Salir
                </button>
              </div>
            </div>
          ) : (
            <div className="welcome-message">
              <p>¡Bienvenido a las recetas secretas de la abuela!</p>
            </div>
          )}
        </nav>

        {/* Menú móvil */}
        {menuAbierto && user && (
          <nav className="mobile-nav">
            <div className="mobile-nav-content">
              <div className="mobile-user-info">
                <span className="user-name">{user.username}</span>
                <span className={`user-role ${user.role}`}>
                  {user.role === 'admin' ? '👑 Admin' : '👵 User'}
                </span>
              </div>
              
              <ul className="mobile-nav-links">
                <li 
                  className={`mobile-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavigation('dashboard')}
                >
                  📖 Mi Cocina
                </li>
                <li 
                  className={`mobile-nav-item ${currentView === 'recetas' ? 'active' : ''}`}
                  onClick={() => handleNavigation('recetas')}
                >
                  🍽️ Todas las Recetas
                </li>
                <li 
                  className={`mobile-nav-item ${currentView === 'perfil' ? 'active' : ''}`}
                  onClick={() => handleNavigation('perfil')}
                >
                  👤 Mi Perfil
                </li>
              </ul>
              
              <div className="mobile-nav-footer">
                <button 
                  onClick={onLogout}
                  className="mobile-logout-btn"
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Banner informativo */}
      {!user && (
        <div className="info-banner">
          <div className="banner-content">
            <span className="banner-icon">⚠️</span>
            <p>
              <strong>¡Alerta de seguridad!</strong> El Chef Obscuro ha bloqueado nuestras recetas familiares. 
              Necesitamos tu ayuda para recuperarlas.
            </p>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;