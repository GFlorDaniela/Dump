import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---------- Verificar sesión al iniciar ----------
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const data = await ApiService.checkSession();
      if (data.success && data.usuario) {
        setUser(data.usuario);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Login ----------
  const login = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const data = await ApiService.login({ username, password });
      if (data.success && data.usuario) {
        setUser(data.usuario);
        return { success: true };
      } else {
        setError(data.message || 'Usuario o contraseña incorrectos');
        return { success: false };
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ---------- Logout ----------
  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (err) {
      console.error('Error en logout:', err);
    } finally {
      setUser(null);
    }
  };

  // ---------- Registro ----------
  const register = async (userData) => {
    setLoading(true);
    setError('');
    try {
      const data = await ApiService.registerPlayer(userData);
      if (data.success && data.usuario) {
        setUser(data.usuario);
      }
      return data;
    } catch (err) {
      console.error('Error en registro:', err);
      return { success: false, message: err.message || 'Error al registrar usuario' };
    } finally {
      setLoading(false);
    }
  };

  // ---------- Actualizar usuario manualmente (opcional) ----------
  const updateUser = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        register,
        setError,
        updateUser,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
