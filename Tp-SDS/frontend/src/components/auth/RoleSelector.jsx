import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="text-8xl">👵</div>
              <div className="absolute -top-2 -right-2 text-4xl">🔒</div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Abuela <span className="text-orange-600">Cripto</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Plataforma Educativa de Ciberseguridad -
            <span className="text-orange-500 font-semibold"> Aprende Hacking Ético</span>
          </p>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              SQL Injection
            </span>
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              IDOR
            </span>
            <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              Info Disclosure
            </span>
            <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
              Weak Auth
            </span>
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Jugador Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-transparent hover:border-green-400 transition-all duration-500 hover:scale-105">
            <div className="text-center mb-8">
              <div className="text-6xl mb-6">👤</div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Modo Jugador</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Conviértete en un hacker ético. Encuentra vulnerabilidades,
                captura flags y compite por el primer lugar.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-gray-700">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600">✓</span>
                </div>
                <span>Encuentra flags ocultas en vulnerabilidades</span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600">✓</span>
                </div>
                <span>Gana puntos y compite en el leaderboard</span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600">✓</span>
                </div>
                <span>Aprende técnicas de hacking ético en entorno seguro</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/register')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
            >
              🎮 Registrarse como Jugador
            </button>
          </div>

          {/* Presentador Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-transparent hover:border-purple-400 transition-all duration-500 hover:scale-105">
            <div className="text-center mb-8">
              <div className="text-6xl mb-6">🎤</div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Modo Presentador</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Accede al panel de control, monitorea el progreso de los jugadores
                y gestiona el desafío de seguridad.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-gray-700">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600">✓</span>
                </div>
                <span>Panel de control con estadísticas en tiempo real</span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600">✓</span>
                </div>
                <span>Gestión completa de jugadores y progreso</span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600">✓</span>
                </div>
                <span>Acceso administrativo al sistema</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
            >
              🔴 Iniciar Sesión como Presentador
            </button>
          </div>
        </div>

        {/* Credenciales de Prueba */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-8 max-w-4xl mx-auto shadow-lg">
          <h4 className="font-bold text-yellow-800 mb-4 text-xl text-center">🔑 Credenciales de Prueba</h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="font-semibold text-yellow-700 mb-2">🔴 Presentadora</div>
              <div>Usuario: <code className="bg-yellow-100 px-2 py-1 rounded">Daniela</code></div>
              <div>Contraseña: <code className="bg-yellow-100 px-2 py-1 rounded">94477Despeñadero</code></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="font-semibold text-gray-700 mb-2">🔴 Usuario Normal</div>
              <div>Usuario: <code className="bg-gray-100 px-2 py-1 rounded">abuela</code></div>
              <div>Contraseña: <code className="bg-gray-100 px-2 py-1 rounded">abuela123</code></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="font-semibold text-red-600 mb-2">👑 Administrador</div>
              <div>Usuario: <code className="bg-red-100 px-2 py-1 rounded">admin</code></div>
              <div>Contraseña: <code className="bg-red-100 px-2 py-1 rounded">ChefObscuro123!</code></div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-8">🛡️ Características de Seguridad Incluidas</h3>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: '💉', name: 'SQL Injection', color: 'red' },
              { icon: '🔓', name: 'IDOR', color: 'blue' },
              { icon: '📢', name: 'Info Disclosure', color: 'purple' },
              { icon: '🔑', name: 'Weak Auth', color: 'orange' }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <div className={`font-semibold text-${feature.color}-600`}>{feature.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;