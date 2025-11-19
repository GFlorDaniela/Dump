import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/api';

const IDORLab = () => {
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showLeak, setShowLeak] = useState(false);
  const [vulnerabilityInfo, setVulnerabilityInfo] = useState([]);
  const [activeVulnerability, setActiveVulnerability] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [explorationData, setExplorationData] = useState(null);
  const [activeTab, setActiveTab] = useState('explore');

  // Estados para las acciones IDOR
  const [bloquearForm, setBloquearForm] = useState({ recetaId: '', password: '' });
  const [recetaPrivadaId, setRecetaPrivadaId] = useState('');
  const [cambiarPasswordForm, setCambiarPasswordForm] = useState({ userId: '', nuevaPassword: '' });
  const [eliminarRecetaId, setEliminarRecetaId] = useState('');

  const { gamePlayer, flags, submitFlag, refreshGameState } = useGame();
  const { showNotification } = useNotification();

  // ✅ CARGAR INFORMACIÓN DE VULNERABILIDADES IDOR AL INICIAR
  useEffect(() => {
    const loadVulnerabilityInfo = async () => {
      try {
        const response = await ApiService.getVulnerabilities();
        console.log('📌 TODAS las vulnerabilidades:', response.vulnerabilities);

        // ✅ Filtrar por IDs de IDOR AVANZADAS (8, 9, 10, 11)
        const idorVulns = response.vulnerabilities.filter(v =>
          v.id === 8 || v.id === 9 || v.id === 10 || v.id === 11
        );

        console.log("🔍 Vulnerabilidades IDOR avanzadas filtradas:", idorVulns);
        setVulnerabilityInfo(idorVulns);

      } catch (error) {
        console.error("❌ Error cargando vulnerabilidades:", error);
      }
    };

    loadVulnerabilityInfo();
  }, []);

  // ✅ DETECTAR SI YA COMPLETÓ LAS VULNERABILIDADES IDOR
  useEffect(() => {
    if (flags && vulnerabilityInfo.length > 0) {
      const idorFlags = flags.filter(flag =>
        vulnerabilityInfo.some(vuln => vuln.flag_hash === flag.flag_hash)
      );

      console.log('🎯 Flags de IDOR avanzadas encontradas:', idorFlags.length, 'de', vulnerabilityInfo.length);
      setIsCompleted(idorFlags.length === vulnerabilityInfo.length);
    }
  }, [flags, vulnerabilityInfo]);

  // ✅ EXPLORAR RECURSOS DISPONIBLES
  const handleExploreResources = async () => {
    try {
      setLoading(true);
      const data = await ApiService.explorarRecursosIDOR();
      setExplorationData(data);
      showNotification('Recursos explorados exitosamente', 'success');
    } catch (error) {
      showNotification('Error explorando recursos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ DETECTAR VULNERABILIDAD ESPECÍFICA DE IDOR AVANZADAS
  const detectVulnerabilityType = (resourceId, data, actionType) => {
    console.log('🔍 Detectando vulnerabilidad IDOR avanzada:', {
      resourceId,
      actionType,
      data: data
    });

    // ✅ IDOR - Bloqueo de Recetas Ajenas (ID: 8)
    if (actionType === 'block' && data?.success && data?.receta_bloqueada?.user_id_propietario !== gamePlayer?.numeric_id) {
      console.log('🎯 Detectado: IDOR en Bloqueo de Recetas');
      return vulnerabilityInfo.find(v => v.id === 8);
    }

    // ✅ IDOR - Acceso a Recetas Privadas (ID: 9) - CORREGIDO
    if (actionType === 'private' && data?.success && data?.receta?.privada && data.receta.user_id !== gamePlayer?.numeric_id) {
      console.log('🎯 Detectado: IDOR en Recetas Privadas');
      return vulnerabilityInfo.find(v => v.id === 9);
    }

    // ✅ IDOR - Cambio de Contraseña (ID: 10)
    if (actionType === 'password' && data?.success && data?.usuario_afectado?.id !== gamePlayer?.numeric_id) {
      console.log('🎯 Detectado: IDOR en Cambio de Contraseña');
      return vulnerabilityInfo.find(v => v.id === 10);
    }

    // ✅ IDOR - Eliminación de Recetas (ID: 11)
    if (actionType === 'delete' && data?.success && data?.receta_eliminada?.user_id_propietario !== gamePlayer?.numeric_id) {
      console.log('🎯 Detectado: IDOR en Eliminación de Recetas');
      return vulnerabilityInfo.find(v => v.id === 11);
    }

    // ✅ Si el backend devuelve una flag, detectar automáticamente
    if (data?.flag) {
      console.log('🎯 Backend devolvió flag automáticamente:', data.flag);
      if (data.flag === 'a7d8f9e0b1c2d3e4f5a6b7c8d9e0f1a2') return vulnerabilityInfo.find(v => v.id === 8);
      if (data.flag === 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a') return vulnerabilityInfo.find(v => v.id === 9);
      if (data.flag === 'd7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b') return vulnerabilityInfo.find(v => v.id === 10);
      if (data.flag === 'e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c') return vulnerabilityInfo.find(v => v.id === 11);
    }

    return null;
  };

  // ✅ BLOQUEAR RECETA (IDOR 8)
  const handleBloquearReceta = async () => {
    if (!bloquearForm.recetaId || !bloquearForm.password) {
      showNotification('ID de receta y contraseña requeridos', 'warning');
      return;
    }

    try {
      setLoading(true);
      const result = await ApiService.bloquearRecetaIDOR(bloquearForm.recetaId, bloquearForm.password);

      if (result.success) {
        showNotification(result.message, 'success');

        // ✅ DETECTAR VULNERABILIDAD
        const detectedVuln = detectVulnerabilityType(bloquearForm.recetaId, result, 'block');

        if (detectedVuln) {
          setActiveVulnerability(detectedVuln);
          setShowLeak(true);
        }

        // ✅ CHECK FOR FLAG - CORREGIDO: Primero verificar si el backend ya devolvió una flag
        if (result.flag && gamePlayer) {
          console.log('🚩 Backend devolvió flag automáticamente:', result.flag);
          showNotification(`¡IDOR de bloqueo explotado! Flag: ${result.flag}`, 'success', 10000);
          const flagResult = await submitFlag(result.flag);
          if (flagResult.success) {
            showNotification(`+${flagResult.data.points} puntos!`, 'success');
            await refreshGameState();
          } else {
            showNotification(`⚠️ ${flagResult.error}`, 'warning');
          }
        } else if (detectedVuln) {
          // ✅ Si no hay flag automática pero detectamos vulnerabilidad, intentar capturar
          await attemptCaptureIDORFlags(detectedVuln);
        }

        setBloquearForm({ recetaId: '', password: '' });
      }
    } catch (error) {
      showNotification('Error al bloquear receta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ACCEDER A RECETA PRIVADA (IDOR 9) - CORREGIDO
  const handleAccederRecetaPrivada = async () => {
    if (!recetaPrivadaId) {
      showNotification('ID de receta requerido', 'warning');
      return;
    }

    try {
      setLoading(true);
      const result = await ApiService.accederRecetaPrivadaIDOR(recetaPrivadaId);

      if (result.success) {
        showNotification('Receta privada accedida exitosamente', 'success');

        // ✅ DETECTAR VULNERABILIDAD
        const detectedVuln = detectVulnerabilityType(recetaPrivadaId, result, 'private');

        if (detectedVuln) {
          setActiveVulnerability(detectedVuln);
          setShowLeak(true);
        }

        // ✅ CHECK FOR FLAG - CORREGIDO
        if (result.flag && gamePlayer) {
          console.log('🚩 Backend devolvió flag automáticamente:', result.flag);
          showNotification(`¡IDOR de receta privada explotado! Flag: ${result.flag}`, 'success', 10000);
          const flagResult = await submitFlag(result.flag);
          if (flagResult.success) {
            showNotification(`+${flagResult.data.points} puntos!`, 'success');
            await refreshGameState();
          } else {
            showNotification(`⚠️ ${flagResult.error}`, 'warning');
          }
        } else if (detectedVuln) {
          await attemptCaptureIDORFlags(detectedVuln);
        }
      }
    } catch (error) {
      showNotification('Error al acceder a receta privada', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CAMBIAR CONTRASEÑA DE USUARIO (IDOR 10)
  const handleCambiarPasswordUsuario = async () => {
    if (!cambiarPasswordForm.userId || !cambiarPasswordForm.nuevaPassword) {
      showNotification('ID de usuario y nueva contraseña requeridos', 'warning');
      return;
    }

    try {
      setLoading(true);
      const result = await ApiService.cambiarPasswordUsuarioIDOR(cambiarPasswordForm.userId, cambiarPasswordForm.nuevaPassword);

      if (result.success) {
        showNotification(result.message, 'success');

        // ✅ DETECTAR VULNERABILIDAD
        const detectedVuln = detectVulnerabilityType(cambiarPasswordForm.userId, result, 'password');

        if (detectedVuln) {
          setActiveVulnerability(detectedVuln);
          setShowLeak(true);
        }

        // ✅ CHECK FOR FLAG - CORREGIDO
        if (result.flag && gamePlayer) {
          console.log('🚩 Backend devolvió flag automáticamente:', result.flag);
          showNotification(`¡IDOR de cambio de contraseña explotado! Flag: ${result.flag}`, 'success', 10000);
          const flagResult = await submitFlag(result.flag);
          if (flagResult.success) {
            showNotification(`+${flagResult.data.points} puntos!`, 'success');
            await refreshGameState();
          } else {
            showNotification(`⚠️ ${flagResult.error}`, 'warning');
          }
        } else if (detectedVuln) {
          await attemptCaptureIDORFlags(detectedVuln);
        }

        setCambiarPasswordForm({ userId: '', nuevaPassword: '' });
      }
    } catch (error) {
      showNotification('Error al cambiar contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ELIMINAR RECETA (IDOR 11)
  const handleEliminarReceta = async () => {
    if (!eliminarRecetaId) {
      showNotification('ID de receta requerido', 'warning');
      return;
    }

    try {
      setLoading(true);
      const result = await ApiService.eliminarRecetaIDOR(eliminarRecetaId);

      if (result.success) {
        showNotification(result.message, 'success');

        // ✅ DETECTAR VULNERABILIDAD
        const detectedVuln = detectVulnerabilityType(eliminarRecetaId, result, 'delete');

        if (detectedVuln) {
          setActiveVulnerability(detectedVuln);
          setShowLeak(true);
        }

        // ✅ CHECK FOR FLAG - CORREGIDO
        if (result.flag && gamePlayer) {
          console.log('🚩 Backend devolvió flag automáticamente:', result.flag);
          showNotification(`¡IDOR de eliminación explotado! Flag: ${result.flag}`, 'success', 10000);
          const flagResult = await submitFlag(result.flag);
          if (flagResult.success) {
            showNotification(`+${flagResult.data.points} puntos!`, 'success');
            await refreshGameState();
          } else {
            showNotification(`⚠️ ${flagResult.error}`, 'warning');
          }
        } else if (detectedVuln) {
          await attemptCaptureIDORFlags(detectedVuln);
        }

        setEliminarRecetaId('');
      }
    } catch (error) {
      showNotification('Error al eliminar receta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ MÉTODO PARA CAPTURAR FLAGS - MEJORADO Y CORREGIDO
  const attemptCaptureIDORFlags = async (detectedVuln = null) => {
    console.log('🎯 Intentando capturar flags de IDOR avanzadas...');

    if (!gamePlayer || vulnerabilityInfo.length === 0) {
      console.log('❌ No hay información de jugador o vulnerabilidades');
      return;
    }

    // Verificar flags existentes
    const existingIDORFlags = flags.filter(flag =>
      vulnerabilityInfo.some(vuln => vuln.flag_hash === flag.flag_hash)
    );

    if (existingIDORFlags.length >= vulnerabilityInfo.length) {
      console.log('✅ Ya completaste todas las vulnerabilidades IDOR avanzadas');
      showNotification(`✅ Ya completaste todas las vulnerabilidades IDOR avanzadas`, 'info');
      return;
    }

    let flagsCaptured = 0;

    // Si se detectó una vulnerabilidad específica, intentar capturar solo esa
    const vulnsToTry = detectedVuln ? [detectedVuln] : [];

    for (const vuln of vulnsToTry) {
      // ✅ VERIFICACIÓN MEJORADA: Chequear si ya está capturada
      const alreadyCaptured = flags.some(flag => flag.flag_hash === vuln.flag_hash);
      
      if (alreadyCaptured) {
        console.log(`⏭️ Flag ya capturada: ${vuln.flag_hash}`);
        showNotification(`✅ Ya completaste: ${vuln.name}`, 'info');
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
          
          // ✅ ACTUALIZAR INMEDIATAMENTE el estado local
          await refreshGameState();
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

    // Si capturamos flags, actualizar el estado de completado
    if (flagsCaptured > 0) {
      setIsCompleted(prev => {
        const newCompleted = (existingIDORFlags.length + flagsCaptured) >= vulnerabilityInfo.length;
        return newCompleted;
      });
    }
  };

  // ✅ CALCULAR PUNTOS ESPECÍFICOS DE IDOR
  const calculateIDORPoints = () => {
    if (!flags || vulnerabilityInfo.length === 0) return 0;

    return flags
      .filter(flag => vulnerabilityInfo.some(vuln => vuln.flag_hash === flag.flag_hash))
      .reduce((sum, flag) => sum + (flag.points || 0), 0);
  };

  const getIDORFlags = () => {
    if (!flags || vulnerabilityInfo.length === 0) return [];
    return flags.filter(flag =>
      vulnerabilityInfo.some(vuln => vuln.flag_hash === flag.flag_hash)
    );
  };

  const idorPoints = calculateIDORPoints();
  const idorFlags = getIDORFlags();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-cyan-50 py-8 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-800 mr-4">🔓 IDOR Lab - Avanzado</h1>
            {isCompleted && (
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                ✅ COMPLETADO
              </span>
            )}
          </div>
          <p className="text-xl text-gray-600">
            Insecure Direct Object Reference - Explotación avanzada de recursos
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
                  <div className="text-sm text-gray-600">Puntos IDOR</div>
                  <div className="font-bold text-blue-600">{idorPoints}</div>
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <div className="text-sm text-gray-600">Flags IDOR</div>
                  <div className="font-bold text-purple-600">{idorFlags.length}/{vulnerabilityInfo.length}</div>
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

              {/* Flags Capturadas */}
              {idorFlags.length > 0 && (
                <div className="bg-green-50 rounded-2xl p-4 max-w-4xl mx-auto mb-4 border border-green-300">
                  <h4 className="font-semibold text-green-800 mb-2 text-center">
                    🚩 Flags Capturadas ({idorFlags.length}/{vulnerabilityInfo.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {idorFlags.map((flag, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-green-300">
                        <div className="font-mono text-green-700 font-bold text-sm">
                          {flag.flag_hash}
                        </div>
                        <div className="text-green-600 text-sm">+{flag.points} puntos</div>
                        <div className="text-xs text-green-500">
                          ✅ {flag.vulnerability_name || 'IDOR Avanzado'}
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

        {/* Navigation Tabs */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8">
          <div className="flex space-x-4 border-b border-gray-200 pb-4">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-2xl font-semibold transition-colors ${activeTab === 'explore'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              🔍 Explorar Recursos
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-4 py-2 rounded-2xl font-semibold transition-colors ${activeTab === 'actions'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              ⚡ Acciones IDOR
            </button>
            <button
              onClick={() => setShowHints(!showHints)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-2xl font-semibold"
            >
              {showHints ? '❌ Ocultar' : '🎯 Objetivos'}
            </button>
          </div>

          {/* Contenido de Tabs */}
          {activeTab === 'explore' && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Exploración de Recursos</h3>
                <button
                  onClick={handleExploreResources}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-2xl font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Explorando...' : '🔍 Explorar Recursos'}
                </button>
              </div>

              {explorationData && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Recetas Públicas */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">🍳 Recetas Públicas</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {explorationData.recetas_publicas.map((receta) => (
                        <div key={receta.id} className="p-3 border border-gray-200 rounded-xl bg-white">
                          <div className="font-medium text-gray-800">{receta.nombre}</div>
                          <div className="text-xs text-gray-600">ID: {receta.id} • User: {receta.user_id}</div>
                          <div className="text-xs text-blue-600">Tipo: {receta.tipo}</div>
                          <div className="text-xs text-purple-600">
                            {receta.privada ? '🔒 Privada' : '🔓 Pública'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Usuarios */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">👥 Usuarios del Sistema</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {explorationData.usuarios.map((usuario) => (
                        <div key={usuario.id} className="p-3 border border-gray-200 rounded-xl bg-white">
                          <div className="font-medium text-gray-800">{usuario.nombre_completo}</div>
                          <div className="text-xs text-gray-600">ID: {usuario.id}</div>
                          <div className="text-xs text-green-600">Tipo: {usuario.tipo}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                <p className="text-yellow-800 text-sm">
                  <strong>💡 Pista de Exploración:</strong> {explorationData?.hint || 'Usa estos IDs como punto de partida para probar acciones IDOR en otros recursos.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Acciones IDOR Avanzadas</h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Bloquear Receta */}
                <div className="p-4 border border-gray-200 rounded-2xl bg-white">
                  <h4 className="font-semibold text-gray-700 mb-3">🔒 Bloquear Receta</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={bloquearForm.recetaId}
                      onChange={(e) => setBloquearForm({ ...bloquearForm, recetaId: e.target.value })}
                      placeholder="ID de Receta"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                    <input
                      type="text"
                      value={bloquearForm.password}
                      onChange={(e) => setBloquearForm({ ...bloquearForm, password: e.target.value })}
                      placeholder="Contraseña de bloqueo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                    <button
                      onClick={handleBloquearReceta}
                      disabled={loading}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      Bloquear Receta
                    </button>
                  </div>
                </div>

                {/* Acceder a Receta Privada */}
                <div className="p-4 border border-gray-200 rounded-2xl bg-white">
                  <h4 className="font-semibold text-gray-700 mb-3">🕵️ Acceder a Receta Privada</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={recetaPrivadaId}
                      onChange={(e) => setRecetaPrivadaId(e.target.value)}
                      placeholder="ID de Receta Privada"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                    <button
                      onClick={handleAccederRecetaPrivada}
                      disabled={loading}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      Acceder a Receta
                    </button>
                  </div>
                </div>

                {/* Cambiar Contraseña de Usuario */}
                <div className="p-4 border border-gray-200 rounded-2xl bg-white">
                  <h4 className="font-semibold text-gray-700 mb-3">🔑 Cambiar Contraseña</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={cambiarPasswordForm.userId}
                      onChange={(e) => setCambiarPasswordForm({ ...cambiarPasswordForm, userId: e.target.value })}
                      placeholder="ID de Usuario"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                    <input
                      type="password"
                      value={cambiarPasswordForm.nuevaPassword}
                      onChange={(e) => setCambiarPasswordForm({ ...cambiarPasswordForm, nuevaPassword: e.target.value })}
                      placeholder="Nueva Contraseña"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                    <button
                      onClick={handleCambiarPasswordUsuario}
                      disabled={loading}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      Cambiar Contraseña
                    </button>
                  </div>
                </div>

                {/* Eliminar Receta */}
                <div className="p-4 border border-gray-200 rounded-2xl bg-white">
                  <h4 className="font-semibold text-gray-700 mb-3">🗑️ Eliminar Receta</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={eliminarRecetaId}
                      onChange={(e) => setEliminarRecetaId(e.target.value)}
                      placeholder="ID de Receta a Eliminar"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                    <button
                      onClick={handleEliminarReceta}
                      disabled={loading}
                      className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      Eliminar Receta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Objetivos de Vulnerabilidades */}
        {showHints && vulnerabilityInfo.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">🎯 Objetivos de Explotación IDOR Avanzada</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {vulnerabilityInfo.map(vuln => (
                <div key={vuln.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200">
                  <div className="flex items-start mb-3">
                    <div>
                      <div className="font-bold text-purple-700 text-lg">{vuln.name}</div>
                      <div className="text-purple-600 text-sm">{vuln.description}</div>
                    </div>
                  </div>
                  <div className="text-xs text-purple-500 mb-2">
                    Dificultad: {vuln.difficulty} • {vuln.points} puntos
                  </div>
                  <div className="mt-2 text-sm text-gray-700 bg-white p-3 rounded-lg border border-purple-100">
                    <strong>💡 Estrategia de Explotación:</strong> {vuln.solution_hint}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEAK Section - Información Extraída */}
        {showLeak && (
          <div className="bg-black rounded-3xl shadow-2xl p-6 mb-8">
            <div className="text-yellow-400 text-xl font-bold mb-4 text-center">
              🚨 VULNERABILIDAD IDOR EXPLOTADA
            </div>

            <div className="text-green-300 text-center mb-4">
              <p>💡 <strong>¡Has explotado exitosamente una vulnerabilidad IDOR avanzada!</strong></p>
              <p className="text-sm text-green-200 mt-2">
                Puedes manipular recursos de otros usuarios sin autorización
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-orange-400 font-semibold">🔒 Bloquear Recetas</div>
                <div className="text-white text-sm">Poner contraseñas a recetas ajenas</div>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-purple-400 font-semibold">🕵️ Acceder a Privadas</div>
                <div className="text-white text-sm">Ver recetas privadas de otros</div>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-red-400 font-semibold">🔑 Cambiar Contraseñas</div>
                <div className="text-white text-sm">Tomar control de cuentas</div>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-gray-400 font-semibold">🗑️ Eliminar Recetas</div>
                <div className="text-white text-sm">Borrar recursos permanentemente</div>
              </div>
            </div>
          </div>
        )}

        {/* Educational Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📚 Aprendizaje - IDOR Avanzado</h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-red-600 mb-3">Riesgos de IDOR Avanzado:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Takeover de cuentas</strong> mediante cambio de contraseñas</li>
                <li>• <strong>Pérdida de datos</strong> por eliminación no autorizada</li>
                <li>• <strong>Denegación de servicio</strong> al bloquear recursos</li>
                <li>• <strong>Violación de propiedad intelectual</strong> en recetas privadas</li>
                <li>• <strong>Daño reputacional</strong> por manipulación de datos</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-600 mb-3">Prevención Avanzada:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Authorization middleware</strong> en TODOS los endpoints</li>
                <li>• <strong>UUIDs no secuenciales</strong> para todos los recursos</li>
                <li>• <strong>Auditoría de logs</strong> de todas las operaciones</li>
                <li>• <strong>Principio de mínimo privilegio</strong> estricto</li>
                <li>• <strong>Tests de penetración</strong> regulares de IDOR</li>
              </ul>
            </div>
          </div>

          {/* Completion Reward */}
          {isCompleted && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white text-center">
              <div className="text-2xl mb-2">🏆 ¡Todas las vulnerabilidades IDOR Avanzadas Completadas!</div>
              <p className="text-lg">
                Has demostrado habilidades expertas en explotación IDOR
              </p>
              <p className="text-green-100 mt-2">
                Puntos ganados: <strong>{idorPoints}</strong> - Revisa el Leaderboard
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IDORLab;