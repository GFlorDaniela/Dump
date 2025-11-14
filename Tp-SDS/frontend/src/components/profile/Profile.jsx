import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import ApiService from '../../services/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { gamePlayer, flags } = useGame();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await ApiService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">👤 Mi Perfil</h1>
          <p className="text-xl text-gray-600">
            Gestiona tu información y revisa tu progreso
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{user?.username}</h2>
                  <p className="text-gray-600">{user?.email}</p>
                  <div className="flex space-x-2 mt-2">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {user?.role}
                    </span>
                    {gamePlayer && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Jugador Registrado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-4">Información Personal</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Nombre Completo</label>
                      <p className="font-medium text-gray-800">
                        {profile?.nombre} {profile?.apellido}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="font-medium text-gray-800">{profile?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Fecha de Registro</label>
                      <p className="font-medium text-gray-800">{profile?.fecha_registro}</p>
                    </div>
                  </div>
                </div>

                {/* Game Stats */}
                {gamePlayer && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-4">Estadísticas del Juego</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">Nickname</label>
                        <p className="font-medium text-gray-800">{gamePlayer.nickname}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Puntuación Total</label>
                        <p className="font-bold text-green-600 text-xl">{gamePlayer.total_score} pts</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Flags Capturadas</label>
                        <p className="font-medium text-gray-800">{flags.length}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Flags */}
            {gamePlayer && flags.length > 0 && (
              <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">🚩 Flags Capturadas</h3>
                <div className="space-y-3">
                  {flags.slice(0, 5).map((flag, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600">✓</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{flag.vulnerability}</p>
                          <p className="text-sm text-gray-500">{flag.timestamp}</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600">+{flag.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Resumen</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nivel</span>
                  <span className="font-bold text-blue-600">
                    {gamePlayer?.total_score >= 500 ? 'Hacker Senior' : 
                     gamePlayer?.total_score >= 300 ? 'Hacker Intermedio' : 
                     gamePlayer?.total_score >= 100 ? 'Hacker Junior' : 'Novato'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ranking</span>
                  <span className="font-bold text-gray-800">#--</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Actividad</span>
                  <span className="font-bold text-green-600">Activo</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            {gamePlayer && (
              <div className="bg-white rounded-3xl shadow-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Progreso</h3>
                <div className="space-y-3">
                  {[
                    { name: 'SQL Injection', completed: flags.some(f => f.vulnerability === 'sql_injection') },
                    { name: 'IDOR', completed: flags.some(f => f.vulnerability === 'idor') },
                    { name: 'Info Disclosure', completed: flags.some(f => f.vulnerability === 'information_disclosure') },
                    { name: 'Weak Auth', completed: flags.some(f => f.vulnerability === 'weak_authentication') }
                  ].map((vuln, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{vuln.name}</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        vuln.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {vuln.completed ? (
                          <span className="text-green-600 text-sm">✓</span>
                        ) : (
                          <span className="text-gray-400 text-sm">○</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Acciones</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200">
                  Editar Perfil
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold transition-colors duration-200">
                  Cambiar Contraseña
                </button>
                <button className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-2xl font-semibold transition-colors duration-200">
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;