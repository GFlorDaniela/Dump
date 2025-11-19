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
  const [vulnerabilityInfo, setVulnerabilityInfo] = useState([]);
  const [activeVulnerability, setActiveVulnerability] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [showHints, setShowHints] = useState(false);

  const { gamePlayer, flags, submitFlag, refreshGameState } = useGame();
  const { showNotification } = useNotification();

  // ✅ CARGAR INFORMACIÓN DE VULNERABILIDADES SQL AL INICIAR
  useEffect(() => {
    const loadVulnerabilityInfo = async () => {
      try {
        const response = await ApiService.getVulnerabilities();
        console.log('📌 TODAS las vulnerabilidades:', response.vulnerabilities);

        // ✅ CORREGIDO: Filtrar por IDs de SQL Injection (4,5,6,7)
        const sqlVulns = response.vulnerabilities.filter(v => 
          v.id === 4 || v.id === 5 || v.id === 6 || v.id === 7
        );

        console.log("🔍 Vulnerabilidades SQL filtradas:", sqlVulns);
        setVulnerabilityInfo(sqlVulns);

      } catch (error) {
        console.error("❌ Error cargando vulnerabilidades:", error);
      }
    };

    loadVulnerabilityInfo();
  }, []);

  // ✅ DETECTAR SI YA COMPLETÓ LAS VULNERABILIDADES SQL
  useEffect(() => {
    if (flags && vulnerabilityInfo.length > 0) {
      const sqlFlags = flags.filter(flag => 
        vulnerabilityInfo.some(vuln => vuln.flag_hash === flag.flag_hash)
      );

      console.log('🎯 Flags de SQL encontradas:', sqlFlags.length, 'de', vulnerabilityInfo.length);
      setIsCompleted(sqlFlags.length === vulnerabilityInfo.length);
    }
  }, [flags, vulnerabilityInfo]);

  // ✅ VALIDAR LOGROS ESPECÍFICOS - CORREGIDO
  const validateAchievements = (payload, data, error) => {
    const newAchievements = [];
    const payloadLower = payload.toLowerCase();
    const results = data?.recetas || [];
    const resultsCount = results.length;

    console.log('🔍 Validando logros con:', { 
      resultsCount, 
      payload: payloadLower,
      data: data 
    });

    // ✅ Logro: SQL Injection detectada por el backend
    if (data?.flag) {
      newAchievements.push({
        type: 'success',
        title: '🎯 SQL Injection Exitosa',
        description: `El backend detectó: ${data.message}`,
        vulnerability: 'SQL Injection Detectada'
      });
    }

    // 🔓 Logro: Mostrar muchas recetas
    if (resultsCount > 3) {
      newAchievements.push({
        type: 'success',
        title: '🔓 Múltiples Recetas Encontradas',
        description: `Encontraste ${resultsCount} recetas`,
        vulnerability: 'Recetas Ocultas'
      });
    }

    // 🔍 Logro: Encontrar contraseñas
    const leakedPasswords = results.filter(r => 
      r?.password_bloqueo && r.password_bloqueo !== "null" && r.password_bloqueo !== ""
    );
    
    if (leakedPasswords.length > 0) {
      newAchievements.push({
        type: 'warning',
        title: '🔍 Contraseñas Expuestas',
        description: `Encontraste ${leakedPasswords.length} contraseñas`,
        vulnerability: 'Information Disclosure'
      });
    }

    // 💾 Logro: Extraer datos sensibles
    const hasSensitiveData = results.some(r => 
      r?.nombre?.includes('admin') || 
      r?.ingredientes?.includes('@') ||
      r?.categoria?.includes('user')
    );
    
    if (hasSensitiveData) {
      newAchievements.push({
        type: 'error',
        title: '💾 Datos Sensibles Extraídos',
        description: 'Accediste a información de otras tablas',
        vulnerability: 'UNION Data Extract'
      });
    }

    // Solo agregar logros nuevos
    setAchievements(prev => {
      const existingTitles = prev.map(a => a.title);
      const uniqueNew = newAchievements.filter(a => !existingTitles.includes(a.title));
      return [...prev, ...uniqueNew];
    });

    return newAchievements.length > 0;
  };

  // ✅ DETECTAR VULNERABILIDAD ESPECÍFICA - CORREGIDO
  const detectVulnerabilityType = (payload, data, error) => {
    const payloadLower = payload.toLowerCase();
    const results = data?.recetas || [];
    const resultsCount = results.length;

    console.log('🔍 Detectando vulnerabilidad:', { 
      payloadLower, 
      resultsCount,
      data: data 
    });

    // ✅ SQL Injection - Login Bypass (ID: 4)
    if ((payloadLower.includes("' or '1'='1") || payloadLower.includes("' or 1=1--")) && resultsCount > 0) {
      console.log('🎯 Detectado: Login Bypass');
      return vulnerabilityInfo.find(v => v.id === 4);
    }
    
    // ✅ SQL Injection - Recetas Ocultas (ID: 5)
    if ((payloadLower.includes("' or 1=1") || payloadLower.includes("%' or")) && resultsCount > 3) {
      console.log('🎯 Detectado: Recetas Ocultas');
      return vulnerabilityInfo.find(v => v.id === 5);
    }
    
    // ✅ SQL Injection - UNION Data Extract (ID: 6)
    if (payloadLower.includes("union") && payloadLower.includes("select")) {
      console.log('🎯 Detectado: UNION Data Extract');
      return vulnerabilityInfo.find(v => v.id === 6);
    }
    
    // ✅ SQL Injection - Blind Boolean (ID: 7)
    if ((payloadLower.includes("' and 1=1") || payloadLower.includes("' and 1=2")) && error) {
      console.log('🎯 Detectado: Blind Boolean');
      return vulnerabilityInfo.find(v => v.id === 7);
    }

    // ✅ Si el backend devuelve una flag, detectar automáticamente
    if (data?.flag) {
      console.log('🎯 Backend devolvió flag automáticamente');
      // Intentar determinar qué vulnerabilidad es basada en el payload
      if (payloadLower.includes("union")) return vulnerabilityInfo.find(v => v.id === 6);
      if (payloadLower.includes("' or '1'='1")) return vulnerabilityInfo.find(v => v.id === 4);
      if (payloadLower.includes("' or 1=1")) return vulnerabilityInfo.find(v => v.id === 5);
    }
    
    return null;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setShowLeak(false);
    setActiveVulnerability(null);

    try {
      console.log('🔍 Ejecutando búsqueda con:', searchTerm);
      const data = await ApiService.searchRecipes(searchTerm);
      console.log('📊 Resultados recibidos:', data);
      
      setResults(data.recetas || []);

      // ✅ VALIDAR LOGROS Y DETECTAR VULNERABILIDAD
      const hasAchievements = validateAchievements(searchTerm, data, null);
      const detectedVuln = detectVulnerabilityType(searchTerm, data, null);
      
      if (detectedVuln) {
        setActiveVulnerability(detectedVuln);
        console.log('🎯 Vulnerabilidad detectada:', detectedVuln.name);
      }

      // ✅ CONDICIONES PARA MOSTRAR INFORMACIÓN Y CAPTURAR FLAGS
      const hasLeakedPasswords = data.recetas?.some(r =>
        r.password_bloqueo && r.password_bloqueo !== "null" && r.password_bloqueo !== ""
      );

      const hasSensitiveData = data.recetas?.some(r => 
        r.nombre?.includes('admin') || r.ingredientes?.includes('@')
      );

      const hasDatabaseInfo = data.recetas?.some(r => 
        r.nombre?.includes('sqlite_') || r.ingredientes?.includes('CREATE TABLE')
      );

      // ✅ SI EL BACKEND DEVUELVE UNA FLAG, CAPTURARLA AUTOMÁTICAMENTE
      if (data.flag) {
        console.log('🚨 Backend devolvió flag automáticamente:', data.flag);
        showNotification(`🎉 ¡Flag encontrada: ${data.flag}!`, 'success');
        
        // Intentar capturar la flag automáticamente
        try {
          const result = await submitFlag(data.flag);
          if (result.success) {
            showNotification(`✅ ¡Flag capturada! +${result.data.points} puntos`, 'success');
            await refreshGameState();
          }
        } catch (error) {
          console.log('⚠️ Error capturando flag automática:', error);
        }
      }

      if (hasLeakedPasswords || hasSensitiveData || hasDatabaseInfo || detectedVuln || data.flag) {
        setShowLeak(true);
        
        if (hasDatabaseInfo) {
          showNotification('🗃️ ¡Estructura de la base de datos expuesta!', 'warning');
        }
        
        if (hasSensitiveData) {
          showNotification('💾 ¡Datos sensibles extraídos de la BD!', 'error');
        }

        // ✅ INTENTAR CAPTURAR FLAGS
        await attemptCaptureSQLFlags(detectedVuln, hasAchievements);
      }

    } catch (error) {
      console.error('Error en búsqueda:', error);

      // ✅ DETECTAR VULNERABILIDAD POR ERRORES SQL
      const detectedVuln = detectVulnerabilityType(searchTerm, null, error);
      if (detectedVuln) {
        setActiveVulnerability(detectedVuln);
      }

      if (error.message && (
        error.message.includes('SQL') ||
        error.message.includes('syntax') ||
        error.message.includes('database') ||
        error.message.includes('UNION')
      )) {
        showNotification('💡 Error de base de datos - Vulnerabilidad detectada', 'warning');
        await attemptCaptureSQLFlags(detectedVuln, false);
      } else {
        showNotification('Error en la búsqueda', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ MÉTODO PARA CAPTURAR FLAGS - MEJORADO
  const attemptCaptureSQLFlags = async (detectedVuln = null, hasAchievements = false) => {
    console.log('🎯 Intentando capturar flags de SQL Injection...');
    
    if (!gamePlayer || vulnerabilityInfo.length === 0) {
      console.log('❌ No hay información de jugador o vulnerabilidades');
      return;
    }

    // Verificar flags existentes
    const existingSQLFlags = flags.filter(flag =>
      vulnerabilityInfo.some(vuln => vuln.flag_hash === flag.flag_hash)
    );

    if (existingSQLFlags.length >= vulnerabilityInfo.length) {
      console.log('✅ Ya completaste todas las vulnerabilidades SQL');
      showNotification(`✅ Ya completaste todas las vulnerabilidades SQL`, 'info');
      return;
    }

    let flagsCaptured = 0;

    // Si se detectó una vulnerabilidad específica, intentar capturar solo esa
    const vulnsToTry = detectedVuln ? [detectedVuln] : [];

    for (const vuln of vulnsToTry) {
      // Saltar si ya está capturada
      if (existingSQLFlags.some(flag => flag.flag_hash === vuln.flag_hash)) {
        continue;
      }

      try {
        console.log(`🔄 Enviando flag: ${vuln.flag_hash} (${vuln.name})`);
        const result = await submitFlag(vuln.flag_hash);

        if (result.success) {
          flagsCaptured++;
          showNotification(
            `✅ ¡${vuln.name} explotada correctamente! +${result.data.points} puntos`,
            'success'
          );
          console.log(`🎉 Flag capturada: ${vuln.flag_hash}`);
        } else {
          console.log(`❌ Error con flag ${vuln.flag_hash}:`, result.error);
          showNotification(`⚠️ ${result.error}`, 'warning');
        }
      } catch (error) {
        console.log(`💥 Error enviando flag ${vuln.flag_hash}:`, error);
        showNotification(`❌ Error capturando flag: ${error.message}`, 'error');
      }
    }

    console.log(`🏁 Captura completada: ${flagsCaptured} flags capturadas`);

    // Actualizar estado después de intentar capturar flags
    if (flagsCaptured > 0) {
      await refreshGameState();
    }
  };

  // ✅ CALCULAR PUNTOS ESPECÍFICOS DE SQL
  const calculateSQLPoints = () => {
    if (!flags || vulnerabilityInfo.length === 0) return 0;
    
    return flags
      .filter(flag => vulnerabilityInfo.some(vuln => vuln.flag_hash === flag.flag_hash))
      .reduce((sum, flag) => sum + (flag.points || 0), 0);
  };

  const getSQLFlags = () => {
    if (!flags || vulnerabilityInfo.length === 0) return [];
    return flags.filter(flag =>
      vulnerabilityInfo.some(vuln => vuln.flag_hash === flag.flag_hash)
    );
  };

  const leakedPasswords = results.filter(r =>
    r.password_bloqueo && r.password_bloqueo !== "null" && r.password_bloqueo !== ""
  );

  const sensitiveData = results.filter(r => 
    r.nombre?.includes('admin') || r.ingredientes?.includes('@') || r.categoria?.includes('user')
  );

  const databaseInfo = results.filter(r => 
    r.nombre?.includes('sqlite_') || r.ingredientes?.includes('CREATE TABLE')
  );

  const sqlPoints = calculateSQLPoints();
  const sqlFlags = getSQLFlags();

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
            Explota vulnerabilidades reales de SQL Injection en nuestra base de datos
          </p>

          {/* Stats del Jugador */}
          {gamePlayer ? (
            <div className="mt-4">
              <div className="flex justify-center space-x-6 mb-4 flex-wrap gap-4">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <div className="text-sm text-gray-600">Jugador</div>
                  <div className="font-bold text-green-600">{gamePlayer.nombre} {gamePlayer.apellido}</div>
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <div className="text-sm text-gray-600">Puntos SQL</div>
                  <div className="font-bold text-blue-600">{sqlPoints}</div>
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <div className="text-sm text-gray-600">Flags SQL</div>
                  <div className="font-bold text-purple-600">{sqlFlags.length}/{vulnerabilityInfo.length}</div>
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <div className="text-sm text-gray-600">Logros</div>
                  <div className="font-bold text-yellow-600">{achievements.length}</div>
                </div>
              </div>

              {/* Vulnerabilidad Activa Detectada */}
              {activeVulnerability && (
                <div className="bg-blue-50 rounded-2xl p-4 max-w-4xl mx-auto mb-4 border border-blue-300">
                  <h4 className="font-semibold text-blue-800 mb-2 text-center">
                    🎯 Vulnerabilidad Detectada: {activeVulnerability.name}
                  </h4>
                  <p className="text-blue-700 text-sm text-center">
                    {activeVulnerability.description}
                  </p>
                  <p className="text-blue-600 text-xs text-center mt-1">
                    Dificultad: {activeVulnerability.difficulty} • {activeVulnerability.points} puntos
                  </p>
                </div>
              )}

              {/* Logros Recientes */}
              {achievements.slice(-3).map((achievement, index) => (
                <div key={index} className={`mb-2 p-3 rounded-lg border ${
                  achievement.type === 'success' ? 'bg-green-50 border-green-200' :
                  achievement.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  achievement.type === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="font-semibold text-sm">{achievement.title}</div>
                  <div className="text-xs text-gray-600">{achievement.description}</div>
                </div>
              ))}

              {/* Flags Capturadas */}
              {sqlFlags.length > 0 && (
                <div className="bg-green-50 rounded-2xl p-4 max-w-4xl mx-auto mb-4 border border-green-300">
                  <h4 className="font-semibold text-green-800 mb-2 text-center">
                    🚩 Flags Capturadas ({sqlFlags.length}/{vulnerabilityInfo.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sqlFlags.map((flag, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-green-300">
                        <div className="font-mono text-green-700 font-bold text-sm">
                          {flag.flag_hash}
                        </div>
                        <div className="text-green-600 text-sm">+{flag.points} puntos</div>
                        <div className="text-xs text-green-500">
                          ✅ {flag.vulnerability_name || 'SQL Injection'}
                        </div>
                      </div>
                    ))}
                  </div>
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
            <div className="flex space-x-2">
              <button
                onClick={() => setShowHints(!showHints)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-2xl font-semibold"
              >
                {showHints ? '❌ Ocultar Objetivos' : '🎯 Ver Objetivos'}
              </button>
              {isCompleted && (
                <span className="bg-green-500 text-white px-4 py-2 rounded-2xl font-semibold">
                  🏆 Completado
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campo de Búsqueda (Vulnerable a SQL Injection)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ej: ' OR '1'='1' --"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-mono"
              />
              <p className="text-sm text-gray-500 mt-1">
                💡 Este campo se conecta directamente con nuestra base de datos SQLite
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !gamePlayer}
              className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 ${loading || !gamePlayer
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
            >
              {!gamePlayer ? '❌ Registro Requerido' :
                loading ? '🔍 Consultando Base de Datos...' :
                  '💉 Ejecutar en Base de Datos'}
            </button>
          </form>

          {/* Objetivos de Vulnerabilidades */}
          {showHints && vulnerabilityInfo.length > 0 && (
            <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-3">🎯 Objetivos de Explotación:</h4>
              <div className="space-y-3">
                {vulnerabilityInfo.map(vuln => (
                  <div key={vuln.id} className="p-3 bg-white rounded-lg border border-purple-100">
                    <div className="font-semibold text-purple-700">{vuln.name}</div>
                    <div className="text-sm text-purple-600 mb-2">{vuln.description}</div>
                    <div className="text-xs text-purple-500">
                      Dificultad: {vuln.difficulty} • {vuln.points} puntos
                    </div>
                    <div className="mt-2 text-xs text-gray-600 bg-purple-50 p-2 rounded">
                      <strong>💡 Pista:</strong> {vuln.solution_hint}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información de la Base de Datos */}
          <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">🗃️ Información de la Base de Datos:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Base de datos: <strong>SQLite</strong></p>
              <p>• Tablas principales: <strong>recetas, users, vulnerabilities</strong></p>
              <p>• Campo vulnerable: <strong>Búsqueda de recetas</strong></p>
              <p className="text-xs text-blue-600 mt-2">
                🔍 Tu objetivo: Explotar esta vulnerabilidad para acceder a información sensible
              </p>
            </div>
          </div>
        </div>

        {/* LEAK Section - Información Extraída */}
        {showLeak && (
          <div className="bg-black rounded-3xl shadow-2xl p-6 mb-8">
            <div className="text-yellow-400 text-xl font-bold mb-4 text-center">
              🚨 ACCESO A BASE DE DATOS CONSEGUIDO
            </div>
            
            {/* Información de la base de datos */}
            {databaseInfo.length > 0 && (
              <div className="mb-4">
                <div className="text-blue-400 font-semibold mb-2">🗃️ Estructura de la Base de Datos:</div>
                <div className="text-blue-300 font-mono space-y-2 text-sm">
                  {databaseInfo.map((info, i) => (
                    <div key={i} className="p-2 bg-gray-900 rounded">
                      <div className="text-yellow-300">{info.nombre}</div>
                      <div className="text-white">{info.ingredientes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contraseñas filtradas */}
            {leakedPasswords.length > 0 && (
              <div className="mb-4">
                <div className="text-green-400 font-semibold mb-2">🔓 Contraseñas de Recetas Bloqueadas:</div>
                <div className="text-green-300 font-mono space-y-2">
                  {leakedPasswords.map((recipe, i) => (
                    <div key={i} className="p-2 bg-gray-900 rounded">
                      <span className="text-yellow-300">{recipe.nombre}:</span> 
                      <span className="text-white ml-2">{recipe.password_bloqueo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Datos sensibles */}
            {sensitiveData.length > 0 && (
              <div>
                <div className="text-red-400 font-semibold mb-2">💾 Datos Sensibles Extraídos:</div>
                <div className="text-red-300 font-mono space-y-2">
                  {sensitiveData.map((data, i) => (
                    <div key={i} className="p-2 bg-gray-900 rounded">
                      <div className="text-yellow-300">{data.nombre}</div>
                      <div className="text-white text-sm">{data.ingredientes}</div>
                      <div className="text-gray-400 text-xs">Tabla: {data.categoria}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-yellow-900 rounded-lg">
              <p className="text-yellow-200 text-center">
                💡 <strong>¡Has accedido a la base de datos!</strong> Continúa explotando para completar todos los objetivos
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              📊 Resultados de la Consulta SQL ({results.length} registros)
            </h3>

            <div className="mb-4 flex space-x-4 text-sm">
              <span className={`px-3 py-1 rounded-full ${results.length > 3 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                Total: {results.length}
              </span>
              <span className={`px-3 py-1 rounded-full ${leakedPasswords.length > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                Contraseñas: {leakedPasswords.length}
              </span>
              <span className={`px-3 py-1 rounded-full ${sensitiveData.length > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                Sensibles: {sensitiveData.length}
              </span>
              <span className={`px-3 py-1 rounded-full ${databaseInfo.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                BD Info: {databaseInfo.length}
              </span>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((recipe, index) => (
                <div key={index} className={`border rounded-2xl p-4 transition-colors ${
                  recipe.bloqueada ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
                } ${databaseInfo.includes(recipe) ? 'border-blue-300 bg-blue-50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800 text-lg">
                      {recipe.bloqueada ? '🔒 ' : '🍳 '}
                      {databaseInfo.includes(recipe) ? '🗃️ ' : ''}
                      {recipe.nombre}
                    </h4>
                    <div className="flex space-x-2">
                      {recipe.bloqueada && (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                          BLOQUEADA
                        </span>
                      )}
                      {databaseInfo.includes(recipe) && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          METADATA BD
                        </span>
                      )}
                      {(recipe.nombre?.includes('admin') || recipe.ingredientes?.includes('@')) && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          SENSIBLE
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-2">
                    <strong>Contenido:</strong> {recipe.ingredientes}
                  </p>

                  <div className="text-sm text-gray-500 flex justify-between">
                    <span>ID: {recipe.id}</span>
                    <span>Categoría: {recipe.categoria}</span>
                    <span>User: {recipe.user_id}</span>
                  </div>

                  {/* Mostrar password si está disponible */}
                  {recipe.password_bloqueo && recipe.password_bloqueo !== "null" && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-yellow-700 text-sm">
                        <strong>🔓 Password expuesta:</strong> {recipe.password_bloqueo}
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
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📚 Aprendizaje - SQL Injection Real</h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-red-600 mb-3">¿Qué lograste explotar?</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• ✅ <strong>Conexión directa a BD</strong> sin validación</li>
                <li>• ✅ <strong>Ejecución de queries arbitrarias</strong> en SQLite</li>
                <li>• ✅ <strong>Acceso a tablas del sistema</strong> (sqlite_master)</li>
                <li>• ✅ <strong>Extracción de datos sensibles</strong> de usuarios</li>
                <li>• ✅ <strong>Bypass de autenticación</strong> y restricciones</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-600 mb-3">Prevención en el Mundo Real:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• 🔒 <strong>Prepared Statements</strong> con parámetros</li>
                <li>• 🔒 <strong>ORM</strong> (Object-Relational Mapping)</li>
                <li>• 🔒 <strong>Validación estricta de inputs</strong></li>
                <li>• 🔒 <strong>Principio de mínimo privilegio</strong> en BD</li>
                <li>• 🔒 <strong>Logs y monitoreo</strong> de queries sospechosas</li>
              </ul>
            </div>
          </div>

          {/* Completion Reward */}
          {isCompleted && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white text-center">
              <div className="text-2xl mb-2">🏆 ¡Todas las SQL Injection Completadas!</div>
              <p className="text-lg">
                Has demostrado habilidades avanzadas de explotación SQL
              </p>
              <p className="text-green-100 mt-2">
                Puntos ganados: <strong>{sqlPoints}</strong> - Revisa el Leaderboard
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SQLInjectionLab;