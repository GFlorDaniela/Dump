// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Configurar axios globalmente
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Importante para cookies de sesión
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    throw error.response?.data || { message: 'Error de conexión' };
  }
);

class ApiService {
  // Autenticación
  async login(username, password) {
    return api.post('/login', { username, password });
  }

  async logout() {
    return api.post('/logout');
  }

  // Dashboard y recetas
  async getDashboard() {
    return api.get('/dashboard');
  }

  async getRecetas() {
    return api.get('/recetas');
  }

  async getReceta(id) {
    return api.get(`/receta/${id}`);
  }

  async desbloquearReceta(id, password) {
    return api.post(`/desbloquear_receta/${id}`, { password });
  }

  // Perfiles (IDOR vulnerability)
  async getPerfil(userId = null) {
    const params = userId ? { user_id: userId } : {};
    return api.get('/perfil', { params });
  }

  // Logs (Broken Access Control vulnerability)
  async getLogs() {
    return api.get('/logs');
  }

  // Búsqueda (SQL Injection vulnerability)
  async buscarRecetas(busqueda) {
    return api.post('/buscar', { busqueda });
  }
}

export default new ApiService();