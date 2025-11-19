import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';

const WeakAuthLab = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(null);
  
  const { gamePlayer, submitFlag } = useGame();
  const { showNotification } = useNotification();

  const handleWeakAuthTest = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showNotification('Ingresa usuario y contraseña', 'warning');
      return;
    }

    setLoading(true);
    setLastAttempt({ username, password });
    
    try {
      console.log('🔐 Enviando credenciales:', { username, password });
      
      const data = await ApiService.testWeakAuthentication({ username, password });
      
      console.log('✅ Respuesta del backend:', data);
      
      if (data.success) {
        showNotification(`¡Autenticación exitosa! ${data.message}`, 'success');
        
        // Verificar si hay flag y enviarla automáticamente
        if (data.flag && gamePlayer) {
          console.log('🚩 Flag encontrada:', data.flag);
          
          try {
            const result = await submitFlag(data.flag);
            if (result.success) {
              showNotification(`✅ +${result.data.points} puntos! Flag enviada correctamente`, 'success');
            } else {
              // Si ya tenía la flag, mostrar mensaje diferente
              if (result.message?.includes('Ya completaste') || result.message?.includes('ya completaste')) {
                showNotification('✅ Ya habías completado esta vulnerabilidad', 'info');
              } else {
                showNotification(`❌ ${result.message}`, 'error');
              }
            }
          } catch (flagError) {
            console.error('❌ Error enviando flag:', flagError);
            showNotification('Error al enviar la flag', 'error');
          }
        } else if (!gamePlayer) {
          showNotification('Inicia sesión como jugador para obtener puntos', 'warning');
        }
      } else {
        showNotification(data.message || 'Credenciales incorrectas', 'error');
      }
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      
      if (error.message?.includes('Network Error') || error.status === 0) {
        showNotification('No se puede conectar al servidor. Verifica que el backend esté ejecutándose.', 'error');
      } else {
        showNotification(error.message || 'Error en la autenticación', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const commonCredentials = [
    { username: 'admin', password: 'admin', description: 'Credenciales administrativas' },
    { username: 'test', password: 'test', description: 'Usuario de pruebas' },
    { username: 'user', password: 'password', description: 'Usuario genérico' },
    { username: 'root', password: '123456', description: 'Superusuario' },
    { username: 'guest', password: 'guest', description: 'Usuario invitado' },
    { username: 'backup', password: 'backup', description: 'Usuario de respaldo' },
    { username: 'oracle', password: 'oracle', description: 'Usuario de base de datos' },
    { username: 'postgres', password: 'postgres', description: 'Usuario PostgreSQL' },
    { username: 'ftp', password: 'ftp', description: 'Servicio FTP' },
    { username: 'ssh', password: 'ssh', description: 'Servicio SSH' },
    { username: 'mysql', password: 'mysql', description: 'Base de datos MySQL' }
  ];

  const quickTest = (cred) => {
    setUsername(cred.username);
    setPassword(cred.password);
    // Opcional: auto-enviar después de un delay pequeño
    setTimeout(() => {
      document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setLastAttempt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🔑 Weak Authentication Lab</h1>
          <p className="text-xl text-gray-600">Identifica y explota vulnerabilidades de autenticación</p>
          <div className="mt-4 flex justify-center gap-4">
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              VULNERABLE
            </span>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              120 PUNTOS
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Authentication Test */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Prueba de Autenticación</h3>
              <button
                onClick={clearForm}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                🔄 Limpiar
              </button>
            </div>
            
            <form onSubmit={handleWeakAuthTest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario 
                  {username && <span className="text-green-600 ml-2">✓</span>}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa el usuario..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                  {password && <span className="text-green-600 ml-2">✓</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !username || !password}
                className={`w-full py-3 rounded-2xl font-semibold transition-all ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verificando...
                  </div>
                ) : (
                  '🔓 Probar Autenticación'
                )}
              </button>
            </form>

            {lastAttempt && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border">
                <p className="text-sm text-gray-600">
                  Último intento: <code className="bg-gray-100 px-2 py-1 rounded">{lastAttempt.username}</code> / 
                  <code className="bg-gray-100 px-2 py-1 rounded ml-1">{lastAttempt.password}</code>
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-200">
              <p className="text-red-800 text-sm">
                <strong>🚨 Sistema Vulnerable:</strong> Este endpoint presenta múltiples fallos de seguridad 
                en el mecanismo de autenticación.
              </p>
            </div>
          </div>

          {/* Quick Tests & Info Panel */}
          <div className="space-y-6">
            {/* Quick Tests */}
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Credenciales de Prueba</h3>
              
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 mb-4">
                <h4 className="font-semibold text-blue-800 mb-3">Combinaciones Comunes:</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {commonCredentials.map((cred, index) => (
                    <button
                      key={index}
                      onClick={() => quickTest(cred)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 group-hover:text-orange-700">
                            {cred.username}
                          </div>
                          <div className="text-sm text-gray-600 group-hover:text-orange-600">
                            {cred.description}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm group-hover:bg-orange-100 group-hover:text-orange-800">
                            {cred.password}
                          </code>
                          <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            →
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3">💡 Estrategia de Prueba:</h4>
                <ul className="text-green-700 text-sm space-y-2">
                  <li>• Prueba múltiples combinaciones de usuario/contraseña</li>
                  <li>• Algunas credenciales otorgan acceso pero no puntos</li>
                  <li>• Solo ciertas combinaciones revelan la flag</li>
                  <li>• No hay límite de intentos fallidos</li>
                  <li>• Explora diferentes tipos de usuarios y servicios</li>
                </ul>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Información del Desafío</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Tu rol:</span>
                  <span className={`font-semibold ${gamePlayer ? 'text-green-600' : 'text-red-600'}`}>
                    {gamePlayer ? 'Jugador ✅' : 'No registrado ❌'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Puntos disponibles:</span>
                  <span className="font-semibold text-orange-600">120 puntos</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Dificultad:</span>
                  <span className="font-semibold text-yellow-600">Medio</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-semibold text-purple-600">Fuerza Bruta</span>
                </div>
                
                {!gamePlayer && (
                  <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-yellow-700 text-sm">
                      💡 <strong>Regístrate como jugador</strong> para obtener puntos por completar este desafío.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Educational Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📚 Acerca de la Autenticación Débil</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-red-600 mb-4 flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                Riesgos Identificados:
              </h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Credenciales por defecto en servicios del sistema</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Ausencia de límites en intentos de autenticación</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Almacenamiento de contraseñas sin encriptación</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Contraseñas basadas en nombre de usuario o servicio</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600 mb-4 flex items-center">
                <span className="text-xl mr-2">🛡️</span>
                Contramedidas Recomendadas:
              </h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Implementar políticas de contraseñas robustas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Rate limiting en endpoints de autenticación</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Hash seguro de contraseñas con salt único</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Monitoreo de intentos de acceso fallidos</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeakAuthLab;