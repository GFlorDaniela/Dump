import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';

const InfoDisclosureLab = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flagSubmitted, setFlagSubmitted] = useState(false);
  const [userFlagInput, setUserFlagInput] = useState('');
  
  const { gamePlayer, submitFlag } = useGame();
  const { showNotification } = useNotification();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.testInformationDisclosure();
      
      // 🎯 ORDENAR logs de MENOR A MAYOR (más antiguos primero)
      const sortedLogs = (data.logs || []).sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      setLogs(sortedLogs);
      
    } catch (error) {
      console.error('Error loading logs:', error);
      showNotification('Error cargando logs del sistema', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para que el usuario envíe la flag manualmente
  const handleSubmitFlag = async () => {
    if (!gamePlayer) {
      showNotification('Debes estar registrado como jugador', 'error');
      return;
    }

    if (!userFlagInput.trim()) {
      showNotification('Ingresa la flag que encontraste', 'warning');
      return;
    }

    try {
      const result = await submitFlag(userFlagInput.trim());
      if (result.success) {
        showNotification(`✅ +${result.data.points} puntos! Flag enviada correctamente`, 'success');
        setFlagSubmitted(true);
        setUserFlagInput('');
      } else {
        showNotification(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification('Error al enviar la flag', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando logs del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📢 Information Disclosure Lab</h1>
          <p className="text-xl text-gray-600">Analiza los logs del sistema para encontrar información sensible expuesta</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* System Logs */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Logs del Sistema ({logs.length} registros)
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Ordenados cronológicamente)
                </span>
              </h3>
              <div className="flex gap-2">
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  VULNERABLE
                </span>
                <button 
                  onClick={loadLogs}
                  className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-200 transition"
                >
                  🔄 Actualizar
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 max-h-[600px] overflow-y-auto">
              {logs.length > 0 ? (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">{log.timestamp}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {log.event}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium break-all">
                        {log.details}
                      </p>
                      <div className="text-xs text-gray-500 mt-2">
                        User ID: {log.user_id} | Log ID: {log.id}
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
                <strong>Information Disclosure:</strong> Los logs pueden contener información sensible como credenciales, 
                tokens, detalles de configuración interna y otros datos que no deberían ser expuestos.
              </p>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Análisis y Envío</h3>
            
            <div className="space-y-6">
              {/* Submit Flag Section */}
              <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3">🚩 Enviar Flag</h4>
                <p className="text-green-700 text-sm mb-3">
                  Ingresa la flag que encontraste en los logs:
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={userFlagInput}
                    onChange={(e) => setUserFlagInput(e.target.value)}
                    placeholder="INFO_FLAG_..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={flagSubmitted}
                  />
                  <button 
                    onClick={handleSubmitFlag}
                    disabled={flagSubmitted || !gamePlayer}
                    className={`w-full py-2 px-4 rounded-lg font-medium ${
                      flagSubmitted 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {flagSubmitted ? '✅ Flag Enviada (+80 puntos)' : 'Enviar Flag'}
                  </button>
                </div>
                {!gamePlayer && (
                  <p className="text-red-600 text-xs mt-2">Debes estar registrado como jugador</p>
                )}
              </div>

              {/* Tips */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Pistas:</h4>
                <ul className="text-blue-700 text-sm space-y-2">
                  <li>• Revisa <strong>todos los logs</strong> cuidadosamente</li>
                  <li>• Busca información de <strong>configuración y debug</strong></li>
                  <li>• Algunos logs contienen datos <strong>codificados</strong></li>
                  <li>• La flag sigue el formato: <code>INFO_FLAG_XXXXXXX</code></li>
                  <li>• <strong>80 puntos</strong> por resolver este desafío</li>
                </ul>
              </div>

              {/* Stats */}
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">📊 Estadísticas:</h4>
                <div className="text-purple-700 text-sm space-y-1">
                  <p>• Total de logs: <strong>{logs.length}</strong></p>
                  <p>• Puntos disponibles: <strong>80</strong></p>
                  <p>• Estado: <strong>{flagSubmitted ? '✅ Completado' : '🟡 Pendiente'}</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoDisclosureLab;