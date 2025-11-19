import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Components
import Start from './components/auth/Start';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import VulnerabilityLab from './components/vulnerabilities/VulnerabilityLab';
import SQLInjectionLab from './components/vulnerabilities/SQLInjectionLab';
import IDORLab from './components/vulnerabilities/IDORLab';
import InfoDisclosureLab from './components/vulnerabilities/InfoDisclosureLab';
import WeakAuthLab from './components/vulnerabilities/WeakAuthLab';
import Leaderboard from './components/game/Leaderboard';
import Profile from './components/profile/Profile';
import Recipes from './components/recipes/Recipes';
import PresenterDashboard from './components/presenter/PresenterDashboard';

// UI Components
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Notification from './components/ui/Notification';

// Styles
import './styles/globals.css';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="Verificando autenticación..." />
      </div>
    );
  }

  return (
    // ✅ CAMBIA ESTA LÍNEA - Añade w-full y overflow-hidden
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      {user && <Header />}
      {/* ✅ AÑADE w-full aquí también */}
      <main className="flex-1 w-full">
        <Routes>
          {!user ? (
            // Routes for non-authenticated users
            <>
              <Route path="/" element={<Start />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            // Routes for authenticated users
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vulnerabilities" element={<VulnerabilityLab />} />
              <Route path="/sql-injection" element={<SQLInjectionLab />} />
              <Route path="/idor" element={<IDORLab />} />
              <Route path="/info-disclosure" element={<InfoDisclosureLab />} />
              <Route path="/weak-auth" element={<WeakAuthLab />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/recipes" element={<Recipes />} />
              {user.role === 'presentador' && (
                <Route path="/presenter" element={<PresenterDashboard />} />
              )}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </main>
      <Footer />
      <Notification />
    </div>
  );
};

function App() {
  return (
    // ✅ AÑADE un div contenedor con ancho completo
    <div className="w-full">
      <Router>
        <NotificationProvider>
          <AuthProvider>
            <GameProvider>
              <AppContent />
            </GameProvider>
          </AuthProvider>
        </NotificationProvider>
      </Router>
    </div>
  );
}

export default App;