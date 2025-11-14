import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
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
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        showNotification('¡Inicio de sesión exitoso!', 'success');
        
        // Check if there's a flag in the response (SQL Injection success)
        if (result.data.flag) {
          showNotification(`¡Vulnerabilidad encontrada! Flag: ${result.data.flag}`, 'success', 10000);
        }
        
        navigate('/dashboard');
      } else {
        showNotification(result.error, 'error');
      }
    } catch (error) {
      showNotification('Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (username, password) => {
    setFormData({ username, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="text-4xl">👵</div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Bienvenido de vuelta</h1>
            <p className="text-gray-600 mt-2">Inicia sesión en tu cuenta</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                👤 Usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Ingresa tu usuario"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

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
                placeholder="Ingresa tu contraseña"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                '🔑 Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Quick Fill Buttons */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 text-center mb-3">Rellenado rápido:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFill('abuela', 'abuela123')}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-xl transition-colors"
              >
                👵 Abuela
              </button>
              <button
                type="button"
                onClick={() => quickFill('admin', 'ChefObscuro123!')}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-xl transition-colors"
              >
                👑 Admin
              </button>
            </div>
          </div>

          {/* SQL Injection Hint */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
            <p className="text-sm text-yellow-800 text-center">
              💡 <strong>SQL Injection Test:</strong> Intenta usar <code className="bg-yellow-100 px-1 rounded">' OR '1'='1' --</code> en usuario o contraseña
            </p>
          </div>

          {/* Back to Role Selector */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Volver a la selección de roles
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-3">🔐 Credenciales de Demo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
              <span className="font-medium">Presentadora:</span>
              <div>
                <code className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Daniela</code>
                <code className="bg-green-100 text-green-700 px-2 py-1 rounded ml-2">94477Despeñadero</code>
              </div>
            </div>
            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
              <span className="font-medium">Usuario Normal:</span>
              <div>
                <code className="bg-blue-100 text-blue-700 px-2 py-1 rounded">abuela</code>
                <code className="bg-green-100 text-green-700 px-2 py-1 rounded ml-2">abuela123</code>
              </div>
            </div>
            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
              <span className="font-medium">Administrador:</span>
              <div>
                <code className="bg-blue-100 text-blue-700 px-2 py-1 rounded">admin</code>
                <code className="bg-green-100 text-green-700 px-2 py-1 rounded ml-2">ChefObscuro123!</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;