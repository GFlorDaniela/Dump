import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // ✅ CAMBIADO a AuthContext
import { useNotification } from '../../contexts/NotificationContext';

const Register = () => {
  const [formData, setFormData] = useState({
    nickname: '',
    nombre: '',
    apellido: '',
    email: '',
    password: '' // ✅ AGREGADO campo password
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth(); // ✅ CAMBIADO a useAuth()
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await register(formData); // ✅ CAMBIADO a register de Auth

      if (result.success) {
        showNotification('¡Registro exitoso! Ahora puedes participar en el desafío.', 'success');
        navigate('/dashboard');
      } else {
        showNotification(result.error || 'Error en el registro', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showNotification(
        error.message || 'Error de conexión. Verifica que el backend esté ejecutándose.', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="text-4xl">🎮</div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Registro de Jugador</h1>
            <p className="text-gray-600 mt-2">Únete al desafío de seguridad</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                🎮 Nickname
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                required
                placeholder="Tu nombre de hacker"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  placeholder="Tu apellido"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                📧 Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="tu.email@ejemplo.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* ✅ NUEVO CAMPO PASSWORD */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                🔑 Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Crea una contraseña segura"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                  Registrando...
                </div>
              ) : (
                '🎮 Comenzar Desafío'
              )}
            </button>
          </form>

          {/* Game Rules */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <h4 className="font-semibold text-blue-800 mb-2">Reglas del Juego</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Encuentra y explota vulnerabilidades en la aplicación</li>
              <li>• Cada vulnerabilidad tiene un flag único</li>
              <li>• Gana puntos por cada flag encontrada</li>
              <li>• Compite por el primer lugar en el leaderboard</li>
            </ul>
          </div>

          {/* Back to Role Selector */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-green-600 hover:text-green-700 text-sm font-medium">
              ← Volver a la selección de roles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;