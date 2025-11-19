import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "MI_CLAVE_SECRETA_SEGURA_Y_FIJA")
    
    # Bases de datos separadas
    USERS_DATABASE = 'data/users.db'
    GAME_DATABASE = 'data/game.db'
    
    # CORS
    CORS_ORIGINS = [
        "https://tu-frontend.onrender.com",
        "http://localhost:5173"
    ]
    CORS_METHODS = ["GET", "POST", "PUT", "DELETE"]
    CORS_SUPPORTS_CREDENTIALS = True
    
    # Roles
    ROLES = {
        'presentador': 'presentador',
        'jugador': 'jugador'
    }
