import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../services/api';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame debe usarse dentro de GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [gamePlayer, setGamePlayer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [flags, setFlags] = useState([]);

  useEffect(() => {
    const savedPlayer = localStorage.getItem('gamePlayer');
    if (savedPlayer) setGamePlayer(JSON.parse(savedPlayer));
    loadVulnerabilities();
  }, []);

  const loadVulnerabilities = async () => {
    try {
      const data = await ApiService.getVulnerabilities();
      if (!data || data.status === 404) return;
      if (data.success) setVulnerabilities(data.vulnerabilities);
    } catch (error) {
      if (error.status !== 404) console.error('Error loading vulnerabilities:', error);
    }
  };

  const registerPlayer = async (playerData) => {
    try {
      const result = await ApiService.registerGamePlayer(playerData);
      if (result.success) {
        setGamePlayer(result.player);
        localStorage.setItem('gamePlayer', JSON.stringify(result.player));
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const submitFlag = async (flagHash) => {
    if (!gamePlayer) return { success: false, error: 'Jugador no registrado' };
    try {
      const result = await ApiService.submitFlag(flagHash);
      if (!result.success) return { success: false, error: result.message };

      // Calcular nuevo total_score
      const newTotalScore = gamePlayer.total_score + result.points;

      // Actualizar estado
      setGamePlayer(prev => ({ ...prev, total_score: newTotalScore }));

      // Actualizar flags
      const newFlag = {
        flag: flagHash,
        points: result.points,
        vulnerability: result.vulnerability,
        timestamp: new Date().toISOString()
      };
      setFlags(prev => [...prev, newFlag]);

      // Guardar en localStorage
      localStorage.setItem(
        'gamePlayer',
        JSON.stringify({ ...gamePlayer, total_score: newTotalScore })
      );

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await ApiService.getLeaderboard();
      if (data.success) setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  return (
    <GameContext.Provider
      value={{
        gamePlayer,
        leaderboard,
        vulnerabilities,
        flags,
        registerPlayer,
        submitFlag,
        loadLeaderboard
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
