import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';

const Leaderboard = () => {
    const [timeframe, setTimeframe] = useState('all');
    const { leaderboard, loadLeaderboard, gamePlayer } = useGame();
    const { showNotification } = useNotification();

    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getPlayerRank = () => {
        if (!gamePlayer) return null;
        return leaderboard.findIndex(player => player.id === gamePlayer.id) + 1;
    };

    const playerRank = getPlayerRank();

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">🏆 Leaderboard</h1>
                    <p className="text-xl text-gray-600">
                        Clasificación de los mejores hackers éticos
                    </p>
                </div>

                {/* Timeframe Selector */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-2xl shadow-lg p-2">
                        {['all', 'week', 'month'].map((time) => (
                            <button
                                key={time}
                                onClick={() => setTimeframe(time)}
                                className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                                    timeframe === time
                                        ? 'bg-yellow-500 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {time === 'all' ? 'Todos' : time === 'week' ? 'Esta Semana' : 'Este Mes'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    {/* Top 3 */}
                    {leaderboard.slice(0, 3).length > 0 && (
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            {leaderboard.slice(0, 3).map((player, index) => (
                                <div
                                    key={player.id}
                                    className={`text-center p-6 rounded-2xl border-2 ${
                                        index === 0
                                            ? 'bg-yellow-50 border-yellow-200 transform -translate-y-2'
                                            : index === 1
                                            ? 'bg-gray-50 border-gray-200'
                                            : 'bg-orange-50 border-orange-200'
                                    }`}
                                >
                                    <div className="text-3xl mb-2">{getRankIcon(index + 1)}</div>
                                    <h3 className="font-bold text-gray-800 text-lg">{player.nickname}</h3>
                                    <div className="text-2xl font-bold text-yellow-600 my-2">
                                        {player.total_score} pts
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {player.flags_captured} flags
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Rest of Leaderboard */}
                    <div className="space-y-3">
                        {leaderboard.slice(3).map((player, index) => (
                            <div
                                key={player.id}
                                className={`flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-yellow-300 transition-colors ${
                                    gamePlayer && player.id === gamePlayer.id ? 'bg-green-50 border-green-200' : ''
                                }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-gray-600">
                                        {index + 4}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{player.nickname}</h4>
                                        <p className="text-sm text-gray-500">{player.nombre} {player.apellido}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="font-bold text-gray-800">{player.total_score} pts</div>
                                    <div className="text-sm text-gray-500">{player.flags_captured} flags</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Current Player Stats */}
                    {gamePlayer && playerRank && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800">Tu Posición</h3>
                                    <p className="text-gray-600">En el ranking global</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600">
                                        {getRankIcon(playerRank)}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {gamePlayer.total_score} puntos
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {leaderboard.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🏆</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay jugadores aún</h3>
                            <p className="text-gray-600">Sé el primero en capturar flags y aparecer aquí</p>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                        <div className="text-3xl mb-2">👥</div>
                        <div className="text-2xl font-bold text-gray-800">{leaderboard.length}</div>
                        <div className="text-gray-600">Jugadores Totales</div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                        <div className="text-3xl mb-2">🚩</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {leaderboard.reduce((total, player) => total + (player.flags_captured || 0), 0)}
                        </div>
                        <div className="text-gray-600">Flags Capturadas</div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                        <div className="text-3xl mb-2">⭐</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {leaderboard[0]?.total_score || 0}
                        </div>
                        <div className="text-gray-600">Puntuación Máxima</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;