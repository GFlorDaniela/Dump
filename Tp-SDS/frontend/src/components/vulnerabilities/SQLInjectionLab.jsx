import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';

const SQLInjectionLab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { gamePlayer, submitFlag } = useGame();
  const { showNotification } = useNotification();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      // Simulación de búsqueda vulnerable a SQL Injection
      const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      setResults(data.recetas || []);
      
      // Check for flag in response
      if (data.flag && gamePlayer) {
        const result = await submitFlag(data.flag);
        if (result.success) {
          showNotification(`¡Flag capturada! +${result.data.points} puntos`, 'success');
        }
      }
    } catch (error) {
      showNotification('Error en la búsqueda', 'error');
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    { input: "' OR '1'='1' --", description: "Bypass de autenticación básico" },
    { input: "admin' --", description: "Acceso como administrador" },
    { input: "'; DROP TABLE users; --", description: "Inyección destructiva (no ejecutada)" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">💉 SQL Injection Lab</h1>
          <p className="text-xl text-gray-600">
            Explota vulnerabilidades de inyección SQL en el sistema de búsqueda
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Recetas
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ingresa tu búsqueda..."
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-semibold transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Buscando...' : '🔍 Buscar Recetas'}
            </button>
          </form>

          {/* Examples */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-3">Ejemplos de SQL Injection:</h4>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-yellow-100 rounded-lg">
                  <code className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                    {example.input}
                  </code>
                  <span className="text-yellow-700 text-sm">{example.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Resultados de Búsqueda</h3>
            <div className="space-y-4">
              {results.map((recipe, index) => (
                <div key={index} className="border border-gray-200 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-800">{recipe.nombre}</h4>
                  <p className="text-gray-600 text-sm mt-1">{recipe.descripcion}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    ID: {recipe.id} • Usuario: {recipe.user_id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📚 Aprendizaje - SQL Injection</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-red-600 mb-3">Riesgos:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Bypass de autenticación</li>
                <li>• Exposición de datos sensibles</li>
                <li>• Ejecución de comandos en BD</li>
                <li>• Eliminación de datos</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600 mb-3">Prevención:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Usar prepared statements</li>
                <li>• Validar y sanitizar inputs</li>
                <li>• Principio de mínimo privilegio</li>
                <li>• ORMs seguros</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLInjectionLab;