import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';

const WeakAuthLab = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { gamePlayer, submitFlag } = useGame();
  const { showNotification } = useNotification();

  const handleWeakAuthTest = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      const data = await ApiService.testWeakAuthentication({ username, password });
      
      if (data.success) {
        showNotification('¡Autenticación débil explotada!', 'success');
        
        if (data.flag && gamePlayer) {
          showNotification(`¡Flag encontrada! ${data.flag}`, 'success', 10000);
          const result = await submitFlag(data.flag);
          if (result.success) {
            showNotification(`+${result.data.points} puntos!`, 'success');
          }
        }
      } else {
        showNotification('Credenciales incorrectas', 'error');
      }
    } catch (error) {
      showNotification('Error en la autenticación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const commonCredentials = [
    { username: 'abuela', password: 'abuela123', description: 'Credenciales por defecto' },
    { username: 'admin', password: 'admin', description: 'Admin con contraseña débil' },
    { username: 'test', password: 'test', description: 'Usuario de prueba' },
    { username: 'user', password: 'password', description: 'Contraseña común' },
    { username: 'root', password: '123456', description: 'Contraseña numérica' }
  ];

  const quickTest = (cred) => {
    setUsername(cred.username);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🔑 Weak Authentication Lab</h1>
          <p className="text-xl text-gray-600">Explota sistemas de autenticación débiles y contraseñas comunes</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Authentication Test */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Prueba de Autenticación Débil</h3>
            
            <form onSubmit={handleWeakAuthTest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa el usuario"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-semibold transition-colors"
              >
                {loading ? 'Verificando...' : '🔓 Probar Autenticación'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-200">
              <p className="text-red-800 text-sm">
                <strong>Vulnerabilidad:</strong> Este sistema no tiene protección contra fuerza bruta y acepta contraseñas débiles.
              </p>
            </div>
          </div>

          {/* Quick Tests */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Credenciales Comunes</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">Pruebas Rápidas:</h4>
                <div className="space-y-3">
                  {commonCredentials.map((cred, index) => (
                    <button
                      key={index}
                      onClick={() => quickTest(cred)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-800">{cred.username}</div>
                          <div className="text-sm text-gray-600">{cred.description}</div>
                        </div>
                        <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                          {cred.password}
                        </code>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">💡 Pistas:</h4>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Prueba credenciales por defecto (abuela/abuela123)</li>
                  <li>• Usa contraseñas comunes como "password", "123456"</li>
                  <li>• El sistema no bloquea intentos fallidos</li>
                  <li>• No hay autenticación de dos factores</li>
                </ul>
              </div>
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
                <li>• Falta de rate limiting en login</li>
                <li>• Autenticación en texto plano</li>
                <li>• Bypass mediante parámetros</li>
                <li>• Falta de autenticación multi-factor</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600 mb-3">Mejores Prácticas:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Contraseñas fuertes y únicas</li>
                <li>• Rate limiting en intentos de login</li>
                <li>• Autenticación multi-factor (2FA)</li>
                <li>• Hash seguro de contraseñas (bcrypt)</li>
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