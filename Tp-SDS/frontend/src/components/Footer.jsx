import React from "react";
import "../css/footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="recipe-footer">
      <div className="footer-container">
        
        {/* Sección principal del footer */}
        <div className="footer-main">
          <div className="footer-brand">
            <h3 className="footer-title">🍪 Abuela Cripto</h3>
            <p className="footer-description">
              Recetas secretas familiares protegidas con amor y... algunas vulnerabilidades de seguridad.
            </p>
            <div className="social-links">
              <span className="social-text">Síguenos en:</span>
              <div className="social-icons">
                <a href="#" className="social-link" aria-label="Facebook">
                  📘
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  📷
                </a>
                <a href="#" className="social-link" aria-label="YouTube">
                  📺
                </a>
              </div>
            </div>
          </div>

          <div className="footer-links">
            <div className="link-column">
              <h4 className="column-title">Recetas</h4>
              <ul className="link-list">
                <li><a href="#" className="footer-link">🍲 Sopas</a></li>
                <li><a href="#" className="footer-link">🍝 Platos Principales</a></li>
                <li><a href="#" className="footer-link">🍰 Postres</a></li>
                <li><a href="#" className="footer-link">🥗 Ensaladas</a></li>
              </ul>
            </div>

            <div className="link-column">
              <h4 className="column-title">Seguridad</h4>
              <ul className="link-list">
                <li><a href="#" className="footer-link">🔐 Vulnerabilidades</a></li>
                <li><a href="#" className="footer-link">🛡️ Buenas Prácticas</a></li>
                <li><a href="#" className="footer-link">📚 Tutoriales</a></li>
                <li><a href="#" className="footer-link">❓ Ayuda</a></li>
              </ul>
            </div>

            <div className="link-column">
              <h4 className="column-title">Legal</h4>
              <ul className="link-list">
                <li><a href="#" className="footer-link">📄 Términos de Uso</a></li>
                <li><a href="#" className="footer-link">🔒 Política de Privacidad</a></li>
                <li><a href="#" className="footer-link">🍪 Cookies</a></li>
                <li><a href="#" className="footer-link">📞 Contacto</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sección de información educativa */}
        <div className="security-notice">
          <div className="notice-content">
            <h5 className="notice-title">🔓 Aplicación Educativa</h5>
            <p className="notice-text">
              Esta aplicación contiene vulnerabilidades de seguridad intencionales (IDOR, SQL Injection, etc.) 
              con fines educativos. No utilices contraseñas reales ni información personal sensible.
            </p>
          </div>
        </div>

        {/* Línea separadora */}
        <div className="footer-divider"></div>

        {/* Copyright y información adicional */}
        <div className="footer-bottom">
          <div className="copyright">
            <p>&copy; {currentYear} Abuela Cripto - Recetas Secretas Familiares</p>
            <p className="educational-note">
              Proyecto educativo para demostración de vulnerabilidades web • 
              <span className="tech-stack"> React + Flask + SQLite</span>
            </p>
          </div>
          
          <div className="footer-badges">
            <span className="badge educational">🎓 Educativo</span>
            <span className="badge security">🔓 Contiene Vulnerabilidades</span>
            <span className="badge demo">⚡ Demo</span>
          </div>
        </div>

        {/* Mensaje oculto para pentesters */}
        <div className="hidden-message">
          <p className="pentester-hint">
            💡 <strong>Para Pentesters:</strong> Revisa los parámetros user_id en las URLs y prueba inyecciones SQL en el login
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;