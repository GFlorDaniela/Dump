import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';
import { useSearchParams } from "react-router-dom";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("user_id");  // ← lee ?user_id=
  
  const { user, logout } = useAuth();
  const { gamePlayer, flags, submitFlag } = useGame();
  const { showNotification } = useNotification();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '', email: '' });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await ApiService.getProfile(userId);

      // Transformar datos del backend
      const fullName = data.usuario.full_name || "";
      const [nombre, apellido] = fullName.split(" ");

      setProfile({
        id: data.usuario.id,
        username: data.usuario.username,
        email: data.usuario.email,
        nombre: nombre || "",
        apellido: apellido || "",
        fecha_registro: data.usuario.fecha_registro || "N/A"
      });

      // Prellenar formulario de edición
      setEditForm({
        nombre: nombre || "",
        apellido: apellido || "",
        email: data.usuario.email || ""
      });

    } catch (error) {
      console.error("Error loading profile:", error);
      showNotification('Error al cargar el perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      const result = await ApiService.editProfile(userId, editForm);
      
      if (result.success) {
        showNotification('¡Perfil actualizado exitosamente!', 'success');
        
        // ✅ Check for IDOR flag
        if (result.flag) {
          showNotification(`¡Vulnerabilidad IDOR encontrada! Flag: ${result.flag}`, 'success', 10000);
          
          // Auto-submit flag if game player
          if (gamePlayer) {
            const flagResult = await submitFlag(result.flag);
            if (flagResult.success) {
              showNotification(`+${flagResult.data.points} puntos!`, 'success');
            }
          }
        }
        
        setShowEditModal(false);
        loadProfile(); // Recargar datos
      }
    } catch (error) {
      showNotification('Error al actualizar el perfil', 'error');
    }
  };

  const handleChangePassword = async () => {
    try {
      const result = await ApiService.changePassword(userId, newPassword);
      
      if (result.success) {
        showNotification('¡Contraseña cambiada exitosamente!', 'success');
        
        // ✅ Check for IDOR flag
        if (result.flag) {
          showNotification(`¡Vulnerabilidad IDOR encontrada! Flag: ${result.flag}`, 'success', 10000);
          
          // Auto-submit flag if game player
          if (gamePlayer) {
            const flagResult = await submitFlag(result.flag);
            if (flagResult.success) {
              showNotification(`+${flagResult.data.points} puntos!`, 'success');
            }
          }
        }
        
        setShowPasswordModal(false);
        setNewPassword('');
      }
    } catch (error) {
      showNotification('Error al cambiar contraseña', 'error');
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">👤 Perfil de Usuario</h1>
          <p className="text-xl text-gray-600">
            {userId !== user?.id ? `Viendo perfil de usuario ID: ${userId}` : 'Mi perfil personal'}
          </p>
          
          {/* ✅ INDICADOR DE VULNERABILIDAD IDOR */}
          {userId !== user?.id && gamePlayer && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto">
              <p className="text-red-700 text-center">
                ⚠️ <strong>VULNERABILIDAD IDOR:</strong> Estás viendo/modificando el perfil de otro usuario
              </p>
              <p className="text-green-700 text-center mt-2 font-semibold">
                🚩 Prueba editar este perfil o cambiar la contraseña
              </p>
            </div>
          )}
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
                  <p className="text-sm text-gray-500">ID: {profile?.id}</p>
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
                  <span className="text-gray-600">Usuario ID</span>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {profile?.id}
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

            {/* IDOR Hint */}
            {gamePlayer && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 Pista IDOR</h4>
                <p className="text-yellow-700 text-sm">
                  Modifica el parámetro <code className="bg-yellow-100 px-1 rounded">user_id</code> en la URL para acceder a otros perfiles
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h4 className="text-xl font-bold text-gray-800 mb-4">✏️ Editar Perfil</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Nombre</label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Apellido</label>
                <input
                  type="text"
                  value={editForm.apellido}
                  onChange={(e) => setEditForm(prev => ({ ...prev, apellido: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleEditProfile}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h4 className="text-xl font-bold text-gray-800 mb-4">🔒 Cambiar Contraseña</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa nueva contraseña..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleChangePassword}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
              >
                Cambiar
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>

            {/* IDOR Warning */}
            {userId !== user?.id && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-red-700 text-sm text-center">
                  ⚠️ Estás cambiando la contraseña del usuario ID: {userId}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;