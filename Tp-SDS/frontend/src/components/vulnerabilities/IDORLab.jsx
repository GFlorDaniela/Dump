import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';

const IDORLab = () => {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [customUserId, setCustomUserId] = useState('');
  
  const { gamePlayer, submitFlag } = useGame();
  const { showNotification } = useNotification();

  const handleViewProfile = async (userId) => {
    try {
      // ✅ USAR TU ENDPOINT DE PERFIL ACTUAL
      const data = await ApiService.getProfile(userId);
      setSelectedProfile(data.usuario);
      
      // ✅ CHECK FOR FLAG EN TU SISTEMA ACTUAL
      if (data.flag && gamePlayer) {
        showNotification(`¡IDOR detectado! Flag: ${data.flag}`, 'success', 10000);
        const result = await submitFlag(data.flag);
        if (result.success) {
          showNotification(`+${result.data.points} puntos!`, 'success');
        }
      }
    } catch (error) {
      showNotification('Error al cargar perfil', 'error');
    }
  };

  const predefinedUsers = [
    { id: 'G-0001', name: 'abuela', description: 'Usuario básico' },
    { id: 'G-0002', name: 'admin', description: 'Administrador del sistema' },
    { id: 'G-0003', name: 'chef_obscuro', description: 'Chef principal' },
    { id: 'G-0004', name: 'juan_perez', description: 'Usuario regular' },
    { id: 'G-0005', name: 'maria_garcia', description: 'Usuario regular' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🔓 IDOR Lab</h1>
          <p className="text-xl text-gray-600">
            Insecure Direct Object Reference - Accede a recursos sin verificación de permisos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Perfiles Predefinidos</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {predefinedUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleViewProfile(user.id)}
                    className="p-4 border border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="font-semibold text-gray-800">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.description}</div>
                    <div className="text-xs text-gray-500 mt-1">ID: {user.id}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom User ID */}
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">IDOR Manual</h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={customUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                  placeholder="Ingresa User ID (ej: G-0001, U-1, etc.)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleViewProfile(customUserId)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold transition-colors"
                >
                  Cargar
                </button>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                <p className="text-yellow-800 text-sm">
                  <strong>IDOR Test:</strong> Prueba con diferentes IDs como U-1, U-2, G-0001, etc.
                  Cualquier usuario puede acceder a cualquier perfil sin verificación.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detalles del Perfil</h3>
            
            {selectedProfile ? (
              <div className="space-y-4">
                <div className="text-center border-b border-gray-200 pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                    {selectedProfile.username?.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="font-bold text-lg text-gray-800">{selectedProfile.username}</h4>
                  <p className="text-gray-600">{selectedProfile.email}</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">ID de Usuario</label>
                    <p className="font-medium text-gray-800 font-mono">{selectedProfile.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Nombre Completo</label>
                    <p className="font-medium text-gray-800">{selectedProfile.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Rol</label>
                    <p className="font-medium text-gray-800">{selectedProfile.role}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium text-gray-800">{selectedProfile.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">👤</div>
                <p>Selecciona un perfil para ver los detalles</p>
                <p className="text-sm mt-2">¡Prueba acceder a perfiles de otros usuarios!</p>
              </div>
            )}
          </div>
        </div>

        {/* Educational Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📚 Aprendizaje - IDOR</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-red-600 mb-3">Riesgos de IDOR:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Acceso a datos personales de otros usuarios</li>
                <li>• Exposición de información sensible</li>
                <li>• Modificación no autorizada de datos</li>
                <li>• Escalación de privilegios</li>
                <li>• Violación de privacidad y compliance</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600 mb-3">Prevención:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Validación de autorización en cada request</li>
                <li>• Usar UUIDs en lugar de IDs secuenciales</li>
                <li>• Implementar control de acceso a nivel de objeto</li>
                <li>• Logs y monitoreo de acceso a recursos</li>
                <li>• Tests de penetración regulares</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDORLab;