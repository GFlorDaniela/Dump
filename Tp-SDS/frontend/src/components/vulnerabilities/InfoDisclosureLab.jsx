import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';

const InfoDisclosureLab = () => {
  const [logs, setLogs] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  
  const { gamePlayer, submitFlag } = useGame();
  const { showNotification } = useNotification();

  useEffect(() => {
    loadLogs();
    loadSystemInfo();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await ApiService.getSystemLogs();
      setLogs(data.logs || []);
      
      // Check for flag
      if (data.flag && gamePlayer) {
        const result = await submitFlag(data.flag);
        if (result.success) {
          showNotification(`¡Flag capturada! +${result.data.points} puntos`, 'success');
        }
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const loadSystemInfo = async () => {
    try {
      // Endpoint que podría exponer información del sistema
      const response = await fetch('http://localhost:5000/api/debug/info');
      const data = await response.json();
      setSystemInfo(data);
    } catch (error) {
      console.error('Error loading system info:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📢 Information Disclosure Lab</h1>
          <p className="text-xl text-gray-600">
            Descubre información sensible expuesta accidentalmente
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* System Logs */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Logs del Sistema</h3>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                VULNERABLE
              </span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 max-h-96 overflow-y-auto">
              {logs.length > 0 ? (
                <div className="space-y-3">
                  {logs.map((log, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">{log.timestamp}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.event.includes('SECURITY') 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.event}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm">{log.details}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        User ID: {log.user_id} • IP: {log.ip_address}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay logs disponibles
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                <strong>Information Disclosure:</strong> Los logs contienen información sensible como user IDs, IPs, y detalles de errores
              </p>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Información del Sistema</h3>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                DEBUG
              </span>
            </div>

            {systemInfo ? (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Información de la Aplicación</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Versión:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">{systemInfo.version}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entorno:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">{systemInfo.environment}</code>
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Base de Datos</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">{systemInfo.database?.type}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Archivo:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{systemInfo.database?.file}</code>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Rutas de Archivos</h4>
                  <div className="space-y-1 text-sm">
                    {systemInfo.paths?.map((path, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-gray-400">•</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1">{path}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🔧</div>
                <p>Cargando información del sistema...</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Vulnerable Endpoints */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Puntos de Exposición de Información</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { endpoint: '/api/debug/error', method: 'GET', description: 'Página de errores con stack traces' },
              { endpoint: '/api/users/backup', method: 'GET', description: 'Backup de usuarios expuesto' },
              { endpoint: '/.git/HEAD', method: 'GET', description: 'Archivos GIT accesibles' }
            ].map((endpoint, index) => (
              <div key={index} className="border border-gray-200 rounded-2xl p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded flex-1">
                    {endpoint.endpoint}
                  </code>
                </div>
                <p className="text-gray-600 text-sm">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Educational Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📚 Aprendizaje - Information Disclosure</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-red-600 mb-3">Información Sensible Comúnmente Expuesta:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Credenciales de base de datos</li>
                <li>• Claves API y secretos</li>
                <li>• Información de usuarios</li>
                <li>• Stack traces de errores</li>
                <li>• Archivos de configuración</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600 mb-3">Prevención:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Configurar proper error handling</li>
                <li>• Restringir acceso a archivos sensibles</li>
                <li>• Usar variables de entorno</li>
                <li>• Sanitizar respuestas de API</li>
                <li>• Deshabilitar endpoints de debug en producción</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoDisclosureLab;