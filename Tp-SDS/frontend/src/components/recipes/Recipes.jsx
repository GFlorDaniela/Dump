  import React, { useState, useEffect } from 'react';
  import ApiService from '../../services/api';
  import { useGame } from '../../contexts/GameContext';
  import { useNotification } from '../../contexts/NotificationContext';

  const Recipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const { gamePlayer, submitFlag } = useGame();
    const { showNotification } = useNotification();

    useEffect(() => {
      loadRecipes();
    }, []);

    const loadRecipes = async () => {
      try {
        const data = await ApiService.getAllRecipes();
        setRecipes(data.recetas || []);
      } catch (error) {
        showNotification('Error al cargar las recetas', 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleUnlockRecipe = async (recipeId, password) => {
      try {
        const result = await ApiService.unlockRecipe(recipeId, password);
        if (result.success) {
          showNotification('¡Receta desbloqueada!', 'success');
          
          // Check for flag
          if (result.flag && gamePlayer) {
            const flagResult = await submitFlag(result.flag);
            if (flagResult.success) {
              showNotification(`¡Flag capturada! +${flagResult.data.points} puntos`, 'success');
            }
          }
          
          loadRecipes(); // Reload to show unlocked recipe
        } else {
          showNotification('Contraseña incorrecta', 'error');
        }
      } catch (error) {
        showNotification('Error al desbloquear receta', 'error');
      }
    };

    const categories = ['all', 'postres', 'platos fuertes', 'aperitivos', 'bebidas', 'ensaladas'];
    const filteredRecipes = selectedCategory === 'all' 
      ? recipes 
      : recipes.filter(recipe => recipe.categoria === selectedCategory);

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-t-4 border-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando recetas...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">📚 Libro de Recetas Familiar</h1>
            <p className="text-xl text-gray-600">
              La colección completa de recetas secretas de la familia
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:text-gray-900 shadow-lg hover:shadow-xl'
                }`}
              >
                {category === 'all' ? 'Todas' : category}
              </button>
            ))}
          </div>

          {/* Recipes Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onUnlock={handleUnlockRecipe}
                gamePlayer={gamePlayer}
              />
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl shadow-lg">
              <div className="text-6xl mb-4">🍳</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay recetas en esta categoría</h3>
              <p className="text-gray-600">Intenta con otra categoría o desbloquea más recetas</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">📖</div>
              <div className="text-2xl font-bold text-gray-800">{recipes.length}</div>
              <div className="text-gray-600">Recetas Totales</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">🔓</div>
              <div className="text-2xl font-bold text-gray-800">
                {recipes.filter(r => !r.bloqueada).length}
              </div>
              <div className="text-gray-600">Recetas Desbloqueadas</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">🔒</div>
              <div className="text-2xl font-bold text-gray-800">
                {recipes.filter(r => r.bloqueada).length}
              </div>
              <div className="text-gray-600">Recetas Bloqueadas</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">🍽️</div>
              <div className="text-2xl font-bold text-gray-800">
                {new Set(recipes.map(r => r.categoria)).size}
              </div>
              <div className="text-gray-600">Categorías</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Recipe Card Component
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
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
          recipe.bloqueada 
            ? 'border-red-200 hover:border-red-300' 
            : 'border-green-200 hover:border-green-300'
        }`}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                recipe.bloqueada 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {recipe.categoria}
              </span>
              {recipe.bloqueada && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  🔒 BLOQUEADA
                </span>
              )}
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              {recipe.bloqueada ? '🔒 ' : '🍳 '}{recipe.nombre}
            </h3>

            <p className="text-gray-600 mb-4 line-clamp-3">
              <strong>Ingredientes:</strong> {recipe.ingredientes}
            </p>

            {recipe.instrucciones && !recipe.bloqueada && (
              <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                <strong>Preparación:</strong> {recipe.instrucciones}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                ID: {recipe.id}
              </div>

              {recipe.bloqueada ? (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors duration-200"
                >
                  Desbloquear
                </button>
              ) : (
                <span className="bg-green-500 text-white px-4 py-2 rounded-xl font-semibold">
                  Disponible
                </span>
              )}
            </div>

            {/* Flag Hint */}
            {gamePlayer && recipe.bloqueada && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-700 text-sm text-center">
                  💡 Encuentra la flag al desbloquear esta receta
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
              <p className="text-gray-600 mb-4">
                Ingresa la contraseña para desbloquear "{recipe.nombre}"
              </p>

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
                  <strong>Pista:</strong> Revisa los Logs del sistema o prueba contraseñas comunes del Chef Obscuro
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  export default Recipes;