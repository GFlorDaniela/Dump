import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';

const Leaderboard = () => {
    const [timeframe, setTimeframe] = useState('all');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    
    const { showNotification } = useNotification();
    const { 
        leaderboard, 
        loadLeaderboard, 
        gamePlayer, 
        pagination,
        globalStats // ✅ NUEVO
    } = useGame();

    const loadPaginatedLeaderboard = useCallback(async (page = 1, limit = 20) => {
        try {
            setIsLoading(true);
            console.log(`🔄 Cargando página ${page}...`);
            
            await loadLeaderboard(page, limit);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            console.error('❌ Error cargando leaderboard:', err);
            setError('Error al cargar el leaderboard');
            showNotification('Error al cargar el leaderboard', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [loadLeaderboard, showNotification]);

    // ✅ INICIALIZACIÓN - SOLO UNA VEZ AL MONTAR
    useEffect(() => {
        loadPaginatedLeaderboard(currentPage, perPage);
    }, []);

    // ✅ ACTUALIZAR 
    const handleRefresh = async () => {
        await loadPaginatedLeaderboard(currentPage, perPage);
        showNotification('Leaderboard actualizado ', 'success');
    };

    // ✅ CAMBIAR PÁGINA - Actualiza solo cuando cambia la página
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        loadPaginatedLeaderboard(newPage, perPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ✅ CAMBIAR ITEMS POR PÁGINA
    const handlePerPageChange = (newPerPage) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        loadPaginatedLeaderboard(1, newPerPage);
    };

    // ✅ FUNCIÓN PARA ENCONTRAR JUGADOR ACTUAL
    const findCurrentPlayerInLeaderboard = useCallback(() => {
        if (!gamePlayer || !leaderboard || !Array.isArray(leaderboard)) return null;
        return leaderboard.find(player => 
            player.id === gamePlayer.id || 
            player.user_id === gamePlayer.id ||
            player.nickname === gamePlayer.nickname
        );
    }, [gamePlayer, leaderboard]);

    // ✅ FUNCIÓN PARA OBTENER RANK DEL JUGADOR
    const getPlayerRank = useCallback(() => {
        if (!gamePlayer || !pagination) return null;
        const currentPlayer = findCurrentPlayerInLeaderboard();
        return currentPlayer ? currentPlayer.position : null;
    }, [gamePlayer, pagination, findCurrentPlayerInLeaderboard]);

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const playerRank = getPlayerRank();
    const currentPlayer = findCurrentPlayerInLeaderboard();

    // ✅ CALCULAR ESTADÍSTICAS - USANDO globalStats
    const totalPlayers = globalStats.total_players_with_score || pagination?.total_players || 0;
    const topScore = globalStats.top_score || 0; // ✅ AHORA SÍ FUNCIONA

    // ✅ CONTROLES DE PAGINACIÓN
    const renderPaginationControls = () => {
        if (!pagination || pagination.total_pages <= 1) return null;

        const { page, total_pages, has_next, has_prev } = pagination;
        const pages = [];

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(total_pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    disabled={isLoading}
                    className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 ${
                        page === i
                            ? 'bg-yellow-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    Mostrando {((page - 1) * perPage) + 1} - {Math.min(page * perPage, totalPlayers)} de {totalPlayers} jugadores
                </div>
                
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={!has_prev || isLoading}
                        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                        ««
                    </button>
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!has_prev || isLoading}
                        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                        «
                    </button>
                    
                    {pages}
                    
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!has_next || isLoading}
                        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                        »
                    </button>
                    <button
                        onClick={() => handlePageChange(total_pages)}
                        disabled={!has_next || isLoading}
                        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                        »»
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Mostrar:</span>
                    <select 
                        value={perPage}
                        onChange={(e) => handlePerPageChange(Number(e.target.value))}
                        disabled={isLoading}
                        className="px-2 py-1 border border-gray-300 rounded-lg bg-white disabled:opacity-50"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>
        );
    };

    // ✅ RENDERIZAR ESTADO DE CARGA
    if (isLoading && !leaderboard.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Cargando Leaderboard...</h3>
                        <p className="text-gray-600">Obteniendo datos de jugadores</p>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ RENDERIZAR ERROR
    if (error && !leaderboard.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">❌</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-2xl font-semibold transition-colors duration-200"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div></div>
                        <h1 className="text-4xl font-bold text-gray-800">🏆 Leaderboard</h1>
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-2xl font-semibold transition-colors duration-200 flex items-center space-x-2"
                        >
                            <span>{isLoading ? '⏳' : '🔄'}</span>
                            <span>{isLoading ? 'Cargando...' : 'Actualizar'}</span>
                        </button>
                    </div>
                    <p className="text-xl text-gray-600 mb-2">
                        {gamePlayer ? 'Tu clasificación en el juego' : 'Clasificación general de jugadores'}
                    </p>
                    
                    {lastUpdated && (
                        <p className="text-sm text-gray-500">
                            Última actualización: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}

                    {pagination && (
                        <div className="mt-4 bg-white rounded-2xl shadow-lg p-4 inline-block">
                            <div className="flex items-center space-x-4 text-sm">
                                <span className="text-gray-600">
                                    <strong>Página:</strong> {pagination.page} de {pagination.total_pages}
                                </span>
                                <span className="text-gray-600">
                                    <strong>Total jugadores:</strong> {totalPlayers}
                                </span>
                                <span className="text-gray-600">
                                    <strong>Puntuación máxima:</strong> {topScore}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Leaderboard Content */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
                    {/* Top 3 - Podio (solo en página 1) */}
                    {currentPage === 1 && leaderboard.slice(0, 3).length > 0 && (
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            {leaderboard.slice(0, 3).map((player, index) => {
                                const isCurrentPlayer = gamePlayer && 
                                    (player.id === gamePlayer.id || player.user_id === gamePlayer.id);
                                
                                return (
                                    <div
                                        key={player.id || player.user_id || `top-${index}`}
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
                                            {player.nickname || player.nombre || 'Jugador Anónimo'}
                                            {isCurrentPlayer && ' (Tú)'}
                                        </h3>
                                        <div className="text-2xl font-bold text-yellow-600 my-2">
                                            {player.total_score || 0} pts
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
                        {leaderboard.slice(currentPage === 1 ? 3 : 0).map((player, index) => {
                            const startIndex = currentPage === 1 ? 3 : 0;
                            const rank = startIndex + index + 1;
                            const isCurrentPlayer = gamePlayer && 
                                (player.id === gamePlayer.id || player.user_id === gamePlayer.id);

                            return (
                                <div
                                    key={player.id || player.user_id || `player-${rank}`}
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
                                                {player.nickname || player.nombre || 'Jugador Anónimo'}
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
                                            {player.total_score || 0} pts
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mensaje cuando no hay jugadores */}
                    {leaderboard.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🏆</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay jugadores en esta página</h3>
                            <p className="text-gray-600 mb-4">
                                {currentPage > 1 ? 'Intenta con una página anterior' : 'Los jugadores aparecerán aquí cuando capturen sus primeras flags'}
                            </p>
                        </div>
                    )}

                    {/* Controles de Paginación */}
                    {renderPaginationControls()}

                    {/* Posición Actual del Jugador */}
                    {gamePlayer && gamePlayer.role === 'jugador' && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Tu Posición Actual</h3>
                                    <p className="text-gray-600">
                                        {playerRank 
                                            ? `Estás en el puesto ${playerRank} de ${totalPlayers} jugadores`
                                            : currentPlayer 
                                                ? 'No estás en esta página del leaderboard'
                                                : 'Aún no apareces en el leaderboard'
                                        }
                                    </p>
                                    <div className="mt-2 flex space-x-4 text-sm">
                                        <span className="text-gray-600">
                                            <strong>Puntos:</strong> {gamePlayer.total_score || 0}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {playerRank ? getRankIcon(playerRank) : '--'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Estadísticas Globales */}
                {leaderboard.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
                            <div className="text-3xl mb-2">👥</div>
                            <div className="text-2xl font-bold text-gray-800">{totalPlayers}</div>
                            <div className="text-gray-600">Jugadores Activos</div>
                            <div className="text-xs text-gray-400 mt-1">
                                Con puntuación mayor a 0
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-200">
                            <div className="text-3xl mb-2">⭐</div>
                            <div className="text-2xl font-bold text-gray-800">{topScore}</div>
                            <div className="text-gray-600">Puntuación Líder</div>
                            <div className="text-xs text-gray-400 mt-1">
                                Máxima de todos los jugadores
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;