import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
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

    const errorMessage = error.response?.data?.message || error.message || 'Error de conexión con el servidor';
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

class ApiService {
  // --- AUTHENTICATION ---
  login(credentials) {
    return api.post('/auth/login', credentials);
  }

  logout() {
    return api.post('/auth/logout');
  }

  registerPlayer(playerData) {
    return api.post('/auth/register', playerData);
  }

  checkSession() {
    return api.get('/auth/check-session');
  }

  // --- DASHBOARD & RECIPES ---
  getDashboard() {
    return api.get('/dashboard');
  }

  getAllRecipes() {
    return api.get('/recetas');
  }

  getRecipe(id) {
    return api.get(`/receta/${id}`);
  }

  unlockRecipe(id, password) {
    return api.post(`/desbloquear_receta/${id}`, { password });
  }

  searchRecipes(query) {
    return api.post('/buscar', { busqueda: query });
  }

  // --- GAME & VULNERABILITIES ---
  submitFlag(flagHash) {
    return api.post('/game/submit-flag', { flag_hash: flagHash });
  }

  getLeaderboard(page = 1, perPage = 20) {
    console.log(`🌐 Haciendo request a /game/leaderboard?page=${page}&per_page=${perPage}`);
    return api.get(`/game/leaderboard?page=${page}&per_page=${perPage}`);
  }

  getVulnerabilities() {
    return api.get('/game/vulnerabilities');
  }

  registerGamePlayer(playerData) {
    return api.post('/game/register', playerData);
  }

  testSQLInjectionLogin(credentials) {
    return api.post('/game/sql-injection-login', credentials);
  }

  testSQLInjectionSearch(searchData) {
    return api.post('/game/sql-injection-search', searchData);
  }

  testSQLInjectionAdvanced(customQuery) {
    return api.post('/game/sql-injection-advanced', { query: customQuery });
  }

  testSQLInjectionDatabase() {
    return api.get('/game/sql-injection-test');
  }

  getDatabaseInfo() {
    return api.get('/game/sql-injection-database-info');
  }

  testInformationDisclosure() {
    return api.get('/game/information-disclosure');
  }

  testWeakAuthentication(credentials) {
    return api.post('/game/weak-authentication', credentials);
  }

  // En ApiService.js - agregar este método
  getMyFlags() {
    return api.get('/game/my-flags');
  }

  // --- VULNERABILITY ENDPOINTS ---
  getProfile(userId = null) {
  const params = userId ? { user_id: userId } : {};
  return api.get('/perfil', { params });
}

async editProfile(targetId, data, externalId = null) {
    const query = externalId ? `?user_id=${externalId}` : "";
    return await api.post(`/perfil/editar${query}`, data);
}


async changePassword(targetId, newPassword, externalId = null) {
    const query = externalId ? `?user_id=${externalId}` : "";
    return await api.post(`/perfil/cambiar-password${query}`, {
        nueva_password: newPassword,
    });
}


getSystemLogs() {
  return api.get('/logs');
}

// En ApiService.js - los métodos quedarían así:
bloquearRecetaIDOR(recetaId, password) {
  return api.post('/game/idor/bloquear-receta', {
    receta_id: recetaId,
    password: password
  });
}

accederRecetaPrivadaIDOR(recetaId) {
  return api.get('/game/idor/recetas-privadas', {
    params: { receta_id: recetaId }
  });
}

cambiarPasswordUsuarioIDOR(userId, nuevaPassword) {
  return api.post('/game/idor/cambiar-password-usuario', {
    user_id: userId,
    nueva_password: nuevaPassword
  });
}

eliminarRecetaIDOR(recetaId) {
  return api.delete('/game/idor/eliminar-receta', {
    params: { receta_id: recetaId }
  });
}

explorarRecursosIDOR() {
  return api.get('/game/idor/explorar-recursos');
}
}

export default new ApiService();

