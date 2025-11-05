// App.jsx
import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Recetas from "./components/Recetas";
import Perfil from "./components/Perfil";
import ApiService from "./services/api";
import "./App.css";

const App = () => {
  const [currentView, setCurrentView] = useState("login");
  const [user, setUser] = useState(null);
  const [recetas, setRecetas] = useState([]);
  const [recetasBloqueadas, setRecetasBloqueadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    checkAuth();
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
      // No autenticado, mantener en login
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

  const handleDesbloquearReceta = async (recetaId, password) => {
    try {
      const result = await ApiService.desbloquearReceta(recetaId, password);
      if (result.success) {
        // Actualizar la lista de recetas
        const dashboardData = await ApiService.getDashboard();
        setRecetas(dashboardData.recetas || []);
        setRecetasBloqueadas(dashboardData.bloqueadas || []);
        
        // Si hay flag, mostrarlo
        if (result.flag) {
          alert(`¡FELICIDADES! Flag encontrado: ${result.flag}`);
        }
        
        return { success: true, receta: result.receta, flag: result.flag };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const handleBuscarRecetas = async (busqueda) => {
    try {
      const result = await ApiService.buscarRecetas(busqueda);
      if (result.success) {
        return result.recetas;
      }
      return [];
    } catch (error) {
      console.error("Error en búsqueda:", error);
      return [];
    }
  };

  const handleGetPerfil = async (userId = null) => {
    try {
      const result = await ApiService.getPerfil(userId);
      if (result.success) {
        return result.usuario;
      }
      return null;
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      return null;
    }
  };

  const handleGetLogs = async () => {
    try {
      const result = await ApiService.getLogs();
      if (result.success) {
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
            onBuscarRecetas={handleBuscarRecetas}
            onGetLogs={handleGetLogs}
          />
        );
      case "recetas":
        return (
          <Recetas 
            recetas={recetas}
            recetasBloqueadas={recetasBloqueadas}
            onBack={() => setCurrentView("dashboard")}
            onDesbloquearReceta={handleDesbloquearReceta}
            onGetReceta={ApiService.getReceta}
          />
        );
      case "perfil":
        return (
          <Perfil 
            user={user}
            onBack={() => setCurrentView("dashboard")}
            onGetPerfil={handleGetPerfil}
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
        onNavigate={setCurrentView}
      />
      <main className="main-content">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}
        {renderView()}
      </main>
      <Footer />
    </div>
  );
};

export default App;