import ApiService from './api';

export const AuthService = {
  login: async (credentials) => {
    return await ApiService.login(credentials);
  },
  
  logout: async () => {
    return await ApiService.logout();
  },
  
  register: async (userData) => {
    return await ApiService.registerPlayer(userData);
  },
  
  getProfile: async () => {
    return await ApiService.getProfile();
  }
};

export default AuthService;