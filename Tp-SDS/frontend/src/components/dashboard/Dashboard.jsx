import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  
  const { user } = useAuth();
  const { gamePlayer, submitFlag } = useGame();
  const { showNotification } = useNotification();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await ApiService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      showNotification('Error al cargar el dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
        const results = await ApiService.searchRecipes(searchTerm);
        setSearchResults(results.recetas || []);
        setShowSearch(true);

        // ✅ NUEVO: Mostrar flag si viene en la respuesta
        if (results.flag) {
            showNotification(`¡Vulnerabilidad encontrada! Flag: ${results.flag}`, 'success', 10000);
            
            // Auto-submit flag si es jugador
            if (gamePlayer) {
                const flagResult = await submitFlag(results.flag);
                if (flagResult.success) {
                    showNotification(`+${flagResult.data.points} puntos!`, 'success');
                }
            }
        }
    } catch (error) {
        showNotification('Error en la búsqueda', 'error');
    }
};

  const handleUnlockRecipe = async (recipeId, password) => {
    try {
      const result = await ApiService.unlockRecipe(recipeId, password);
      if (result.success) {
        showNotification('¡Receta desbloqueada!', 'success');
        
        // Check for flag
        if (result.flag) {
          showNotification(`¡Flag encontrada! ${result.flag}`, 'success', 10000);
          
          // Auto-submit flag if game player
          if (gamePlayer) {
            const flagResult = await submitFlag(result.flag);
            if (flagResult.success) {
              showNotification(`+${flagResult.data.points} puntos!`, 'success');
            }
          }
        }
        
        loadDashboard(); // Reload data
      } else {
        showNotification('Contraseña incorrecta', 'error');
      }
    } catch (error) {
      showNotification('Error al desbloquear receta', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando recetas secretas..." />;
  }

  const recipesToShow = showSearch ? searchResults : (dashboardData?.recetas || []);
  const blockedRecipes = dashboardData?.bloqueadas || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            👵 ¡Bienvenid{user?.gender === 'F' ? 'a' : 'o'}, {user?.username}!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tu libro de recetas secretas familiares - 
            <span className="text-orange-500 font-semibold"> Encuentra las vulnerabilidades</span>
          </p>
        </div>

        {/* Game Player Stats */}
        {gamePlayer && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8 border-2 border-green-200">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="flex items-center space-x-6 mb-4 lg:mb-0">
                <div className="text-4xl">🎮</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{gamePlayer.nickname}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                      {gamePlayer.total_score} puntos
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      Nivel: {gamePlayer.total_score >= 500 ? 'Hacker Senior' : 
                             gamePlayer.total_score >= 300 ? 'Hacker Intermedio' : 
                             gamePlayer.total_score >= 100 ? 'Hacker Junior' : 'Novato'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Link
                  to="/vulnerabilities"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  🔓 Explorar Vulnerabilidades
                </Link>
                {user?.role === 'presentador' && (
                  <Link
                    to="/leaderboard"
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    🏆 Ver Leaderboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

                {/* Vulnerability Tester - AGREGAR ESTO DESPUÉS DEL GAME PLAYER STATS */}
        {gamePlayer && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8 border-2 border-purple-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🧪 Probador de Vulnerabilidades</h3>
            <p className="text-gray-600 mb-4">
              Ejecuta todas las pruebas automáticamente para capturar flags y ganar puntos.
            </p>
            
            <button
              onClick={async () => {
                if (!gamePlayer) {
                  showNotification('Debes registrarte como jugador primero', 'error');
                  return;
                }

                console.log('🧪 Probando todas las vulnerabilidades...');

                try {
                  // 1. SQL Injection en Login
                  const sqlInjectionLogin = await ApiService.testSQLInjectionLogin({
                    username: "' OR '1'='1' --",
                    password: "test"
                  });
                  
                  if (sqlInjectionLogin.flag) {
                    const flagResult = await submitFlag(sqlInjectionLogin.flag);
                    if (flagResult.success) {
                      showNotification(`✅ SQL Injection Login: +${flagResult.data.points} puntos`, 'success');
                    }
                  }

                  // 2. SQL Injection en Búsqueda
                  const sqlInjectionSearch = await ApiService.testSQLInjectionSearch("test' OR '1'='1");
                  
                  if (sqlInjectionSearch.flag) {
                    const flagResult = await submitFlag(sqlInjectionSearch.flag);
                    if (flagResult.success) {
                      showNotification(`✅ SQL Injection Búsqueda: +${flagResult.data.points} puntos`, 'success');
                    }
                  }

                  // 3. Information Disclosure
                  const infoDisclosure = await ApiService.testInformationDisclosure();
                  
                  if (infoDisclosure.flag) {
                    const flagResult = await submitFlag(infoDisclosure.flag);
                    if (flagResult.success) {
                      showNotification(`✅ Information Disclosure: +${flagResult.data.points} puntos`, 'success');
                    }
                  }

                  // 4. Weak Authentication
                  const weakAuth = await ApiService.testWeakAuthentication({
                    username: "abuela",
                    password: "abuela123"
                  });
                  
                  if (weakAuth.flag) {
                    const flagResult = await submitFlag(weakAuth.flag);
                    if (flagResult.success) {
                      showNotification(`✅ Weak Authentication: +${flagResult.data.points} puntos`, 'success');
                    }
                  }

                  showNotification('¡Todas las vulnerabilidades probadas! Revisa tu puntuación.', 'success');
                  loadDashboard(); // Recargar datos
                  
                } catch (error) {
                  showNotification('Error al probar vulnerabilidades: ' + error.message, 'error');
                }
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🚀 Ejecutar Todas las Pruebas de Vulnerabilidades
            </button>

            <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Vulnerabilidades a probar:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• SQL Injection en Login</li>
                <li>• SQL Injection en Búsqueda</li>
                <li>• Information Disclosure</li>
                <li>• Weak Authentication</li>
              </ul>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Buscar recetas por nombre, ingredientes o categoría..."
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              Buscar Recetas
            </button>
            {showSearch && (
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm('');
                  setSearchResults([]);
                }}
                className="bg-gray-500 text-white px-6 py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-200"
              >
                Limpiar
              </button>
            )}
          </form>

          {/* SQL Injection Hint */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
            <p className="text-yellow-800 text-center">
              💡 <strong>SQL Injection Test:</strong> Prueba con <code className="bg-yellow-100 px-2 py-1 rounded">' OR '1'='1' --</code> en la búsqueda
            </p>
          </div>
        </div>

        {/* Recipes Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">
              {showSearch ? '🔍 Resultados de Búsqueda' : '🍽️ Recetas Disponibles'}
            </h2>
            <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-semibold">
              {recipesToShow.length} receta{recipesToShow.length !== 1 ? 's' : ''}
            </span>
          </div>

          {recipesToShow.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipesToShow.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  onUnlock={handleUnlockRecipe}
                  gamePlayer={gamePlayer}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl shadow-lg">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No se encontraron recetas</h3>
              <p className="text-gray-600">Intenta con otros términos de búsqueda</p>
            </div>
          )}
        </div>

        {/* Blocked Recipes */}
        {blockedRecipes.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">🔒 Recetas Bloqueadas por el Chef Obscuro</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blockedRecipes.map((recipe) => (
                <BlockedRecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  onUnlock={handleUnlockRecipe}
                  gamePlayer={gamePlayer}
                />
              ))}
            </div>
          </div>
        )}

        {/* System Logs - Information Disclosure Vulnerability */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">📋 Logs del Sistema</h3>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"></span>
          </div>
          
          <SystemLogsSection gamePlayer={gamePlayer} />
        </div>

      </div>
    </div>
  );
};

// Subcomponent for Recipe Card
const RecipeCard = ({ recipe, onUnlock, gamePlayer }) => {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [password, setPassword] = useState('');

  const handleUnlock = () => {
    onUnlock(recipe.id, password);
    setShowUnlockModal(false);
    setPassword('');
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-orange-300 transition-all duration-300 hover:scale-105">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              {recipe.categoria}
            </span>
            {recipe.bloqueada && (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                🔒 Bloqueada
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {recipe.bloqueada ? '🔒 ' : ''}{recipe.nombre}
          </h3>
          
          <p className="text-gray-600 mb-4 line-clamp-2">
            <strong>Ingredientes:</strong> {recipe.ingredientes}
          </p>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              ID: {recipe.id} • User: {recipe.user_id}
            </div>
            
            <button
              onClick={() => recipe.bloqueada ? setShowUnlockModal(true) : null}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors duration-200 ${
                recipe.bloqueada 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                  : 'bg-gray-200 text-gray-700 cursor-default'
              }`}
            >
              {recipe.bloqueada ? '🔓 Desbloquear' : '👀 Ver'}
            </button>
          </div>

          {gamePlayer && recipe.bloqueada && (
            <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700 text-sm text-center">
                💡 Encuentra la flag al desbloquear
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h4 className="text-xl font-bold text-gray-800 mb-4">🔓 Desbloquear Receta</h4>
            <p className="text-gray-600 mb-4">Ingresa la contraseña para desbloquear "{recipe.nombre}"</p>
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña secreta..."
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl mb-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={handleUnlock}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
              >
                Desbloquear
              </button>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-blue-700 text-sm">
                💡 <strong>Pista:</strong> Revisa los logs del sistema o prueba contraseñas comunes
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Subcomponent for Blocked Recipe Card
const BlockedRecipeCard = ({ recipe, onUnlock, gamePlayer }) => {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [password, setPassword] = useState('');

  const handleUnlock = () => {
    onUnlock(recipe.id, password);
    setShowUnlockModal(false);
    setPassword('');
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-lg overflow-hidden border-2 border-red-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {recipe.categoria}
          </span>
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            🔒 BLOQUEADA
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-3">
          🔒 {recipe.nombre}
        </h3>
        
        <p className="text-gray-600 mb-4">
          El Chef Obscuro ha protegido esta receta familiar secreta.
        </p>

        <button
          onClick={() => setShowUnlockModal(true)}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-2xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          🗝️ Intentar Desbloquear
        </button>

        {gamePlayer && (
          <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 text-sm text-center">
              🚩 Flag disponible al desbloquear
            </p>
          </div>
        )}
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h4 className="text-xl font-bold text-gray-800 mb-4">🔓 Desbloquear Receta Secreta</h4>
            <p className="text-gray-600 mb-4">Ingresa la contraseña para desbloquear "{recipe.nombre}"</p>
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña secreta..."
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={handleUnlock}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
              >
                🗝️ Desbloquear
              </button>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-yellow-700 text-sm">
                💡 <strong>Pistas:</strong> 
                <br/>• Revisa los logs del sistema cuidadosamente
                <br/>• Prueba contraseñas comunes del Chef Obscuro
                <br/>• Busca en los perfiles de usuario
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent for System Logs
const SystemLogsSection = ({ gamePlayer }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await ApiService.getLogs();
      setLogs(data.logs || []);
      
      // Check for Information Disclosure flag
      if (data.flag) {
        showNotification(`¡Information Disclosure detectado! Flag: ${data.flag}`, 'success', 10000);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando logs...</div>;
  }

  return (
    <div>
      <div className="bg-gray-50 rounded-2xl p-4 max-h-96 overflow-y-auto">
        {logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">{log.timestamp}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.event.includes('SECURITY') 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {log.event}
                  </span>
                </div>
                <p className="text-gray-800">{log.details}</p>
                <div className="text-xs text-gray-500 mt-2">User ID: {log.user_id}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay logs disponibles
          </div>
        )}
      </div>
      
      <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-200">
        <p className="text-red-700 text-center">
          ⚠️ <strong>VULNERABILIDAD:</strong> Los logs del sistema contienen información sensible 
          y deberían ser accesibles solo para administradores.
        </p>
        {gamePlayer && (
          <p className="text-green-700 text-center mt-2 font-semibold">
            🚩 Revisa los logs cuidadosamente - hay una flag oculta
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;