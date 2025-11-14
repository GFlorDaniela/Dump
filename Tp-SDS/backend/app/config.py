import os
import secrets

class Config:
    SECRET_KEY = secrets.token_hex(32)
    
    # DOS BASES DE DATOS SEPARADAS
    USERS_DATABASE = 'data/users.db'      # Datos reales - SEGURO
    GAME_DATABASE = 'data/game.db'        # Juego/vulnerabilidades - INSECURO
    
    # Configuración CORS
    CORS_ORIGINS = ["http://localhost:5173"]
    CORS_METHODS = ["GET", "POST", "PUT", "DELETE"]
    CORS_SUPPORTS_CREDENTIALS = True
    
    # Configuración de roles
    ROLES = {
        'presentador': 'presentador',
        'jugador': 'jugador'
    }