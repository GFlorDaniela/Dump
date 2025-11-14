import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';

const IDORLab = () => {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  const { gamePlayer, submitFlag } = useGame();
  const { showNotification } = useNotification();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      // Esta endpoint es vulnerable a IDOR - permite acceder a perfiles de otros usuarios
      const data = await ApiService.getProfile();
      setProfiles(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleViewProfile = async (userId) => {
    try {
      // Vulnerabilidad IDOR: podemos acceder a cualquier perfil cambiando el user_id
      const data = await ApiService.getProfile(userId);
      setSelectedProfile(data);
      
      // Check for flag
      if (data.flag && gamePlayer) {
        const result = await submitFlag(data.flag);
        if (result.success) {
          showNotification(`¡Flag capturada! +${result.data.points} puntos`, 'success');
        }
      }
    } catch (error) {
      showNotification('Error al cargar perfil', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🔓 IDOR Lab</h1>
          <p className="text-xl text-gray-600">
            Explota vulnerabilidades de Insecure Direct Object Reference
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Profiles List */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Perfiles de Usuario</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((userId) => (
                <div key={userId} className="border border-gray-200 rounded-2xl p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Usuario #{userId}</h4>
                      <p className="text-sm text-gray-500">ID: {userId}</p>
                    </div>
                    <button
                      onClick={() => handleViewProfile(userId)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors"
                    >
                      Ver Perfil
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                <strong>IDOR Test:</strong> Intenta acceder a perfiles de otros usuarios cambiando el ID en la URL o parámetros
              </p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detalles del Perfil</h3>
            
            {selectedProfile ? (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="font-bold text-lg text-gray-800">{selectedProfile.nombre}</h4>
                  <p className="text-gray-600">{selectedProfile.email}</p>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Información Personal:</h5>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Usuario:</strong> {selectedProfile.username}</p>
                    <p><strong>Rol:</strong> {selectedProfile.role}</p>
                    <p><strong>Miembro desde:</strong> {selectedProfile.fecha_registro}</p>
                  </div>
                </div>

                {selectedProfile.recetas_favoritas && (
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">Recetas Favoritas:</h5>
                    <div className="space-y-1">
                      {selectedProfile.recetas_favoritas.map((receta, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {receta}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">👤</div>
                <p>Selecciona un perfil para ver los detalles</p>
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
                <li>• Acceso a datos de otros usuarios</li>
                <li>• Exposición de información sensible</li>
                <li>• Modificación no autorizada de datos</li>
                <li>• Escalación de privilegios</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600 mb-3">Prevención:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Validación de autorización en cada request</li>
                <li>• Usar UUIDs en lugar de IDs secuenciales</li>
                <li>• Implementar control de acceso a nivel de objeto</li>
                <li>• Logs y monitoreo de acceso</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDORLab;