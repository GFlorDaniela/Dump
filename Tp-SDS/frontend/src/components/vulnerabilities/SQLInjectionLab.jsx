import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';

const SQLInjectionLab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showLeak, setShowLeak] = useState(false);
  
  const { gamePlayer, flags, submitFlag, loading: gameLoading, refreshGameState } = useGame();
  const { showNotification } = useNotification();

  // ✅ DEBUG MEJORADO - Detectar mejor las flags de SQL
  useEffect(() => {
    console.log('🔍 SQL Lab - Estado actual:', {
      gamePlayer,
      totalScore: gamePlayer?.total_score,
      flagsCount: flags?.length,
      isCompleted
    });

    if (flags && flags.length > 0) {
      console.log('📋 DEBUG - Todas las flags del usuario:');
      flags.forEach((flag, index) => {
        console.log(`  ${index + 1}. ${flag.vulnerability || 'Sin nombre'} - ${flag.flag_hash} - ${flag.points} puntos`);
      });
      
      // ✅ DETECCIÓN MEJORADA - Buscar por flag_hash también
      const sqlFlags = flags.filter(flag => {
        const vulnName = flag.vulnerability || '';
        const flagHash = flag.flag_hash || '';
        return (
          vulnName.includes('SQL') || 
          vulnName.includes('Injection') || 
          vulnName.toLowerCase().includes('sql') ||
          flagHash.includes('SQL') ||
          flagHash.includes('SQL1') ||
          flagHash.includes('SQL2') ||
          flagHash.includes('SQLi')
        );
      });
      
      console.log('🎯 DEBUG - Flags de SQL Injection detectadas:', sqlFlags);
      setIsCompleted(sqlFlags.length > 0);
      
      // ✅ ACTUALIZAR PUNTOS SI HAY DISCREPANCIA
      if (gamePlayer && sqlFlags.length > 0) {
        const sqlPoints = sqlFlags.reduce((total, flag) => total + (flag.points || 0), 0);
        console.log('💰 Puntos de SQL Injection calculados:', sqlPoints);
      }
    }
  }, [flags, gamePlayer, gameLoading, isCompleted]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setShowLeak(false);
    
    try {
      const data = await ApiService.searchRecipes(searchTerm);
      setResults(data.recetas || []);
      
      const hasLeakedPasswords = data.recetas?.some(r => 
        r.password_bloqueo && r.password_bloqueo !== "null" && r.password_bloqueo !== ""
      );

      if (hasLeakedPasswords) {
        setShowLeak(true);
        showNotification('🎉 ¡SQL Injection Exitosa! Encontraste contraseñas', 'success');
      }

      // ✅ SISTEMA MEJORADO - Verificar si YA tiene flags de SQL
      if (hasLeakedPasswords && gamePlayer) {
        console.log('🚀 Verificando estado de SQL Injection...');
        
        // Primero verificar si YA tenemos flags de SQL Injection
        const existingSQLFlags = flags.filter(flag => {
          const vulnName = flag.vulnerability || '';
          const flagHash = flag.flag_hash || '';
          return (
            vulnName.includes('SQL') || 
            vulnName.includes('Injection') || 
            vulnName.toLowerCase().includes('sql') ||
            flagHash.includes('SQL') ||
            flagHash.includes('SQL1') ||
            flagHash.includes('SQL2')
          );
        });

        if (existingSQLFlags.length > 0) {
          console.log('✅ Ya tienes flags de SQL Injection:', existingSQLFlags);
          setIsCompleted(true);
          showNotification(`✅ SQL Injection ya completada! Tienes ${existingSQLFlags.length} flag(s)`, 'info');
        } else if (!isCompleted) {
          // ✅ INTENTAR CAPTURAR NUEVAS FLAGS
          console.log('🎯 Intentando capturar nuevas flags...');
          
          const possibleFlags = [
            'SQL1_FLAG_7x9aB2cD',  // ✅ Esta ya la tienes según el log
            'SQL2_FLAG_3y8fE1gH',  // ✅ Esta ya la tienes según el log
            'SQL_INJECTION_FLAG',
            'SQLi_MASTER_FLAG',
            'SQL_INJECTION',
            'FLAG_SQL_INJECTION',
            'SQL_INJECTION_VULNERABILITY',
            'SQLi_FLAG',
            'FLAG_SQLi'
          ];
          
          let flagSubmitted = false;
          let lastError = null;
          
          for (const flag of possibleFlags) {
            try {
              console.log(`🔄 Probando flag: ${flag}`);
              const flagResult = await submitFlag(flag);
              
              if (flagResult.success) {
                setIsCompleted(true);
                showNotification(`✅ SQL Injection completada! +${flagResult.data.points} puntos`, 'success');
                flagSubmitted = true;
                console.log(`🎉 Flag aceptada: ${flag}`);
                break;
              } else {
                lastError = flagResult.error;
                console.log(`❌ Flag rechazada: ${flag} -`, flagResult.error);
                
                // Si el error indica que ya fue capturada, marcar como completado
                if (flagResult.error && (
                  flagResult.error.includes('ya ha sido capturada') ||
                  flagResult.error.includes('already captured') ||
                  flagResult.error.includes('Datos incompletos') // El backend tiene un issue
                )) {
                  console.log(`⚠️ Flag ${flag} ya capturada o con datos incompletos`);
                  // No marcamos como completado aquí porque puede ser error del backend
                }
              }
            } catch (error) {
              lastError = error.message;
              console.log(`💥 Error con flag ${flag}:`, error.message);
            }
          }
          
          if (!flagSubmitted) {
            showNotification(
              `⚠️ SQL Injection detectada. ${lastError ? `Error: ${lastError}` : 'Las flags probadas no funcionaron.'}`,
              'warning'
            );
          }
        }
      }

    } catch (error) {
      console.error('Error en búsqueda:', error);
      showNotification('Error en la búsqueda', 'error');
    } finally {
      setLoading(false);
    }
  };

  const leakedPasswords = results.filter(r => 
    r.password_bloqueo && r.password_bloqueo !== "null" && r.password_bloqueo !== ""
  );

  const examples = [
    { input: "' OR '1'='1' --", description: "Mostrar todas las recetas" },
    { input: "test' UNION SELECT 1,username,password,4,5,6,7,8 FROM users --", description: "Extraer usuarios y contraseñas" },
    { input: "admin' --", description: "Bypass de búsqueda específica" }
  ];

  // ✅ CALCULAR PUNTOS TOTALES DE SQL
  const calculateSQLPoints = () => {
    if (!flags || flags.length === 0) return 0;
    const sqlFlags = flags.filter(flag => {
      const flagHash = flag.flag_hash || '';
      return flagHash.includes('SQL1') || flagHash.includes('SQL2');
    });
    return sqlFlags.reduce((total, flag) => total + (flag.points || 0), 0);
  };

  const sqlPoints = calculateSQLPoints();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-red-50 to-orange-50 py-8 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-800 mr-4">💉 SQL Injection Lab</h1>
            {isCompleted && (
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                ✅ COMPLETADO
              </span>
            )}
          </div>
          <p className="text-xl text-gray-600">
            Explota vulnerabilidades de inyección SQL en el sistema de búsqueda
          </p>
          
          {/* Stats del Jugador - MEJORADO */}
          {gamePlayer ? (
            <div className="mt-4">
              <div className="flex justify-center space-x-6 mb-4">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <div className="text-sm text-gray-600">Jugador</div>
                  <div className="font-bold text-green-600">{gamePlayer.nombre} {gamePlayer.apellido}</div>
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <div className="text-sm text-gray-600">Puntos Totales</div>
                  <div className="font-bold text-green-600">{gamePlayer.total_score || 0}</div>
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <div className="text-sm text-gray-600">Puntos SQL</div>
                  <div className="font-bold text-blue-600">{sqlPoints}</div>
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <div className="text-sm text-gray-600">Flags Totales</div>
                  <div className="font-bold text-purple-600">{flags?.length || 0}</div>
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <div className="text-sm text-gray-600">Estado SQL</div>
                  <div className={`font-bold ${isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isCompleted ? '✅ Completado' : '⏳ Pendiente'}
                  </div>
                </div>
              </div>
              
              {/* ✅ MOSTRAR FLAGS DE SQL ESPECÍFICAMENTE */}
              {flags && flags.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4 max-w-4xl mx-auto mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-center">🚩 Tus Flags de SQL Injection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {flags.filter(flag => {
                      const flagHash = flag.flag_hash || '';
                      return flagHash.includes('SQL1') || flagHash.includes('SQL2');
                    }).map((flag, index) => (
                      <div key={index} className="bg-green-50 rounded-lg p-2 text-xs border border-green-300">
                        <div className="font-mono text-green-700 font-bold">
                          {flag.flag_hash}
                        </div>
                        <div className="text-green-600">+{flag.points} puntos</div>
                        <div className="text-xs text-green-500">✅ SQL Injection</div>
                      </div>
                    ))}
                  </div>
                  {flags.filter(flag => {
                    const flagHash = flag.flag_hash || '';
                    return flagHash.includes('SQL1') || flagHash.includes('SQL2');
                  }).length === 0 && (
                    <p className="text-gray-500 text-center text-sm">No tienes flags de SQL Injection aún</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-200">
              <p className="text-red-700 text-center">
                ❌ <strong>No se pudo detectar como jugador</strong>
              </p>
            </div>
          )}
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Búsqueda Vulnerable a SQLi</h3>
            {isCompleted && (
              <span className="bg-green-500 text-white px-4 py-2 rounded-2xl font-semibold">
                🏆 Vulnerabilidad Completada
              </span>
            )}
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Recetas (Vulnerable a SQL Injection)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ej: ' OR '1'='1' --"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-mono"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !gamePlayer}
              className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 ${
                loading || !gamePlayer
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {!gamePlayer ? '❌ Registro Requerido' : 
               loading ? '🔍 Ejecutando SQL Injection...' : 
               '💉 Ejecutar SQL Injection'}
            </button>
          </form>

          {/* Examples */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-3">Payloads de SQL Injection:</h4>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setSearchTerm(example.input)}
                  disabled={!gamePlayer}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    !gamePlayer 
                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
                      : 'hover:bg-yellow-100 border-yellow-200 hover:border-yellow-300'
                  }`}
                >
                  <code className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-mono">
                    {example.input}
                  </code>
                  <span className="text-yellow-700 text-sm ml-3">{example.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LEAK Section - Información Extraída */}
        {showLeak && leakedPasswords.length > 0 && (
          <div className="bg-black rounded-3xl shadow-2xl p-6 mb-8">
            <div className="text-yellow-400 text-xl font-bold mb-4 text-center">
              🚨 SQL INJECTION EXITOSA - INFORMACIÓN EXTRAÍDA
            </div>
            <div className="text-green-400 font-mono space-y-3">
              {leakedPasswords.map((recipe, i) => (
                <div key={i} className="p-3 bg-gray-900 rounded-lg">
                  <div className="text-yellow-300">[LEAK] {recipe.nombre}</div>
                  <div className="text-green-300">→ PASSWORD: <span className="text-white font-bold">{recipe.password_bloqueo}</span></div>
                  <div className="text-gray-400 text-sm mt-1">
                    ID: {recipe.id} • Categoría: {recipe.categoria}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-900 rounded-lg">
              <p className="text-yellow-200 text-center">
                💡 <strong>Usa estas contraseñas</strong> para desbloquear recetas en el Dashboard
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              📊 Resultados de Búsqueda ({results.length} recetas)
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((recipe, index) => (
                <div key={index} className="border border-gray-200 rounded-2xl p-4 hover:border-red-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800 text-lg">
                      {recipe.bloqueada ? '🔒 ' : '🍳 '}{recipe.nombre}
                    </h4>
                    {recipe.bloqueada ? (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                        BLOQUEADA
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        DISPONIBLE
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-2">
                    <strong>Ingredientes:</strong> {recipe.ingredientes}
                  </p>
                  
                  <div className="text-sm text-gray-500 flex justify-between">
                    <span>ID: {recipe.id}</span>
                    <span>Categoría: {recipe.categoria}</span>
                    <span>User: {recipe.user_id}</span>
                  </div>
                  
                  {/* Mostrar password si está disponible */}
                  {recipe.password_bloqueo && recipe.password_bloqueo !== "null" && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                      <span className="text-green-700 text-sm">
                        <strong>Password encontrada:</strong> {recipe.password_bloqueo}
                      </span>
                    </div>
                  )}
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
              <h4 className="font-semibold text-red-600 mb-3">Riesgos Detectados:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• ✅ <strong>Exposición de contraseñas</strong> de recetas bloqueadas</li>
                <li>• ✅ <strong>Bypass de autenticación</strong> en búsquedas</li>
                <li>• ✅ <strong>Extracción de datos</strong> de la base de datos</li>
                <li>• ✅ <strong>Información sensible</strong> de usuarios y recetas</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600 mb-3">Prevención Recomendada:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• 🔒 <strong>Prepared Statements</strong> en todas las consultas</li>
                <li>• 🔒 <strong>Validación de inputs</strong> en frontend y backend</li>
                <li>• 🔒 <strong>Principio de mínimo privilegio</strong> en BD</li>
                <li>• 🔒 <strong>WAF</strong> (Web Application Firewall)</li>
              </ul>
            </div>
          </div>

          {/* Completion Reward */}
          {isCompleted && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white text-center">
              <div className="text-2xl mb-2">🏆 ¡Vulnerabilidad Completada!</div>
              <p className="text-lg">
                Has ganado <strong>puntos</strong> por encontrar y explotar SQL Injection
              </p>
              <p className="text-green-100 mt-2">
                Revisa tu posición en el Leaderboard
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SQLInjectionLab;