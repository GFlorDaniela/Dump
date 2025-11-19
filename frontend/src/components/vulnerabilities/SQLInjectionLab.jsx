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
  const [capturedTables, setCapturedTables] = useState([]);

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

  // ✅ SIMULAR TABLAS DE BASE DE DATOS
  const simulateDatabaseTables = (vulnerability) => {
    const tables = [];
    
    switch(vulnerability.id) {
      case 4: // Login Bypass
        tables.push({
          name: '🔐 USUARIOS_COMPROMETIDOS',
          description: 'Tabla de usuarios - Credenciales expuestas',
          data: [
            { id: 1, username: 'admin', password: 'ChefObscuro123!', email: 'admin@recetas.com', role: 'admin' },
            { id: 2, username: 'abuela', password: 'abuela123', email: 'abuela@recetas.com', role: 'user' },
            { id: 3, username: 'chef_obscuro', password: 'DarkChef2024!', email: 'chef@obscuro.com', role: 'admin' }
          ]
        });
        break;
        
      case 5: // Recetas Ocultas
        tables.push({
          name: '📋 RECETAS_EXPuestas',
          description: 'Todas las recetas del sistema - Filtros bypasseados',
          data: [
            { id: 1, nombre: 'Sopa de Tomate Clásica', categoria: 'sopas', bloqueada: 'NO', user_id: 'G-0001' },
            { id: 2, nombre: 'Torta de Chocolate Familiar', categoria: 'postres', bloqueada: 'NO', user_id: 'G-0001' },
            { id: 3, nombre: 'RECETA SECRETA: Salsa Ancestral', categoria: 'salsas', bloqueada: 'SÍ', user_id: 'G-0001' },
            { id: 4, nombre: 'Guiso de la Abuela', categoria: 'guisos', bloqueada: 'NO', user_id: 'G-0001' },
            { id: 5, nombre: 'RECETA ULTRA SECRETA: Postre Familiar', categoria: 'postres', bloqueada: 'SÍ', user_id: 'G-0001' }
          ]
        });
        break;
        
      case 6: // UNION Data Extract
        tables.push({
          name: '👥 DATOS_USUARIOS',
          description: 'Información sensible de usuarios - Extraída via UNION',
          data: [
            { id: 'G-0001', username: 'abuela', password: 'abuela123', role: 'user', email: 'abuela@recetas.com' },
            { id: 'G-0002', username: 'admin', password: 'ChefObscuro123!', role: 'admin', email: 'admin@recetas.com' },
            { id: 'G-0003', username: 'chef_obscuro', password: 'DarkChef2024!', role: 'admin', email: 'chef@obscuro.com' },
            { id: 'G-0004', username: 'juan_perez', password: 'password123', role: 'user', email: 'juan@recetas.com' }
          ]
        });
        tables.push({
          name: '🗄️ ESTRUCTURA_BD',
          description: 'Metadatos de la base de datos',
          data: [
            { tabla: 'users', columnas: 'id, username, password, role, email', registros: 5 },
            { tabla: 'recetas', columnas: 'id, nombre, ingredientes, instrucciones, bloqueada, password_bloqueo', registros: 5 },
            { tabla: 'vulnerabilities', columnas: 'id, name, description, difficulty, points, flag_hash', registros: 10 }
          ]
        });
        break;
        
      case 7: // Blind Boolean
        tables.push({
          name: '🎯 INFO_BLIND_SQL',
          description: 'Información obtenida via Blind Boolean Injection',
          data: [
            { tecnica: 'Boolean-based Blind', payload_usado: searchTerm, resultado: 'Vulnerabilidad confirmada', detalles: 'Respuestas diferenciales detectadas' },
            { tecnica: 'Database Version', resultado: 'SQLite 3.35.5', detalles: 'Extraído via time-based' },
            { tecnica: 'Current User', resultado: 'admin', detalles: 'Usuario de la base de datos' }
          ]
        });
        break;
    }
    
    return tables;
  };

  // ✅ VALIDAR LOGROS ESPECÍFICOS - CORREGIDO
  const validateAchievements = (payload, data, error) => {
    const newAchievements = [];
    const payloadLower = payload.toLowerCase();
    const results = data?.recetas || [];
    const resultsCount = results.length;

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
      if (payloadLower.includes("' and 1=1")) return vulnerabilityInfo.find(v => v.id === 7);
    }
    
    return null;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setShowLeak(false);
    setActiveVulnerability(null);
    setCapturedTables([]);

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
        
        // ✅ MOSTRAR TABLAS SIMULADAS PARA ESTA VULNERABILIDAD
        const tables = simulateDatabaseTables(detectedVuln);
        setCapturedTables(tables);
        setShowLeak(true);
      }

      // ✅ SI EL BACKEND DEVUELVE UNA FLAG, CAPTURARLA AUTOMÁTICAMENTE
      if (data.flag) {
        console.log('🚨 Backend devolvió flag automáticamente:', data.flag);
        showNotification(`🎉 ¡Flag encontrada: ${data.flag}!`, 'success');
        
        // Intentar capturar la flag automáticamente
        try {
          const result = await submitFlag(data.flag);
          if (result.success) {
            showNotification(`✅ ¡Flag capturada! +${result.points} puntos`, 'success');
            await refreshGameState();
          }
        } catch (error) {
          console.log('⚠️ Error capturando flag automática:', error);
        }
      }

      // ✅ INTENTAR CAPTURAR FLAGS DE LA VULNERABILIDAD DETECTADA
      if (detectedVuln) {
        await attemptCaptureSQLFlags(detectedVuln, hasAchievements);
      }

    } catch (error) {
      console.error('Error en búsqueda:', error);

      // ✅ DETECTAR VULNERABILIDAD POR ERRORES SQL (Para Blind Boolean)
      const detectedVuln = detectVulnerabilityType(searchTerm, null, error);
      if (detectedVuln) {
        setActiveVulnerability(detectedVuln);
        
        // ✅ MOSTRAR TABLAS SIMULADAS PARA BLIND BOOLEAN
        const tables = simulateDatabaseTables(detectedVuln);
        setCapturedTables(tables);
        setShowLeak(true);
        
        await attemptCaptureSQLFlags(detectedVuln, false);
      }

      if (error.message && (
        error.message.includes('SQL') ||
        error.message.includes('syntax') ||
        error.message.includes('database') ||
        error.message.includes('UNION')
      )) {
        showNotification('💡 Error de base de datos - Vulnerabilidad detectada', 'warning');
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
            `✅ ¡${vuln.name} explotada correctamente! +${result.points} puntos`,
            'success'
          );
          console.log(`🎉 Flag capturada: ${vuln.flag_hash}`);
        } else {
          console.log(`❌ Error con flag ${vuln.flag_hash}:`, result.message);
          showNotification(`⚠️ ${result.message}`, 'warning');
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

  const sqlPoints = calculateSQLPoints();
  const sqlFlags = getSQLFlags();

  // ✅ RENDERIZAR TABLAS CAPTURADAS
  const renderCapturedTables = () => {
    if (capturedTables.length === 0) return null;

    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-green-500">
        <div className="text-center mb-6">
          <h3 className="text-3xl font-bold text-green-800 mb-2">
            🗃️ ¡BASE DE DATOS COMPROMETIDA!
          </h3>
          <p className="text-green-600 text-lg">
            <strong>Vulnerabilidad explotada:</strong> {activeVulnerability?.name}
          </p>
        </div>

        {capturedTables.map((table, tableIndex) => (
          <div key={tableIndex} className="mb-8 border-2 border-green-300 rounded-2xl p-6 bg-green-50">
            <h4 className="text-xl font-bold text-green-800 mb-2">
              {table.name}
            </h4>
            <p className="text-green-700 mb-4 text-sm">
              {table.description}
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-yellow-200">
                  <tr>
                    {table.data.length > 0 && 
                      Object.keys(table.data[0]).map((key) => (
                        <th key={key} className="px-4 py-3 text-left font-semibold text-gray-800">
                          {key.toUpperCase()}
                        </th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {table.data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t hover:bg-yellow-50">
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 border text-gray-700">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

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

        {/* TABLAS DE BASE DE DATOS CAPTURADAS */}
        {renderCapturedTables()}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              📊 Resultados de la Consulta SQL ({results.length} registros)
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((recipe, index) => (
                <div key={index} className={`border rounded-2xl p-4 transition-colors ${
                  recipe.bloqueada ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800 text-lg">
                      {recipe.bloqueada ? '🔒 ' : '🍳 '}
                      {recipe.nombre}
                    </h4>
                    {recipe.bloqueada && (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                        BLOQUEADA
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-2">
                    <strong>Contenido:</strong> {recipe.ingredientes}
                  </p>

                  <div className="text-sm text-gray-500 flex justify-between">
                    <span>ID: {recipe.id}</span>
                    <span>Categoría: {recipe.categoria}</span>
                    <span>User: {recipe.user_id}</span>
                  </div>
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