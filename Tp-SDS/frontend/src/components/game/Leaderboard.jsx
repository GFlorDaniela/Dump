import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';

const Leaderboard = () => {
    const [timeframe, setTimeframe] = useState('all');
    const [lastUpdated, setLastUpdated] = useState(null);
    const { showNotification } = useNotification();

    const { leaderboard, loadLeaderboard, gamePlayer, flags, syncWithSession } = useGame();

// ✅ AÑADIR este efecto para verificar estado del jugador
useEffect(() => {
  const verifyPlayerStatus = async () => {
    if (!gamePlayer) {
      console.log('🔍 Verificando estado del jugador en Leaderboard...');
      await syncWithSession();
    }
  };
  
  verifyPlayerStatus();
}, [gamePlayer, syncWithSession]);

    // ✅ ACTUALIZAR AUTOMÁTICAMENTE CUANDO CAMBIAN LAS FLAGS
    useEffect(() => {
        loadLeaderboard();
        setLastUpdated(new Date());
    }, [loadLeaderboard, flags]); // Se actualiza cuando cambian las flags

    // ✅ ACTUALIZACIÓN PERIÓDICA CADA 30 SEGUNDOS
    useEffect(() => {
        const interval = setInterval(() => {
            loadLeaderboard();
            setLastUpdated(new Date());
        }, 30000); // 30 segundos

        return () => clearInterval(interval);
    }, [loadLeaderboard]);

    // ✅ ACTUALIZAR MANUALMENTE
    const handleRefresh = () => {
        loadLeaderboard();
        setLastUpdated(new Date());
        showNotification('Leaderboard actualizado', 'success');
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getPlayerRank = () => {
        if (!gamePlayer) return null;
        const playerIndex = leaderboard.findIndex(player => 
            player.id === gamePlayer.id || 
            player.user_id === gamePlayer.id ||
            player.nickname === gamePlayer.nickname
        );
        return playerIndex !== -1 ? playerIndex + 1 : null;
    };

    const playerRank = getPlayerRank();
    const currentPlayer = leaderboard.find(player => 
        player.id === gamePlayer?.id || 
        player.user_id === gamePlayer?.id
    );

    // ✅ FILTRAR POR TIEMPO (simulado por ahora)
    const filteredLeaderboard = timeframe === 'all' 
        ? leaderboard 
        : leaderboard; // Aquí implementarías la lógica real de filtrado

    // ✅ CALCULAR ESTADÍSTICAS
    const totalPlayers = filteredLeaderboard.length;
    const totalFlags = filteredLeaderboard.reduce((total, player) => 
        total + (player.flags_captured || player.flags_count || player.flags || 0), 0
    );
    const topScore = filteredLeaderboard[0]?.total_score || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header con Botón de Actualizar */}
                <div className="text-center mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div></div> {/* Espacio vacío para alinear */}
                        <h1 className="text-4xl font-bold text-gray-800">🏆 Leaderboard</h1>
                        <button
                            onClick={handleRefresh}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-2xl font-semibold transition-colors duration-200 flex items-center space-x-2"
                        >
                            <span>🔄</span>
                            <span>Actualizar</span>
                        </button>
                    </div>
                    <p className="text-xl text-gray-600 mb-2">
                        Clasificación en tiempo real de los hackers éticos
                    </p>
                    
                    {/* Información de última actualización */}
                    {lastUpdated && (
                        <p className="text-sm text-gray-500">
                            Última actualización: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>

                {/* Timeframe Selector */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-2xl shadow-lg p-2">
                        {[
                            { key: 'all', label: 'Todos los tiempos' },
                            { key: 'week', label: 'Esta semana' },
                            { key: 'month', label: 'Este mes' }
                        ].map((time) => (
                            <button
                                key={time.key}
                                onClick={() => setTimeframe(time.key)}
                                className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                                    timeframe === time.key
                                        ? 'bg-yellow-500 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {time.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
                    {/* Top 3 - Podio */}
                    {filteredLeaderboard.slice(0, 3).length > 0 && (
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            {filteredLeaderboard.slice(0, 3).map((player, index) => {
                                const isCurrentPlayer = gamePlayer && (
                                    player.id === gamePlayer.id || 
                                    player.user_id === gamePlayer.id
                                );
                                
                                return (
                                    <div
                                        key={player.id || player.user_id}
                                        className={`text-center p-6 rounded-2xl border-2 transition-all duration-300 ${
                                            index === 0
                                                ? 'bg-yellow-50 border-yellow-200 transform -translate-y-2 shadow-lg'
                                                : index === 1
                                                ? 'bg-gray-50 border-gray-200'
                                                : 'bg-orange-50 border-orange-200'
                                        } ${isCurrentPlayer ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}
                                    >
                                        <div className="text-3xl mb-2">{getRankIcon(index + 1)}</div>
                                        <h3 className="font-bold text-gray-800 text-lg">
                                            {player.nickname || player.nombre}
                                            {isCurrentPlayer && ' (Tú)'}
                                        </h3>
                                        <div className="text-2xl font-bold text-yellow-600 my-2">
                                            {player.total_score || player.score || 0} pts
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {player.flags_captured || player.flags_count || player.flags || 0} flags
                                        </div>
                                        {isCurrentPlayer && (
                                            <div className="mt-2 text-xs text-green-600 font-semibold">
                                                ¡Esta es tu posición!
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Resto del Leaderboard */}
                    <div className="space-y-3">
                        {filteredLeaderboard.slice(3).map((player, index) => {
                            const rank = index + 4;
                            const isCurrentPlayer = gamePlayer && (
                                player.id === gamePlayer.id || 
                                player.user_id === gamePlayer.id
                            );

                            return (
                                <div
                                    key={player.id || player.user_id}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                                        isCurrentPlayer 
                                            ? 'bg-green-50 border-green-200 shadow-sm' 
                                            : 'border-gray-200 hover:border-yellow-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                                            isCurrentPlayer 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {rank}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">
                                                {player.nickname || player.nombre}
                                                {isCurrentPlayer && (
                                                    <span className="ml-2 text-green-600 text-sm">(Tú)</span>
                                                )}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                {player.nombre && player.apellido 
                                                    ? `${player.nombre} ${player.apellido}`
                                                    : player.email || 'Jugador'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-bold text-gray-800">
                                            {player.total_score || player.score || 0} pts
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {player.flags_captured || player.flags_count || player.flags || 0} flags
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Posición Actual del Jugador - Fixed Section */}
                    {gamePlayer && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Tu Posición Actual</h3>
                                    <p className="text-gray-600">
                                        {playerRank 
                                            ? `Estás en el puesto ${playerRank} de ${totalPlayers} jugadores`
                                            : 'Aún no apareces en el leaderboard'
                                        }
                                    </p>
                                    <div className="mt-2 flex space-x-4 text-sm">
                                        <span className="text-gray-600">
                                            <strong>Puntos:</strong> {gamePlayer.total_score || 0}
                                        </span>
                                        <span className="text-gray-600">
                                            <strong>Flags:</strong> {flags?.length || 0}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {playerRank ? getRankIcon(playerRank) : '--'}
                                    </div>
                                    {currentPlayer && (
                                        <div className="text-sm text-gray-600 mt-1">
                                            {currentPlayer.flags_captured || flags?.length || 0} flags
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Barra de progreso hacia el siguiente puesto */}
                            {playerRank && playerRank > 1 && filteredLeaderboard[playerRank - 2] && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Para el puesto {playerRank - 1}</span>
                                        <span>
                                            +{filteredLeaderboard[playerRank - 2].total_score - (gamePlayer.total_score || 0)} puntos
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(
                                                    ((gamePlayer.total_score || 0) / filteredLeaderboard[playerRank - 2].total_score) * 100, 
                                                    100
                                                )}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {filteredLeaderboard.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🏆</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay jugadores aún</h3>
                            <p className="text-gray-600 mb-4">
                                Captura tu primera flag en los laboratorios para aparecer aquí
                            </p>
                            {!gamePlayer && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 inline-block">
                                    <p className="text-yellow-800">
                                        ⚠️ <strong>Regístrate como jugador</strong> para participar
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Estadísticas Globales */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
                        <div className="text-3xl mb-2">👥</div>
                        <div className="text-2xl font-bold text-gray-800">{totalPlayers}</div>
                        <div className="text-gray-600">Jugadores Activos</div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
                        <div className="text-3xl mb-2">🚩</div>
                        <div className="text-2xl font-bold text-gray-800">{totalFlags}</div>
                        <div className="text-gray-600">Flags Capturadas</div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
                        <div className="text-3xl mb-2">⭐</div>
                        <div className="text-2xl font-bold text-gray-800">{topScore}</div>
                        <div className="text-gray-600">Puntuación Líder</div>
                    </div>
                </div>

                {/* Consejos para Subir de Posición */}
                {gamePlayer && playerRank && playerRank > 3 && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                        <h3 className="font-bold text-gray-800 mb-3">💡 ¿Quieres subir en el ranking?</h3>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span>Completa el <strong>SQL Injection Lab</strong> (+100 pts)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span>Explota <strong>IDOR vulnerabilities</strong> (+80 pts)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span>Encuentra <strong>Information Disclosure</strong> (+60 pts)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span>Rompe <strong>Weak Authentication</strong> (+70 pts)</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;