import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const dashboardData = await ApiService.getDashboard();
      if (dashboardData.success) {
        setUser(dashboardData.user);
      }
    } catch (error) {
      console.log('Usuario no autenticado o error de conexión:', error.message);
      // No establecer usuario si hay error de autenticación
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError('');
      const result = await ApiService.login({ username, password });
      if (result.success) {
        setUser(result.user);
        return { success: true, data: result };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
      setError('');
    }
  };

  // ✅ NUEVO MÉTODO REGISTER
  const register = async (userData) => {
    try {
      setLoading(true);
      setError('');
      const result = await ApiService.registerPlayer(userData);
      if (result.success) {
        // Opcional: hacer login automático después del registro
        // setUser(result.player);
        return { success: true, data: result };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register, // ✅ AGREGADO
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};