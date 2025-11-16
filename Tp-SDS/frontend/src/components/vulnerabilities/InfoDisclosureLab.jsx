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
  }, []);

  const loadLogs = async () => {
    try {
      const data = await ApiService.testInformationDisclosure();
      setLogs(data.logs || []);
      
      if (data.flag && gamePlayer) {
        showNotification(`¡Information Disclosure! Flag: ${data.flag}`, 'success', 10000);
        const result = await submitFlag(data.flag);
        if (result.success) {
          showNotification(`+${result.data.points} puntos!`, 'success');
        }
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const sensitiveInfoFound = logs.some(log => 
    log.details?.includes('Pista') || 
    log.details?.includes('Flag') ||
    log.details?.includes('password') ||
    log.user_id?.includes('G-000')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📢 Information Disclosure Lab</h1>
          <p className="text-xl text-gray-600">Descubre información sensible expuesta accidentalmente</p>
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

            {sensitiveInfoFound && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-red-700 text-center font-semibold">
                  ⚠️ INFORMACIÓN SENSIBLE DETECTADA EN LOS LOGS
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-4 max-h-96 overflow-y-auto">
              {logs.length > 0 ? (
                <div className="space-y-3">
                  {logs.map((log, index) => {
                    const hasSensitiveInfo = log.details?.includes('Pista') || log.details?.includes('Flag');
                    return (
                      <div key={index} className={`bg-white rounded-xl p-4 border ${
                        hasSensitiveInfo ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">{log.timestamp}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            hasSensitiveInfo 
                              ? 'bg-red-100 text-red-800' 
                              : log.event.includes('SECURITY') 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.event}
                          </span>
                        </div>
                        <p className={`text-sm ${hasSensitiveInfo ? 'text-red-700 font-semibold' : 'text-gray-800'}`}>
                          {log.details}
                        </p>
                        <div className="text-xs text-gray-500 mt-2">
                          User ID: {log.user_id}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay logs disponibles
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                <strong>Information Disclosure:</strong> Los logs contienen información sensible como user IDs, pistas de flags, y detalles de seguridad.
              </p>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Análisis de Información Expuesta</h3>
            
            <div className="space-y-6">
              {/* User IDs Found */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">IDs de Usuario Expuestos:</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  {logs.filter(log => log.user_id).length > 0 ? (
                    <div className="space-y-2">
                      {[...new Set(logs.map(log => log.user_id).filter(Boolean))].map((userId, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{userId}</code>
                          <span className="text-xs text-gray-500">
                            {logs.filter(log => log.user_id === userId).length} eventos
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No se encontraron user IDs</p>
                  )}
                </div>
              </div>

              {/* Security Events */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Eventos de Seguridad:</h4>
                <div className="space-y-2">
                  {logs.filter(log => log.event.includes('SECURITY') || log.event.includes('DEBUG')).map((log, index) => (
                    <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-orange-800">{log.event}</div>
                      <div className="text-xs text-orange-600 mt-1">{log.details}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Pistas para Encontrar Flags:</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Busca logs con "Pista" en los detalles</li>
                  <li>• Revisa eventos de SECURITY y DEBUG</li>
                  <li>• Los primeros 5 logs contienen información crítica</li>
                  <li>• User IDs expuestos pueden usarse para IDOR</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoDisclosureLab;