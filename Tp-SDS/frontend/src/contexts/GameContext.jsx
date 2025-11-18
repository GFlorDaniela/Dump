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
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [globalStats, setGlobalStats] = useState({ top_score: 0, total_players: 0 }); // ✅ NUEVO

  useEffect(() => {
    const initializeGameData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Inicializando contexto de juego...');

        // 1. Verificar sesión
        const session = await ApiService.checkSession();
        console.log('✅ Sesión recibida:', session);

        if (session && session.success && session.usuario) {
          console.log('👤 Usuario en sesión:', session.usuario);
          
          const user = session.usuario;
          
          // 2. Si el usuario tiene rol 'jugador', es jugador del juego
          if (user.role === 'jugador') {
            console.log('🎯 Usuario ES jugador');
            
            const playerData = {
              id: user.id,
              nombre: user.nombre,
              apellido: user.apellido,
              email: user.email,
              nickname: user.nickname || user.nombre,
              username: user.username,
              total_score: user.total_score || 0,
              role: 'jugador',
              is_registered: true
            };

            setGamePlayer(playerData);
            console.log('✅ GamePlayer establecido:', playerData);

            // 3. Cargar datos específicos del juego
            try {
              const gameData = await ApiService.getVulnerabilities();
              console.log('📊 Datos de juego:', gameData);
              
              if (gameData && gameData.vulnerabilities) {
                setVulnerabilities(gameData.vulnerabilities);
                setFlags(gameData.vulnerabilities);
                
                if (gameData.total_score !== undefined) {
                  const updatedPlayer = {
                    ...playerData,
                    total_score: gameData.total_score
                  };
                  setGamePlayer(updatedPlayer);
                }
              }
            } catch (gameError) {
              console.log('⚠️ No se pudieron cargar vulnerabilidades:', gameError);
            }
          } else {
            console.log('❌ Usuario NO es jugador (role diferente):', user.role);
            setGamePlayer(null);
          }
        } else {
          console.log('🚫 No hay usuario en sesión');
          setGamePlayer(null);
        }

        // 4. Cargar leaderboard inicial (página 1) - SOLO UNA VEZ
        await loadLeaderboard(1, 20);

      } catch (error) {
        console.error('💥 Error inicializando juego:', error);
        setGamePlayer(null);
      } finally {
        setLoading(false);
      }
    };

    initializeGameData();
  }, []);

  const loadVulnerabilities = async () => {
    try {
      const data = await ApiService.getVulnerabilities();
      if (data) {
        setVulnerabilities(data.vulnerabilities || []);
        setFlags(data.vulnerabilities || []);
      }
    } catch (error) {
      console.error('Error loading vulnerabilities:', error);
    }
  };

  const registerPlayer = async (playerData) => {
    try {
      const result = await ApiService.registerGamePlayer(playerData);
      if (result.success) {
        window.location.reload();
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const submitFlag = async (flagHash) => {
    if (!gamePlayer) {
      return { success: false, error: 'No estás registrado como jugador' };
    }
    
    try {
      const result = await ApiService.submitFlag(flagHash);
      
      if (result.success) {
        const updatedPlayer = {
          ...gamePlayer,
          total_score: (gamePlayer.total_score || 0) + result.points
        };
        setGamePlayer(updatedPlayer);

        const newFlag = {
          flag_hash: flagHash,
          points: result.points,
          vulnerability: result.vulnerability,
          timestamp: new Date().toISOString()
        };
        
        setFlags(prev => [...prev, newFlag]);
        setVulnerabilities(prev => [...prev, newFlag]);

        return { 
          success: true, 
          data: {
            points: result.points,
            vulnerability: result.vulnerability
          }
        };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('Error submitting flag:', error);
      return { 
        success: false, 
        error: error.message || 'Error al enviar la flag' 
      };
    }
  };

  const loadLeaderboard = async (page = 1, perPage = 20) => {
      try {
          console.log(`🔄 [FRONTEND] Cargando leaderboard página ${page}...`);
          const data = await ApiService.getLeaderboard(page, perPage);
          console.log('📊 [FRONTEND] Respuesta del leaderboard:', data);
          
          if (data && data.success) {
              console.log('✅ [FRONTEND] Leaderboard cargado exitosamente');
              setLeaderboard(data.leaderboard || []);
              setPagination(data.pagination || null);
              setGlobalStats(data.global_stats || { top_score: 0, total_players: 0 }); // ✅ ACTUALIZAR
              return data;
          } else {
              console.warn('⚠️ [FRONTEND] Leaderboard no tuvo éxito:', data);
              setLeaderboard([]);
              setPagination(null);
              setGlobalStats({ top_score: 0, total_players: 0 });
              return data;
          }
      } catch (error) {
          console.error('❌ [FRONTEND] Error loading leaderboard:', error);
          setLeaderboard([]);
          setPagination(null);
          setGlobalStats({ top_score: 0, total_players: 0 });
          throw error;
      }
  };

  const refreshGameState = async () => {
    setLoading(true);
    try {
      const session = await ApiService.checkSession();
      if (session && session.success && session.usuario && session.usuario.role === 'jugador') {
        const user = session.usuario;
        const playerData = {
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          nickname: user.nickname || user.nombre,
          username: user.username,
          total_score: user.total_score || 0,
          role: 'jugador',
          is_registered: true
        };
        setGamePlayer(playerData);
        await loadVulnerabilities();
      } else {
        setGamePlayer(null);
      }
      await loadLeaderboard(1, 20);
    } catch (error) {
      console.error('Error refreshing game state:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GameContext.Provider
      value={{
        gamePlayer,
        leaderboard,
        vulnerabilities,
        flags,
        loading,
        pagination,
        globalStats, // ✅ NUEVO
        registerPlayer,
        submitFlag,
        loadLeaderboard,
        loadVulnerabilities,
        refreshGameState
      }}
    >
      {children}
    </GameContext.Provider>
  );
};