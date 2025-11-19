import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-3xl">👵</div>
              <div>
                <h3 className="text-xl font-bold">Abuela Cripto</h3>
                <p className="text-gray-300">Recetas Secretas Familiares</p>
              </div>
            </div>
            <p className="text-gray-400 max-w-md">
              Plataforma educativa de ciberseguridad diseñada para aprender 
              hacking ético en un entorno seguro y controlado.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              {[
                { name: 'Dashboard', href: '/dashboard' },
                { name: 'Vulnerabilidades', href: '/vulnerabilities' },
                { name: 'Leaderboard', href: '/leaderboard' },
                { name: 'Perfil', href: '/profile' }
              ].map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-white transition-colors duration-200">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Educational Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Información</h4>
            <div className="space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  🎓 <strong>Aplicación Educativa</strong>
                </p>
                <p className="text-yellow-200/80 text-xs mt-1">
                  Contiene vulnerabilidades intencionales para aprendizaje
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-300 text-sm">
                  ⚠️ <strong>No usar en producción</strong>
                </p>
                <p className="text-red-200/80 text-xs mt-1">
                  Solo para entornos educativos controlados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              <p>&copy; {currentYear} Abuela Cripto - Plataforma Educativa de Ciberseguridad</p>
              <p className="text-gray-500 text-xs mt-1">
                Desarrollado con React + Flask + SQLite
              </p>
            </div>
            
            <div className="flex space-x-4">
              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                🎓 Educativo
              </span>
              <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                🔓 Contiene Vulnerabilidades
              </span>
              <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
                ⚡ Demo
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;