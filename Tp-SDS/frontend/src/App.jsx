// App.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Recetas from "./components/Recetas";
import Perfil from "./components/Perfil";
import GameRegistration from "./components/GameRegistration";
import FlagSubmission from "./components/FlagSubmission";
import Leaderboard from "./components/Leaderboard";
import ApiService from "./services/api";
import "./App.css";

const App = () => {
  const [currentView, setCurrentView] = useState("login");
  const [user, setUser] = useState(null);
  const [recetas, setRecetas] = useState([]);
  const [recetasBloqueadas, setRecetasBloqueadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gamePlayer, setGamePlayer] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showFlagSubmission, setShowFlagSubmission] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    checkAuth();
    
    // Verificar si hay un jugador guardado en localStorage
    const savedPlayer = localStorage.getItem('gamePlayer');
    if (savedPlayer) {
      setGamePlayer(JSON.parse(savedPlayer));
    }
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const dashboardData = await ApiService.getDashboard();
      if (dashboardData.success) {
        setUser(dashboardData.user);
        setRecetas(dashboardData.recetas || []);
        setRecetasBloqueadas(dashboardData.bloqueadas || []);
        setCurrentView("dashboard");
      }
    } catch (error) {
      console.log("Usuario no autenticado");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      setLoading(true);
      setError("");
      
      const result = await ApiService.login(username, password);
      
      if (result.success) {
        setUser(result.user);
        
        // Obtener datos del dashboard
        const dashboardData = await ApiService.getDashboard();
        setRecetas(dashboardData.recetas || []);
        setRecetasBloqueadas(dashboardData.bloqueadas || []);
        
        setCurrentView("dashboard");
        
        // Mostrar registro de juego si no hay jugador registrado
        if (!gamePlayer && !localStorage.getItem('gamePlayer')) {
          setShowRegistration(true);
        }
        
        // Si hay flag en la respuesta, mostrarla
        if (result.flag) {
          alert(`¡Vulnerabilidad encontrada! Flag: ${result.flag}`);
        }
      } else {
        setError(result.message || "Credenciales incorrectas");
      }
    } catch (error) {
      setError(error.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setUser(null);
      setRecetas([]);
      setRecetasBloqueadas([]);
      setCurrentView("login");
    }
  };

  const handleViewRecetas = async () => {
    try {
      const recetasData = await ApiService.getRecetas();
      if (recetasData.success) {
        setRecetas(recetasData.recetas);
      }
      setCurrentView("recetas");
    } catch (error) {
      setError("Error al cargar recetas");
    }
  };

  const handleViewPerfil = async () => {
    setCurrentView("perfil");
  };

  // Función para registrar jugador
  const handleGameRegister = async (nickname, email) => {
    try {
      const response = await fetch('http://localhost:5000/api/game/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname, email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGamePlayer(data.player);
        setShowRegistration(false);
        localStorage.setItem('gamePlayer', JSON.stringify(data.player));
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Error al registrar jugador');
    }
  };

  // Función para enviar flag
  const handleSubmitFlag = async (playerId, flagHash) => {
    try {
      const response = await fetch('http://localhost:5000/api/game/submit-flag', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ player_id: playerId, flag_hash: flagHash })
      });
      
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Error al enviar flag' };
    }
  };

  // === FUNCIONES CORREGIDAS PARA EL DASHBOARD ===

  const handleBuscarRecetas = async (busqueda) => {
    try {
      const result = await ApiService.buscarRecetas(busqueda);
      // Retornar el array de recetas, no el objeto completo
      if (result.success && Array.isArray(result.recetas)) {
        return result.recetas;
      }
      return [];
    } catch (error) {
      console.error("Error en búsqueda:", error);
      return [];
    }
  };

  const handleGetLogs = async () => {
    try {
      const result = await ApiService.getLogs();
      // Retornar el array de logs, no el objeto completo
      if (result.success && Array.isArray(result.logs)) {
        return result.logs;
      }
      return [];
    } catch (error) {
      console.error("Error al obtener logs:", error);
      return [];
    }
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner">🍳</div>
          <p>Cargando recetas secretas...</p>
        </div>
      );
    }

    switch (currentView) {
      case "login":
        return <Login onLogin={handleLogin} error={error} loading={loading} />;
      case "dashboard":
        return (
          <Dashboard 
            user={user} 
            recetas={recetas}
            recetasBloqueadas={recetasBloqueadas}
            onViewRecetas={handleViewRecetas}
            onViewPerfil={handleViewPerfil}
            onBuscarRecetas={handleBuscarRecetas}  // ← Usar la función corregida
            onGetLogs={handleGetLogs}              // ← Usar la función corregida
            gamePlayer={gamePlayer}
            onShowFlagSubmission={() => setShowFlagSubmission(true)}
            onShowLeaderboard={() => setShowLeaderboard(true)}
          />
        );
      case "recetas":
        return (
          <Recetas 
            recetas={recetas}
            onBack={() => setCurrentView("dashboard")}
          />
        );
      case "perfil":
        return (
          <Perfil 
            user={user}
            onBack={() => setCurrentView("dashboard")}
          />
        );
      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  return (
    <div className="app">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        currentView={currentView}
      />
      <main className="main-content">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}
        {renderView()}
        
        {/* Componentes de gamificación */}
        {showRegistration && (
          <GameRegistration 
            onRegister={handleGameRegister}
            onCancel={() => setShowRegistration(false)}
          />
        )}

        {showFlagSubmission && gamePlayer && (
          <FlagSubmission 
            player={gamePlayer}
            onSubmitFlag={handleSubmitFlag}
            onClose={() => setShowFlagSubmission(false)}
          />
        )}

        {showLeaderboard && (
          <Leaderboard 
            currentPlayer={gamePlayer}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;