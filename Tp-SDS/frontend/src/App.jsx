import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Recetas from "./components/Recetas";
import Perfil from "./components/Perfil";
import "./App.css";

const App = () => {
  const [currentView, setCurrentView] = useState("login");
  const [user, setUser] = useState(null);
  const [recetas, setRecetas] = useState([]);

  // Simular datos de recetas (en una app real vendrían del backend)
  useEffect(() => {
    const recetasData = [
      {
        id: 1,
        nombre: "Sopa de Tomate Clásica",
        ingredientes: "tomates, cebolla, ajo, albahaca",
        instrucciones: "Cocinar a fuego lento por 45 minutos",
        bloqueada: false,
        categoria: "sopas",
        user_id: 1
      },
      {
        id: 2,
        nombre: "Torta de Chocolate Familiar", 
        ingredientes: "harina, huevos, chocolate, azúcar",
        instrucciones: "Mezclar y hornear a 180° por 30 min",
        bloqueada: false,
        categoria: "postres",
        user_id: 1
      },
      {
        id: 3,
        nombre: "RECETA SECRETA: Salsa Ancestral",
        ingredientes: "INGREDIENTES CLASIFICADOS",
        instrucciones: "INSTRUCCIONES SECRETAS - BLOQUEADA POR CHEF OBSCURO", 
        bloqueada: true,
        password_bloqueo: "S4uc3S3cr3t4!",
        categoria: "salsas",
        user_id: 1
      }
    ];
    setRecetas(recetasData);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("login");
  };

  const renderView = () => {
    switch (currentView) {
      case "login":
        return <Login onLogin={handleLogin} />;
      case "dashboard":
        return <Dashboard 
          user={user} 
          recetas={recetas}
          onViewRecetas={() => setCurrentView("recetas")}
          onViewPerfil={() => setCurrentView("perfil")}
        />;
      case "recetas":
        return <Recetas 
          recetas={recetas}
          onBack={() => setCurrentView("dashboard")}
        />;
      case "perfil":
        return <Perfil 
          user={user}
          onBack={() => setCurrentView("dashboard")}
        />;
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
        onNavigate={setCurrentView} // Si quieres navegación desde el header
      />
      <main className="main-content">
        {renderView()}
      </main>
      <Footer />
    </div>
  );
};

export default App;