import ApiService from './api';

export const GameService = {
  submitFlag: async (flagHash) => {
    return await ApiService.submitFlag(flagHash);
  },
  
  getLeaderboard: async () => {
    return await ApiService.getLeaderboard();
  },
  
  getVulnerabilities: async () => {
    return await ApiService.getVulnerabilities();
  },
  
  registerPlayer: async (playerData) => {
    return await ApiService.registerGamePlayer(playerData);
  }
};

export default GameService;
