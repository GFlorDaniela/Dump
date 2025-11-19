import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import ApiService from '../../services/api';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentScore, setCurrentScore] = useState(0); 
  const { user, logout } = useAuth();
  const { gamePlayer, refreshGameState } = useGame();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCurrentScore = async () => {
      if (gamePlayer) {
        try {
          console.log('🏆 Header: Cargando score actualizado...');
          const leaderboardData = await ApiService.getLeaderboard(1, 100);
          
          if (leaderboardData?.leaderboard && Array.isArray(leaderboardData.leaderboard)) {
            const currentUserInLeaderboard = leaderboardData.leaderboard.find(player => 
              player.id === user?.id || 
              player.email === user?.email || 
              player.username === user?.username
            );
            
            if (currentUserInLeaderboard) {
              setCurrentScore(currentUserInLeaderboard.total_score || 0);
              console.log('🎯 Header: Score actualizado:', currentUserInLeaderboard.total_score);
            } else {
              setCurrentScore(gamePlayer.total_score || 0);
              console.log('⚠️ Header: Usuario no encontrado en leaderboard');
            }
          } else {
            setCurrentScore(gamePlayer.total_score || 0);
          }
        } catch (error) {
          console.log('❌ Header: Error cargando score, usando valor por defecto');
          setCurrentScore(gamePlayer.total_score || 0);
        }
      }
    };

    loadCurrentScore();
  }, [gamePlayer, user?.id, user?.email, user?.username]);

  const navigation = user?.role === 'presentador' ? [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Vulnerabilidades', href: '/vulnerabilities', icon: '🔓' },
    { name: 'Recetas', href: '/recipes', icon: '📖' },
    { name: 'Perfil', href: '/profile', icon: '👤' }, 
    { name: 'Leaderboard', href: '/leaderboard', icon: '🏆' },
    { name: 'Panel Presentador', href: '/presenter', icon: '🎤' },
  ] : [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Vulnerabilidades', href: '/vulnerabilities', icon: '🔓' },
    { name: 'Recetas', href: '/recipes', icon: '📖' },
    { name: 'Perfil', href: '/profile', icon: '👤' }, 
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="text-3xl">👵</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Abuela Cripto</h1>
                <p className="text-xs text-gray-500">Recetas Secretas</p>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isActive(item.href.split('?')[0])
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {gamePlayer && (
              <div className="hidden sm:flex items-center space-x-3 bg-green-50 px-3 py-2 rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  🎮 {gamePlayer.nickname}
                </span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                  {currentScore} pts 
                </span>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-800">{user?.username}</div>
                <div className={`text-xs ${
                  user?.role === 'presentador' ? 'text-purple-600' : 'text-gray-500'
                }`}>
                  {user?.role === 'presentador' ? '🎤 Presentador' : '👤 Usuario'}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Salir</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive(item.href.split('?')[0])
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}

              {gamePlayer && (
                <div className="px-4 py-3 bg-green-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">
                      🎮 {gamePlayer.nickname}
                    </span>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      {currentScore} pts 
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;