import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';

const WeakAuthLab = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { gamePlayer, submitFlag } = useGame();
  const { showNotification } = useNotification();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/weak-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification('¡Login exitoso!', 'success');
        
        // Check for flag
        if (data.flag && gamePlayer) {
          const result = await submitFlag(data.flag);
          if (result.success) {
            showNotification(`¡Flag capturada! +${result.data.points} puntos`, 'success');
          }
        }
      } else {
        showNotification('Credenciales incorrectas', 'error');
      }
    } catch (error) {
      showNotification('Error en el login', 'error');
    } finally {
      setLoading(false);
    }
  };

  const commonPasswords = [
    '123456', 'password', '12345678', 'qwerty', '123456789',
    '12345', '1234', '111111', '1234567', 'dragon',
    '123123', 'baseball', 'abc123', 'football', 'monkey'
  ];

  const bruteForceTest = async (testUsername, testPassword) => {
    setUsername(testUsername);
    setPassword(testPassword);
    
    // Auto-submit after a short delay
    setTimeout(() => {
      document.getElementById('weak-auth-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🔑 Weak Authentication Lab</h1>
          <p className="text-xl text-gray-600">
            Explota sistemas de autenticación débiles y contraseñas comunes
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Sistema de Autenticación Débil</h3>
            
            <form id="weak-auth-form" onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa el usuario"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Verificando...' : '🔓 Iniciar Sesión'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-200">
              <p className="text-red-800 text-sm">
                <strong>Vulnerabilidad:</strong> Este sistema no tiene protección contra fuerza bruta y usa contraseñas débiles
              </p>
            </div>
          </div>

          {/* Password Testing */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Prueba de Contraseñas Comunes</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Usuarios Conocidos:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['admin', 'root', 'user', 'test', 'guest', 'demo'].map((user) => (
                    <button
                      key={user}
                      onClick={() => setUsername(user)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 rounded-xl transition-colors text-sm"
                    >
                      {user}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Contraseñas Más Comunes:</h4>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {commonPasswords.map((pwd) => (
                    <button
                      key={pwd}
                      onClick={() => bruteForceTest(username || 'admin', pwd)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors text-xs"
                    >
                      {pwd}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Técnicas de Ataque:</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Fuerza bruta con diccionario</li>
                <li>• Contraseñas por defecto</li>
                <li>• Credenciales filtradas</li>
                <li>• Bypass de autenticación</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Educational Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📚 Aprendizaje - Autenticación Débil</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-red-600 mb-3">Problemas Comunes:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Contraseñas por defecto o débiles</li>
                <li>• Falta de rate limiting</li>
                <li>• Autenticación en texto plano</li>
                <li>• Bypass mediante parámetros</li>
                <li>• Falta de 2FA</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600 mb-3">Mejores Prácticas:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Contraseñas fuertes y únicas</li>
                <li>• Rate limiting en login</li>
                <li>• Autenticación multi-factor</li>
                <li>• Hash seguro de contraseñas</li>
                <li>• Logs de intentos fallidos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeakAuthLab;