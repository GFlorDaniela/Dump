# database/db.py
import sqlite3
import os
from config import Config

def get_db_connection():
    """Obtiene una conexión a la base de datos con manejo de errores"""
    try:
        conn = sqlite3.connect(Config.DATABASE, timeout=30)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.OperationalError as e:
        print(f"Error de base de datos: {e}")
        # Reintentar después de un breve delay
        import time
        time.sleep(0.1)
        conn = sqlite3.connect(Config.DATABASE, timeout=30)
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    """Inicializa la base de datos con datos realistas"""
    if not os.path.exists('data'):
        os.makedirs('data')
    
    conn = get_db_connection()
    c = conn.cursor()
    
    # Tabla de usuarios
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            email TEXT,
            full_name TEXT
        )
    ''')
    
    # Tabla de recetas
    c.execute('''
        CREATE TABLE IF NOT EXISTS recetas (
            id INTEGER PRIMARY KEY,
            nombre TEXT,
            ingredientes TEXT,
            instrucciones TEXT,
            bloqueada INTEGER DEFAULT 0,
            password_bloqueo TEXT,
            categoria TEXT,
            user_id INTEGER,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Tabla de logs del sistema
    c.execute('''
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            event TEXT,
            details TEXT,
            user_id INTEGER
        )
    ''')
    
    # Tabla de jugadores/usuarios del juego
    c.execute('''
        CREATE TABLE IF NOT EXISTS game_players (
            id INTEGER PRIMARY KEY,
            uuid TEXT UNIQUE,
            nickname TEXT UNIQUE,
            nombre TEXT,
            apellido TEXT,
            email TEXT UNIQUE,
            role TEXT DEFAULT 'jugador',
            created_at TEXT,
            total_score INTEGER DEFAULT 0,
            last_activity TEXT
        )
    ''')
    
    # Tabla de flags/vulnerabilidades completadas
    c.execute('''
        CREATE TABLE IF NOT EXISTS game_flags (
            id INTEGER PRIMARY KEY,
            player_id INTEGER,
            vulnerability_type TEXT,
            flag_hash TEXT UNIQUE,
            points INTEGER,
            completed_at TEXT,
            FOREIGN KEY (player_id) REFERENCES game_players (id)
        )
    ''')
    
    # Tabla del podio/leaderboard
    c.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY,
            player_id INTEGER,
            total_points INTEGER,
            position INTEGER,
            last_updated TEXT,
            FOREIGN KEY (player_id) REFERENCES game_players (id)
        )
    ''')
    
    # Vulnerabilidades disponibles con sus flags
    c.execute('''
        CREATE TABLE IF NOT EXISTS vulnerabilities (
            id INTEGER PRIMARY KEY,
            name TEXT,
            description TEXT,
            difficulty TEXT,
            points INTEGER,
            flag_hash TEXT,
            solution_hint TEXT
        )
    ''')
    
    # Insertar datos iniciales
    try:
        # Usuarios
        users_data = [
            (1, 'abuela', 'abuela123', 'user', 'abuela@recetas.com', 'María González'),
            (2, 'admin', 'ChefObscuro123!', 'admin', 'admin@recetas.com', 'Administrador Sistema'),
            (3, 'chef_obscuro', 'DarkChef2024!', 'admin', 'chef@obscuro.com', 'Chef Obscuro'),
            (4, 'juan_perez', 'password123', 'user', 'juan@recetas.com', 'Juan Pérez'),
            (5, 'maria_garcia', 'password123', 'user', 'maria@recetas.com', 'María García')
        ]
        
        for user in users_data:
            c.execute("INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?, ?)", user)
        
        # Recetas
        recetas_data = [
            (1, 'Sopa de Tomate Clásica', 'tomates, cebolla, ajo, albahaca', 'Cocinar a fuego lento por 45 minutos', 0, None, 'sopas', 1, '2024-01-01'),
            (2, 'Torta de Chocolate Familiar', 'harina, huevos, chocolate, azúcar', 'Mezclar y hornear a 180° por 30 min', 0, None, 'postres', 1, '2024-01-02'),
            (3, 'RECETA SECRETA: Salsa Ancestral', 'INGREDIENTES CLASIFICADOS', 'INSTRUCCIONES SECRETAS - BLOQUEADA POR CHEF OBSCURO', 1, 'S4uc3S3cr3t4!', 'salsas', 1, '2024-01-03'),
            (4, 'Guiso de la Abuela', 'carne, papas, zanahorias, cebolla', 'Guisar por 2 horas a fuego medio', 0, None, 'guisos', 1, '2024-01-04'),
            (5, 'RECETA ULTRA SECRETA: Postre Familiar', 'INGREDIENTES ULTRASECRETOS', 'RECETA BLOQUEADA - SOLO PARA FAMILIA', 1, 'P0str3F4m1l14r!', 'postres', 1, '2024-01-05'),
            (6, 'Ensalada de la Casa', 'lechuga, tomate, cebolla, aceite', 'Mezclar todos los ingredientes', 0, None, 'ensaladas', 4, '2024-01-06'),
            (7, 'Pasta Carbonara', 'pasta, huevos, panceta, queso', 'Cocinar la pasta y mezclar con la salsa', 0, None, 'pastas', 5, '2024-01-07')
        ]
        
        for receta in recetas_data:
            c.execute("INSERT OR IGNORE INTO recetas VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", receta)
        
        # Logs del sistema
        logs_data = [
            (1, '2024-01-15 10:30:00', 'LOGIN', 'Usuario abuela inició sesión', 1),
            (2, '2024-01-15 14:22:00', 'PASSWORD_CHANGE', 'Chef Obscuro cambió contraseña de admin', 3),
            (3, '2024-01-15 14:25:00', 'RECIPE_LOCK', 'Recetas secretas bloqueadas por Chef Obscuro', 3),
            (4, '2024-01-16 09:15:00', 'RECIPE_CREATE', 'Nueva receta creada: Ensalada de la Casa', 4),
            (5, '2024-01-16 11:30:00', 'RECIPE_CREATE', 'Nueva receta creada: Pasta Carbonara', 5),
            (6, '2024-01-16 12:00:00', 'SECURITY_HINT', 'Contraseña admin temporal: AdminTemp123!', 2),
            (7, '2024-01-16 12:05:00', 'SECURITY_HINT', 'Flag SQL Injection: SQL1_FLAG_123', 2)
        ]
        
        for log in logs_data:
            c.execute("INSERT OR IGNORE INTO system_logs VALUES (?, ?, ?, ?, ?)", log)
        
        # Vulnerabilidades disponibles con sus flags
        vulnerabilities_data = [
            (1, 'SQL Injection - Login', 'Inyecta SQL en el formulario de login', 'Fácil', 100, 'SQL1_FLAG_123', 'Usa comillas simples para romper la consulta'),
            (2, 'SQL Injection - Búsqueda', 'Inyecta SQL en la búsqueda de recetas', 'Fácil', 100, 'SQL2_FLAG_456', 'Prueba con UNION SELECT'),
            (3, 'IDOR - Perfiles', 'Accede a perfiles de otros usuarios', 'Medio', 150, 'IDOR1_FLAG_789', 'Cambia el parámetro user_id'),
            (4, 'IDOR - Recetas', 'Accede a recetas bloqueadas de otros', 'Medio', 150, 'IDOR2_FLAG_101', 'Modifica los IDs en las URLs'),
            (5, 'Information Disclosure', 'Encuentra información sensible en logs', 'Fácil', 80, 'INFO_FLAG_112', 'Revisa todos los logs visibles'),
            (6, 'Weak Authentication', 'Adivina contraseñas débiles', 'Medio', 120, 'WEAK_AUTH_FLAG_131', 'Prueba contraseñas comunes'),
            (7, 'Broken Access Control', 'Accede a recursos sin permisos', 'Difícil', 200, 'BAC_FLAG_151', 'Modifica tu rol o accede a endpoints admin'),
            (8, 'Weak Auth - Receta 3', 'Desbloquea la receta secreta 3', 'Medio', 120, 'RECETA3_FLAG_202', 'La contraseña está en los logs'),
            (9, 'Weak Auth - Receta 5', 'Desbloquea la receta ultra secreta 5', 'Difícil', 180, 'RECETA5_FLAG_303', 'Usa información de otros perfiles')
        ]
        
        for vuln in vulnerabilities_data:
            c.execute("INSERT OR IGNORE INTO vulnerabilities VALUES (?, ?, ?, ?, ?, ?, ?)", vuln)
            
    except sqlite3.IntegrityError:
        pass
    
    conn.commit()
    conn.close()