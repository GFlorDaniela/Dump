import React, { useState, useEffect } from 'react';
import ApiService from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const PresenterDashboard = () => {
  const [stats, setStats] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await ApiService.getPresenterDashboard();
      setStats(data.stats);
      setPlayers(data.players || []);
    } catch (error) {
      showNotification('Error al cargar el dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🎤 Panel de Presentador</h1>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-2xl text-purple-600 mb-2">👥</div>
              <div className="text-3xl font-bold text-gray-800">{stats.total_players}</div>
              <div className="text-gray-600">Jugadores</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-2xl text-green-600 mb-2">🚩</div>
              <div className="text-3xl font-bold text-gray-800">{stats.total_flags}</div>
              <div className="text-gray-600">Flags Capturadas</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-2xl text-blue-600 mb-2">💥</div>
              <div className="text-3xl font-bold text-gray-800">{stats.total_attempts}</div>
              <div className="text-gray-600">Intentos</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-2xl text-orange-600 mb-2">⭐</div>
              <div className="text-3xl font-bold text-gray-800">{stats.success_rate}%</div>
              <div className="text-gray-600">Tasa de Éxito</div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Players List */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Jugadores Activos</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {players.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-purple-300 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {player.nickname?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{player.nickname}</h4>
                      <p className="text-sm text-gray-500">{player.email}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-gray-800">{player.total_score} pts</div>
                    <div className="text-sm text-gray-500">
                      {player.flags_captured} flags
                    </div>
                  </div>
                </div>
              ))}
              
              {players.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">👥</div>
                  <p>No hay jugadores registrados</p>
                </div>
              )}
            </div>
          </div>

          {/* Vulnerability Stats */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas por Vulnerabilidad</h3>
            
            <div className="space-y-4">
              {[
                { name: 'SQL Injection', count: stats?.sql_injection_flags || 0, color: 'red' },
                { name: 'IDOR', count: stats?.idor_flags || 0, color: 'blue' },
                { name: 'Information Disclosure', count: stats?.info_disclosure_flags || 0, color: 'purple' },
                { name: 'Weak Authentication', count: stats?.weak_auth_flags || 0, color: 'orange' }
              ].map((vuln, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 bg-${vuln.color}-500 rounded-full`}></div>
                    <span className="font-medium text-gray-800">{vuln.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-gray-800">{vuln.count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${vuln.color}-500 h-2 rounded-full`}
                        style={{ width: `${(vuln.count / (stats?.total_flags || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-3">Acciones Rápidas</h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl transition-colors text-sm">
                  Reset Leaderboard
                </button>
                <button className="bg-white hover:bg-gray-50 text-purple-700 border border-purple-300 py-2 rounded-xl transition-colors text-sm">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Actividad Reciente</h3>
          
          <div className="space-y-3">
            {[
              { player: 'hacker123', action: 'capturó flag SQL Injection', time: 'Hace 2 min' },
              { player: 'cyber_ninja', action: 'completó IDOR lab', time: 'Hace 5 min' },
              { player: 'security_pro', action: 'encontró information disclosure', time: 'Hace 10 min' },
              { player: 'code_breaker', action: 'bypasseó autenticación', time: 'Hace 15 min' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">{activity.player}</span>
                    <span className="text-gray-600 ml-2">{activity.action}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresenterDashboard;