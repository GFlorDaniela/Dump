import React from 'react';
import { useNavigate } from 'react-router-dom';

const Start = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="text-8xl">👵</div>
                <div className="absolute -top-2 -right-2 text-4xl">🔒</div>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
              Abuela <span className="text-orange-600">Cripto</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Plataforma Educativa de Ciberseguridad -
              <span className="text-orange-500 font-semibold"> Aprende Hacking Ético</span>
            </p>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                SQL Injection
              </span>
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                IDOR
              </span>
              <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                Info Disclosure
              </span>
              <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
                Weak Auth
              </span>
            </div>
          </div>

          {/* Role Cards Grid */}
          <div className="flex justify-center">
            <div className="grid :grid-cols-2 place-items-center gap-8 mb-16">
              {/* Jugador Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-transparent hover:border-green-400 transition-all duration-500 hover:scale-105">
                <div className="text-center mb-8">
            <div className="text-6xl mb-6">👤</div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Modo Jugador</h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Conviértete en un hacker ético. Encuentra vulnerabilidades,
              captura flags y compite por el primer lugar.
            </p>
                </div>

                <div className="space-y-4 mb-8">
            <div className="flex items-center text-gray-700">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600">✓</span>
              </div>
              <span>Encuentra flags ocultas en vulnerabilidades</span>
            </div>
            <div className="flex items-center text-gray-700">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600">✓</span>
              </div>
              <span>Gana puntos y compite en el leaderboard</span>
            </div>
            <div className="flex items-center text-gray-700">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600">✓</span>
              </div>
              <span>Aprende técnicas de hacking ético en entorno seguro</span>
            </div>
                </div>

                <div className="flex flex-col gap-6">
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
            >
              🎮 Registrarse 
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
            >
              🔴 Iniciar Sesión 
            </button>
                </div>
              </div>
            </div>
          </div>
              </div>
            </div>
          );
};

export default Start;