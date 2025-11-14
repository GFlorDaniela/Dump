import React from 'react';
import { useGame } from '../../contexts/GameContext';

const GameStats = () => {
  const { gamePlayer, flags } = useGame();

  if (!gamePlayer) return null;

  const stats = [
    {
      label: 'Puntos Totales',
      value: gamePlayer.total_score || 0,
      icon: '🏆',
      color: 'yellow'
    },
    {
      label: 'Flags Capturadas',
      value: flags.length,
      icon: '🚩',
      color: 'green'
    },
    {
      label: 'Nivel',
      value: gamePlayer.total_score >= 500 ? 'Hacker Senior' : 
             gamePlayer.total_score >= 300 ? 'Hacker Intermedio' : 
             gamePlayer.total_score >= 100 ? 'Hacker Junior' : 'Novato',
      icon: '⭐',
      color: 'blue'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-gray-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
            </div>
            <div className="text-3xl">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameStats;