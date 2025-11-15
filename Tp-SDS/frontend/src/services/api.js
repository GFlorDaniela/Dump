import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Configurar axios con manejo de errores mejorado
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 5000, // Reducido timeout para desarrollo
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitudes
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response.data;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    
    // Manejar diferentes tipos de errores
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      return Promise.reject({
        message: 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.',
        status: 0,
        data: null
      });
    }

    if (error.response?.status === 401) {
      return Promise.reject({
        message: 'No autorizado. Por favor inicia sesión.',
        status: 401,
        data: error.response?.data
      });
    }

    if (error.response?.status === 500) {
      return Promise.reject({
        message: 'Error interno del servidor.',
        status: 500,
        data: error.response?.data
      });
    }

    const errorMessage = error.response?.data?.message ||
      error.message || 'Error de conexión con el servidor';
    
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

class ApiService {
  // --- AUTHENTICATION ---
  async login(credentials) {
    return api.post('/auth/login', credentials);
  }

  async logout() {
    return api.post('/auth/logout');
  }

  async registerPlayer(playerData) {
    return api.post('/auth/register/jugador', playerData);
  }

  // --- DASHBOARD & RECIPES ---
  async getDashboard() {
    return api.get('/dashboard');
  }

  async getAllRecipes() {
    return api.get('/recetas');
  }

  async getRecipe(id) {
    return api.get(`/receta/${id}`);
  }

  async unlockRecipe(id, password) {
    return api.post(`/desbloquear_receta/${id}`, { password });
  }

  async searchRecipes(query) {
    return api.post('/buscar', { busqueda: query });
  }

  // --- GAME & VULNERABILITIES ---
  async submitFlag(flagHash) {
      return api.post('/game/submit-flag', {
          flag_hash: flagHash
      });
  }

  async getLeaderboard() {
      return api.get('/game/leaderboard');
  }

  async getVulnerabilities() {
      return api.get('/game/vulnerabilities');
  }

  async registerGamePlayer(playerData) {
      return api.post('/game/register', playerData);
  }

  // --- VULNERABILITY TESTING ENDPOINTS ---
  async testSQLInjectionLogin(credentials) {
      return api.post('/game/sql-injection-login', credentials);
  }

  async testSQLInjectionSearch(query) {
      return api.post('/buscar', { busqueda: query });
  }

  async testInformationDisclosure() {
      return api.get('/game/information-disclosure');
  }

  async testWeakAuthentication(credentials) {
      return api.post('/game/weak-authentication', credentials);
  }

  // --- VULNERABILITY ENDPOINTS ---
  async getProfile(userId = null) {
    const params = userId ? { user_id: userId } : {};
    return api.get('/perfil', { params });
  }

  async getSystemLogs() {
    return api.get('/logs');
  }

  // --- PRESENTADOR ENDPOINTS ---
  async getPresenterDashboard() {
    return api.get('/presentador/dashboard');
  }

  async createPresenter(presenterData) {
    return api.post('/presentador/crear-presentador', presenterData);
  }

  // --- VULNERABILITY TESTING ENDPOINTS ---
  async testSQLInjectionLogin(credentials) {
      return api.post('/game/sql-injection-login', credentials);
  }

  async testSQLInjectionSearch(query) {
      return api.post('/buscar', { busqueda: query });
  }

  async testInformationDisclosure() {
      return api.get('/game/information-disclosure');
  }

  async testWeakAuthentication(credentials) {
      return api.post('/game/weak-authentication', credentials);
  }

}

export default new ApiService();