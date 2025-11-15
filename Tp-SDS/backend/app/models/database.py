import sqlite3
import os
import uuid
from datetime import datetime
from ..config import Config
from ..utils.security import hash_password

def get_users_db_connection():
    """Conexión SEGURA a la base de datos de usuarios"""
    if not os.path.exists('data'):
        os.makedirs('data')

    conn = sqlite3.connect(Config.USERS_DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def get_game_db_connection():
    """Conexión INSECURA a la base de datos del juego"""
    if not os.path.exists('data'):
        os.makedirs('data')

    conn = sqlite3.connect(Config.GAME_DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_databases():
    """Inicializa ambas bases de datos"""
    init_users_db()
    init_game_db()

def init_users_db():
    """Base de datos SEGURA para usuarios reales"""
    conn = get_users_db_connection()
    c = conn.cursor()

    # Tablas y datos de presentadores/jugadores sin cambios
    c.execute('''
        CREATE TABLE IF NOT EXISTS presentadores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            nickname TEXT UNIQUE NOT NULL,
            nombre TEXT NOT瘁 NOT NULL,
            apellido TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'presentador',
            created_at TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS jugadores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            nickname TEXT UNIQUE NOT NULL,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            total_score INTEGER DEFAULT 0,
            role TEXT DEFAULT 'jugador',
            created_at TEXT NOT NULL,
            last_activity TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            total_points INTEGER,
            position INTEGER,
            last_updated TEXT
        )
    ''')

    presentadora_data = (
        str(uuid.uuid4()),
        'Daniela',
        'Florencia Daniela',
        'Garcia',
        'gflordaniela344@gmail.com',
        hash_password('94477Despeñadero'),
        'presentador',
        datetime.now().isoformat()
    )

    try:
        c.execute('''
            INSERT OR IGNORE INTO presentadores
            (uuid, nickname, nombre, apellido, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', presentadora_data)
    except sqlite3.IntegrityError:
        pass

    conn.commit()
    conn.close()

def init_game_db():
    """Base de datos VULNERABLE para el juego - ACTUALIZADO con logs persistentes"""
    conn = get_game_db_connection()
    c = conn.cursor()

    # Creación de tablas (sin cambios)
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
            created_at TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            event TEXT,
            details TEXT,
            user_id INTEGER
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS game_flags (
            id INTEGER PRIMARY KEY,
            player_id INTEGER,
            vulnerability_type TEXT,
            flag_hash TEXT,
            points INTEGER,
            completed_at TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS vulnerabilities (
            id INTEGER PRIMARY KEY,
            name TEXT,
            description TEXT,
            difficulty TEXT,
            points INTEGER,
            flag_hash TEXT UNIQUE,
            solution_hint TEXT
        )
    ''')
    
    # ----------------------------------------------------
    # 💥 MODIFICACIÓN CLAVE: Inserción de Logs Fijos 💥
    
    # 1. Limpiar solo los 5 logs iniciales (para mantener la consistencia del ID)
    c.execute("DELETE FROM system_logs WHERE id <= 5")
    
    logs_data_ctf = [
        # Usamos un ID fijo 1-5
        (1, '2024-01-15 10:30:00', 'LOGIN_CTF_HINT', 'Usuario abuela inició sesión (Pista 1)', 1),
        (2, '2024-01-15 14:22:00', 'PASSWORD_CHANGE', 'Chef Obscuro cambió contraseña: TempPass123! (Pista 2)', 3),
        (3, '2024-01-15 14:25:00', 'SECURITY_HINT', 'Flag SQL Injection: SQL1_FLAG_7x9aB2cD (Pista 3)', 2),
        (4, '2024-01-16 12:00:00', 'SECURITY_HINT', 'Contraseña admin temporal: AdminTemp123! (Pista 4)', 2),
        (5, '2024-01-16 12:05:00', 'DEBUG_INFO', 'Flag IDOR encontrada: IDOR_FLAG_5z2qW8rT (Pista 5)', 2)
    ]
    
    # 2. Reinsertar los logs del CTF con IDs fijos
    for log in logs_data_ctf:
        c.execute("INSERT OR REPLACE INTO system_logs (id, timestamp, event, details, user_id) VALUES (?, ?, ?, ?, ?)", log) 
    
    # ----------------------------------------------------

    # Inserción de usuarios, recetas, y vulnerabilidades (sin cambios)
    users_data = [
        (1, 'abuela', 'abuela123', 'user', 'abuela@recetas.com', 'María González'),
        (2, 'admin', 'ChefObscuro123!', 'admin', 'admin@recetas.com', 'Administrador Sistema'),
        (3, 'chef_obscuro', 'DarkChef2024!', 'admin', 'chef@obscuro.com', 'Chef Obscuro'),
        (4, 'juan_perez', 'password123', 'user', 'juan@recetas.com', 'Juan Pérez'),
        (5, 'maria_garcia', 'password123', 'user', 'maria@recetas.com', 'María García')
    ]

    for user in users_data:
        try:
            c.execute("INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?, ?)", user)
        except sqlite3.IntegrityError:
            pass
            
    recetas_data = [
        (1, 'Sopa de Tomate Clásica', 'tomates, cebolla, ajo, albahaca', 'Cocinar a fuego lento por 45 minutos', 0, None, 'sopas', 1, '2024-01-01'),
        (2, 'Torta de Chocolate Familiar', 'harina, huevos, chocolate, azúcar', 'Mezclar y hornear a 180° por 30 min', 0, None, 'postres', 1, '2024-01-02'),
        (3, 'RECETA SECRETA: Salsa Ancestral', 'INGREDIENTES CLASIFICADOS', 'INSTRUCCIONES SECRETAS - BLOQUEADA POR CHEF OBSCURO', 1, 'S4uc3S3cr3t4!', 'salsas', 1, '2024-01-03'),
        (4, 'Guiso de la Abuela', 'carne, papas, zanahorias, cebolla', 'Guisar por 2 horas a fuego medio', 0, None, 'guisos', 1, '2024-01-04'),
        (5, 'RECETA ULTRA SECRETA: Postre Familiar', 'INGREDIENTES ULTRASECRETOS', 'RECETA BLOQUEADA - SOLO PARA FAMILIA', 1, 'POSTr3F4m1114r!', 'postres', 1, '2024-01-05')
    ]

    for receta in recetas_data:
        try:
            c.execute("INSERT OR IGNORE INTO recetas VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", receta)
        except sqlite3.IntegrityError:
            pass
            
    vulnerabilities_data = [
        (1, 'SQL Injection - Login', 'Inyecta SQL en el formulario de login', 'Fácil', 100, 
         'SQL1_FLAG_7x9aB2cD', 'Usa comillas simples para romper la consulta'),
        (2, 'SQL Injection - Búsqueda', 'Inyecta SQL en la búsqueda de recetas', 'Fácil', 100, 
         'SQL2_FLAG_3y8fE1gH', 'Prueba con UNION SELECT'),
        (3, 'IDOR - Perfiles', 'Accede a perfiles de otros usuarios', 'Medio', 150, 
         'IDOR_FLAG_5z2qW8rT', 'Cambia el parámetro user_id'),
        (4, 'Information Disclosure', 'Encuentra información sensible en logs', 'Fácil', 80,
         'INFO_FLAG_9m4nX6pL', 'Revisa todos los logs visibles'),
        (5, 'Weak Authentication', 'Adivina contraseñas débiles', 'Medio', 120, 
         'WEAK_AUTH_FLAG_1k7jR3sV', 'Prueba contraseñas comunes')
    ]

    for vuln in vulnerabilities_data:
        try:
            c.execute("INSERT OR IGNORE INTO vulnerabilities VALUES (?, ?, ?, ?, ?, ?, ?)", vuln)
        except sqlite3.IntegrityError:
            pass


    conn.commit()
    conn.close()