import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const { gamePlayer, flags, refreshGameState } = useGame(); 
  const { showNotification } = useNotification();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '', email: '' });
  const [newPassword, setNewPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('🔄 Cargando perfil...');
      
      // 1. Cargar perfil básico
      const profileData = await ApiService.getProfile();
      console.log('✅ Perfil cargado:', profileData);

      // 2. ✅ SOLUCIÓN: Usar el leaderboard para obtener el score actualizado
      let currentScore = 0;
      try {
        console.log('🏆 Buscando score en leaderboard...');
        const leaderboardData = await ApiService.getLeaderboard(1, 100); // Pedir muchos resultados
        console.log('📊 Leaderboard completo:', leaderboardData);
        
        if (leaderboardData?.leaderboard && Array.isArray(leaderboardData.leaderboard)) {
          // Buscar al usuario actual en el leaderboard
          const currentUserInLeaderboard = leaderboardData.leaderboard.find(player => 
            player.id === user?.id || 
            player.email === user?.email || 
            player.username === user?.username
          );
          
          if (currentUserInLeaderboard) {
            currentScore = currentUserInLeaderboard.total_score || 0;
            console.log('🎯 Score encontrado en leaderboard:', currentScore);
          } else {
            console.log('❌ Usuario no encontrado en leaderboard, usando score de gamePlayer');
            currentScore = gamePlayer?.total_score || 0;
          }
        } else {
          console.log('⚠️ Leaderboard vacío o inválido, usando score de gamePlayer');
          currentScore = gamePlayer?.total_score || 0;
        }
      } catch (leaderboardError) {
        console.log('❌ Error cargando leaderboard:', leaderboardError);
        currentScore = gamePlayer?.total_score || 0;
      }

      console.log('🎯 Score final a usar:', currentScore);

      // Procesar datos del perfil
      const fullName = profileData.usuario.full_name || "";
      const nameParts = fullName.split(" ");
      const nombre = nameParts[0] || "";
      const apellido = nameParts.slice(1).join(" ") || "";

      setProfile({
        id: profileData.usuario.id,
        username: profileData.usuario.username,
        email: profileData.usuario.email,
        nombre: nombre,
        apellido: apellido,
        fecha_registro: profileData.usuario.fecha_registro || "N/A",
        total_score: currentScore // ✅ Score actualizado
      });

      setEditForm({
        nombre: nombre,
        apellido: apellido,
        email: profileData.usuario.email || ""
      });

    } catch (error) {
      console.error("Error loading profile:", error);
      const errorMessage = error.data?.message || error.message || 'Error al cargar el perfil';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!editForm.nombre.trim() || !editForm.apellido.trim() || !editForm.email.trim()) {
      showNotification('Todos los campos son requeridos', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      showNotification('Por favor ingresa un email válido', 'error');
      return;
    }

    setUpdatingProfile(true);
    try {
      const result = await ApiService.editProfile(editForm);
      
      if (result.success) {
        showNotification('¡Perfil actualizado exitosamente!', 'success');
        setShowEditModal(false);
        loadProfile(); // Recargar datos
      }
    } catch (error) {
      const errorMessage = error.data?.message || error.message || 'Error al actualizar el perfil';
      showNotification(errorMessage, 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const result = await ApiService.changePassword(newPassword);
      
      if (result.success) {
        showNotification('¡Contraseña cambiada exitosamente!', 'success');
        setShowPasswordModal(false);
        setNewPassword('');
      }
    } catch (error) {
      const errorMessage = error.data?.message || error.message || 'Error al cambiar contraseña';
      showNotification(errorMessage, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    showNotification('Sesión cerrada exitosamente', 'success');
  };

  // --- Loading Screen ---
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
          <p className="text-xl text-gray-600">Gestión de tu cuenta personal</p>
          
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main Profile */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{profile?.username}</h2>
                  <p className="text-gray-600">{profile?.email}</p>
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
                        <p className="font-bold text-green-600 text-xl">
                          {profile?.total_score || 0} pts
                        </p>
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

            {/* Flags List */}
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

            {/* Summary */}
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Resumen</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nivel</span>
                  <span className="font-bold text-blue-600">
                    {(profile?.total_score || 0) >= 500 ? 'Hacker Senior' :
                     (profile?.total_score || 0) >= 300 ? 'Hacker Intermedio' :
                     (profile?.total_score || 0) >= 100 ? 'Hacker Junior' : 'Novato'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Puntos Totales</span>
                  <span className="font-bold text-green-600 text-lg">
                    {profile?.total_score || 0} pts
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Progreso</span>
                  <span className="text-sm text-gray-500">
                    {flags.length} flags
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Acciones</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
                >
                  Editar Perfil
                </button>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold transition-colors duration-200"
                >
                  Cambiar Contraseña
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-2xl font-semibold transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>

            {/* Mensaje de seguridad */}
            {gamePlayer && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <h4 className="font-semibold text-green-800 mb-2">🔒 Perfil Seguro</h4>
                <p className="text-green-700 text-sm">
                  Tu perfil está protegido contra vulnerabilidades IDOR. Solo tú puedes acceder a tu información.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modales (mantener igual) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h4 className="text-xl font-bold text-gray-800 mb-4">✏️ Editar Perfil</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Nombre *</label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu nombre"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Apellido *</label>
                <input
                  type="text"
                  value={editForm.apellido}
                  onChange={(e) => setEditForm(prev => ({ ...prev, apellido: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu apellido"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Email *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleEditProfile}
                disabled={updatingProfile}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-2xl font-semibold transition-colors duration-200 flex items-center justify-center"
              >
                {updatingProfile ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={updatingProfile}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h4 className="text-xl font-bold text-gray-800 mb-4">🔒 Cambiar Contraseña</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Nueva Contraseña *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa nueva contraseña..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-2xl font-semibold transition-colors duration-200 flex items-center justify-center"
              >
                {changingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Cambiando...
                  </>
                ) : (
                  'Cambiar'
                )}
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                disabled={changingPassword}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>

            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <p className="text-green-700 text-sm text-center">
                ✅ Cambiando contraseña de tu propio perfil
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;