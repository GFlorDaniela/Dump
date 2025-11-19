import sqlite3
import os
import uuid
from datetime import datetime
from ..config import Config
from ..utils.security import hash_password
from ..utils.Vulnerabilities import VULNERABILITIES


# --------------------------------------------------
# 🔌 Conexiones a Bases de Datos
# --------------------------------------------------

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


# --------------------------------------------------
# 💠 GENERADORES DE IDs con Prefijos
# --------------------------------------------------

def generate_game_id(conn):
    """Genera IDs G-0001, G-0002... para usuarios del CTF"""
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE id LIKE 'G-%' ORDER BY id DESC LIMIT 1")
    row = c.fetchone()

    if not row:
        return "G-0001"

    last_num = int(row["id"].replace("G-", ""))
    next_num = last_num + 1
    return f"G-{next_num:04d}"


def generate_npc_id(conn):
    """Genera IDs NPC-001, NPC-002..."""
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE id LIKE 'NPC-%' ORDER BY id DESC LIMIT 1")
    row = c.fetchone()

    if not row:
        return "NPC-001"

    last_num = int(row["id"].replace("NPC-", ""))
    next_num = last_num + 1
    return f"NPC-{next_num:03d}"


# --------------------------------------------------
# 🔰 Inicialización General
# --------------------------------------------------

def init_databases():
    init_users_db()
    init_game_db()


# --------------------------------------------------
# 🟦 Base de Datos Segura (usuarios reales)
# --------------------------------------------------

def init_users_db():
    """Base de datos SEGURA para usuarios reales"""
    conn = get_users_db_connection()
    c = conn.cursor()

    # Presentadores
    c.execute('''
        CREATE TABLE IF NOT EXISTS presentadores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            nickname TEXT UNIQUE NOT NULL,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'presentador',
            created_at TEXT NOT NULL
        )
    ''')

    # Jugadores (fuera del CTF)
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

    # Leaderboard real
    c.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            total_points INTEGER,
            position INTEGER,
            last_updated TEXT
        )
    ''')

    # Presentador fijo
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

def seed_vulnerabilities_db(c):
        for v in VULNERABILITIES:
            c.execute("""
                INSERT OR REPLACE INTO vulnerabilities
                (id, name, description, difficulty, points, flag_hash, solution_hint)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                v['id'],
                v['name'],
                v['description'],
                v['difficulty'],
                v['points'],
                v['flag_hash'],
                v['solution_hint']
            ))

# --------------------------------------------------
# 🟥 Base de Datos Vulnerable del Juego (CTF)
# --------------------------------------------------

def init_game_db():
    """Base de datos VULNERABLE para CTF — IDs con prefijos G- y NPC-"""
    conn = get_game_db_connection()
    c = conn.cursor()

    # --------------------------------------------------
    # 🧩 TABLAS (Modificación importante: id TEXT en users)
    # --------------------------------------------------

    c.execute('''
        CREATE TABLE IF NOT EXISTS ctf_logs (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            event TEXT,
            details TEXT,
            user_id TEXT
        )
    ''')    

    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
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
            user_id TEXT,
            created_at TEXT
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            event TEXT,
            details TEXT,
            user_id TEXT
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS game_flags (
            id INTEGER PRIMARY KEY,
            player_id TEXT,
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
    c.execute("DELETE FROM vulnerabilities")
    conn.commit() 
    seed_vulnerabilities_db(c)
    conn.commit() 


    # --------------------------------------------------
    # 🔥 INSERTAR LOGS ESPECÍFICOS PARA CTF EN ctf_logs
    # --------------------------------------------------
    c.execute("DELETE FROM ctf_logs")  # Limpiar tabla antes de insertar

    ctf_logs_data = [
        (1, '2024-01-15 08:30:00', 'SYSTEM_START', 'Servidor iniciado - PID: 28471, Puerto: 5000', 'SYSTEM'),
        (2, '2024-01-15 08:31:15', 'DATABASE_CONNECT', 'Conexión establecida a SQLite 3.35.5', 'SYSTEM'),
        (3, '2024-01-15 08:32:00', 'USER_LOGIN', 'Usuario maria_garcia inició sesión desde 192.168.1.45', 'G-0005'),
        (4, '2024-01-15 08:33:22', 'RECIPE_VIEW', 'Usuario maria_garcia visualizó receta ID: 1', 'G-0005'),
        (5, '2024-01-15 08:35:10', 'USER_LOGIN', 'Usuario juan_perez inició sesión desde 192.168.1.67', 'G-0004'),
        (6, '2024-01-15 08:36:45', 'SEARCH_QUERY', 'Búsqueda: "sopa de tomate" - 2 resultados', 'G-0004'),
        (7, '2024-01-15 08:38:12', 'RECIPE_CREATE', 'Nueva receta creada: "Ensalada César"', 'G-0001'),
        (8, '2024-01-15 08:40:33', 'USER_LOGOUT', 'Usuario juan_perez cerró sesión', 'G-0004'),
        (9, '2024-01-15 08:42:05', 'BACKUP_START', 'Iniciando backup automático de base de datos', 'SYSTEM'),
        (10, '2024-01-15 08:45:20', 'BACKUP_COMPLETE', 'Backup completado: /backups/db_20240115.sql', 'SYSTEM'),
        (11, '2024-01-15 08:50:00', 'USER_LOGIN', 'Usuario abuelo inició sesión desde 192.168.1.89', 'G-0003'),
        (12, '2024-01-15 08:52:30', 'RECIPE_EDIT', 'Base64', 'G-0003'),
        (13, '2024-01-15 08:55:10', 'PASSWORD_CHANGE', 'Usuario maria_garcia cambió su contraseña', 'G-0005'),
        (14, '2024-01-15 08:57:45', 'USER_LOGOUT', 'Usuario abuelo cerró sesión', 'G-0003'),
        (15, '2024-01-15 09:00:00', 'SECURITY_AUDIT', 'Auditoría de seguridad programada para 2024-01-20', 'SYSTEM'),
        (16, '2024-01-15 09:02:25', 'RECIPE_DELETE', 'Receta ID: 4 eliminada por admin', 'G-0002'),
        (17, '2024-01-15 09:05:10', 'USER_LOGIN', 'Usuario juan_perez inició sesión desde 192.168.1.67', 'G-0004'),
        (18, '2024-01-15 09:07:55', 'RECIPE_VIEW', 'Usuario juan_perez visualizó receta ID: 3', 'G-0004'),
        (19, '2024-01-15 09:10:30', 'FAILED_LOGIN', 'Intento fallido de login para usuario desconocido desde 192.168.1.99', 'G-0000'),
        (20, '2024-01-15 09:12:15', 'RECIPE_CREATE', 'Nueva receta creada: "Pasta al Pesto"', 'G-0001'),
        (21, '2024-01-15 09:15:00', 'ADMIN_LOGIN', 'Usuario admin inició sesión desde 7 x 3 = 21, numero primo', 'G-0002'),
        (22, '2024-01-15 09:16:30', 'CONFIG_UPDATE', 'Configuración de seguridad actualizada', 'G-0002'),
        (23, '2024-01-15 09:18:45', 'USER_MANAGEMENT', 'Usuario inactivo marcado para revisión: user_old123', 'G-0002'),
        (24, '2024-01-15 09:20:10', 'SECURITY_SCAN', 'Escaneo de vulnerabilidades iniciado', 'G-0002'),
        (25, '2024-01-15 09:22:15', 'DEBUG_PAYLOAD', 'Payload de debug: SU5GT19GTEFHXz', 'DEV-003'),
        (26, '2024-01-15 09:25:00', 'PERFORMANCE_CHECK', 'CPU: 24%, RAM: 1.2GB/4GB, Disk: 45%', 'SYSTEM'),
        (27, '2024-01-15 09:27:15', 'CACHE_CLEAR', 'Cache de aplicación limpiado', 'G-0002'),
        (28, '2024-01-15 09:30:40', 'EMAIL_SENT', 'Notificación enviada a: contacto@recetas.com', 'SYSTEM'),
        (29, '2024-01-15 09:33:20', 'DATABASE_OPTIMIZE', 'Optimización de tablas completada', 'SYSTEM'),
        (30, '2024-01-15 09:35:55', 'SESSION_CLEANUP', 'Sesiones expiradas eliminadas: 12', 'SYSTEM'),
        (31, '2024-01-15 09:38:10', 'USER_LOGIN', 'Usuario maria_lopez inició sesión desde 192.168.1.78', 'G-0006'),
        (32, '2024-01-15 09:40:25', 'RECIPE_VIEW', 'Usuario maria_lopez visualizó receta ID: 2', 'G-0006'),
        (33, '2024-01-15 09:42:40', 'SEARCH_QUERY', 'Búsqueda: "postre chocolate" - 1 resultado', 'G-0006'),
        (34, '2024-01-15 09:45:00', 'USER_LOGOUT', 'Usuario maria_lopez cerró sesión', 'G-0006'),
        (35, '2024-01-15 09:47:30', 'SYSTEM_UPDATE', 'Actualización del sistema completada', 'SYSTEM'),
        (36, '2024-01-15 09:50:15', 'DATABASE_BACKUP', 'Backup incremental de base de datos', 'SYSTEM'),
        (37, '2024-01-15 09:52:40', 'SECURITY_ALERT', 'Intento de acceso no autorizado detectado', 'SECURITY'),
        (38, '2024-01-15 09:55:20', 'FIREWALL_UPDATE', 'Reglas de firewall actualizadas', 'SYSTEM'),
        (39, '2024-01-15 09:57:45', 'USER_ACTIVITY', 'Reporte de actividad de usuario generado', 'SYSTEM'),
        (40, '2024-01-15 10:00:00', 'SYSTEM_HEALTH', 'Chequeo de salud del sistema - Todo OK', 'SYSTEM'),
        (41, '2024-01-15 10:05:10', 'SECURITY_WARNING', 'Múltiples intentos de login fallidos desde IP: 203.0.113.42', 'SYSTEM'),
        (42, '2024-01-15 10:07:25', 'FIREWALL_LOG', 'Conexión bloqueada: 198.51.100.23 -> Puerto 22', 'SYSTEM'),
        (43, '2024-01-15 10:10:00', 'ANTIVIRUS_SCAN', 'Escaneo completado: 0 threats detectados', 'SYSTEM'),
        (44, '2024-01-15 10:12:35', 'SSL_UPDATE', 'Certificado SSL renovado - Válido hasta 2025-01-15', 'SYSTEM'),
        (45, '2024-01-15 10:15:30', 'ENCRYPTED_DATA', 'Datos encriptados en tránsito: ltNG5YNnBM==', 'NETWORK'),
        (46, '2024-01-15 10:18:05', 'AUDIT_LOG', 'Auditoría de seguridad programada para 2024-01-20', 'G-0002'),
        (47, '2024-01-15 10:20:30', 'ENCRYPTION_KEY', 'Clave de encriptación rotada exitosamente', 'SYSTEM'),
        (48, '2024-01-15 10:23:15', 'ACCESS_CONTROL', 'Permisos de usuario actualizados para grupo: moderadores', 'G-0002'),
        (49, '2024-01-15 10:25:50', 'RATE_LIMITING', 'Límite de requests configurado: 1000/hr por IP', 'SYSTEM'),
        (50, '2024-01-15 10:28:25', 'SECURITY_HEADERS', 'Headers de seguridad implementados en respuestas HTTP', 'SYSTEM'),
        (51, '2024-01-15 10:30:00', 'DEBUG_MODE', 'Modo desarrollo activado para testing', 'DEV-001'),
        (52, '2024-01-15 10:32:30', 'API_TEST', 'Endpoint /api/recipes probado - Status: 200 OK', 'DEV-001'),
        (53, '2024-01-15 10:35:15', 'DATABASE_QUERY', 'Query ejecutada: SELECT * FROM users WHERE active=1', 'DEV-001'),
        (54, '2024-01-15 10:38:40', 'ERROR_HANDLING', 'Manejo de errores mejorado en módulo de autenticación', 'DEV-001'),
        (55, '2024-01-15 10:40:40', 'API_ERROR', 'Error en API: Checksum inválido - Ref: SU5GT19GTEFHXzltNG5YNnBM', 'API-GATEWAY'),
        (56, '2024-01-15 10:45:20', 'UNIT_TEST', 'Tests de integración pasados: 45/45', 'DEV-001'),
        (57, '2024-01-15 10:48:35', 'DEPLOYMENT', 'Nueva versión desplegada: v2.3.1', 'DEV-002'),
        (58, '2024-01-15 10:52:10', 'PERFORMANCE', 'Tiempo de respuesta mejorado en búsquedas: 120ms -> 45ms', 'DEV-001'),
        (59, '2024-01-15 10:55:45', 'MEMORY_USAGE', 'Uso de memoria optimizado: reducción del 15%', 'DEV-001'),
        (60, '2024-01-15 10:59:30', 'SECURITY_PATCH', 'Parche de seguridad aplicado: CVE-2024-1234', 'DEV-002'),
        (61, '2024-01-15 11:00:00', 'CTF_SETUP', 'Configurando desafíos de seguridad para el juego', 'CTF-ADMIN'),
        (62, '2024-01-15 11:03:25', 'VULNERABILITY_1', 'SQL Injection challenge configurado - Dificultad: Fácil', 'CTF-ADMIN'),
        (63, '2024-01-15 11:06:50', 'VULNERABILITY_2', 'XSS challenge implementado - Dificultad: Media', 'CTF-ADMIN'),
        (64, '2024-01-15 11:10:15', 'VULNERABILITY_3', 'IDOR challenge activado - Puntos: 150', 'CTF-ADMIN'),
        (65, '2024-01-15 11:13:40', 'VULNERABILITY_4', 'Information Disclosure listo - Buscar en logs. Lo mio no es la piedad, pero busquen un error de checksum', 'CTF-ADMIN'),
        (66, '2024-01-15 11:17:05', 'FLAG_GENERATION', 'Generando flags para desafíos...', 'CTF-ADMIN'),
        (67, '2024-01-15 11:20:30', 'FLAG_FORMAT', 'Formato de flags: [TIPO]_FLAG_[HASH]', 'CTF-ADMIN'),
        (68, '2024-01-15 11:24:55', 'HASH_SECURITY', 'Hashes generados con algoritmo seguro', 'CTF-ADMIN'),
        (69, '2024-01-15 11:28:20', 'INFO_FLAG_LOCATION', 'La flag de información está oculta en los registros del sistema', 'CTF-ADMIN'),
        (70, '2024-01-15 11:31:45', 'LOG_ANALYSIS', 'Los jugadores deben analizar logs para encontrar información sensible', 'CTF-ADMIN'),
        (71, '2024-01-15 11:35:00', 'ENCRYPTED_COMM', 'Comunicación encriptada establecida con servidor backup', 'SYSTEM'),
        (72, '2024-01-15 11:40:25', 'DATA_EXPORT', 'Exportación de datos de usuario completada', 'G-0002'),
        (73, '2024-01-15 11:45:00', 'DATA_ENCODING', 'Cadena codificada para transferencia segura: SU5GT19GTEFHXzltNG5YNnBM', 'SECURITY'),
        (74, '2024-01-15 11:50:15', 'INVESTIGATION', 'Investigando actividad sospechosa en logs de sistema', 'SECURITY'),
        (75, '2024-01-15 11:55:40', 'PATTERN_ANALYSIS', 'Analizando patrones de acceso a archivos de configuración', 'SECURITY'),
        (76, '2024-01-15 12:00:05', 'SECRET_LOCATION', 'Ubicación de archivos sensibles: /opt/app/config/secure/', 'SYSTEM'),
        (77, '2024-01-15 12:05:30', 'ACCESS_LOG', 'Acceso a archivo de configuración: /etc/app/secrets.conf', 'G-0003'),
        (78, '2024-01-15 12:10:55', 'DEBUG_INFO', 'Variable de entorno: APP_ENV=production, DEBUG=false', 'DEV-001'),
        (79, '2024-01-15 12:15:20', 'ERROR_LOG', 'Error al cargar módulo: No such file or directory', 'SYSTEM'),
        (80, '2024-01-15 12:20:45', 'WARNING', 'Advertencia: Log level configurado en DEBUG en producción', 'SYSTEM'),
        (81, '2024-01-15 12:25:00', 'DATABASE_DUMP', 'Volcado de base de datos para análisis forense', 'SYSTEM'),
        (82, '2024-01-15 12:30:25', 'QUERY_OPTIMIZATION', 'Índice agregado a tabla users - Mejora del 40%', 'DEV-001'),
        (83, '2024-01-15 12:35:50', 'CONNECTION_POOL', 'Pool de conexiones ajustado: min=5, max=50', 'SYSTEM'),
        (84, '2024-01-15 12:40:15', 'MEMORY_LEAK', 'Posible fuga de memoria detectada en módulo de cache', 'DEV-002'),
        (85, '2024-01-15 12:45:20', 'CONFIG_HASH', 'Hash de configuración: SU5GT19GTEFHXzltNG5YNnBM para módulo security', 'DEV-002')    
    ]
    
    for log in ctf_logs_data:
        c.execute("""
        INSERT OR REPLACE INTO ctf_logs (id, timestamp, event, details, user_id)  
        VALUES (?, ?, ?, ?, ?)
    """, log)

    # --------------------------------------------------
    # 🧍 Inserción de Usuarios CTF (NPCs + Admin)
    # --------------------------------------------------

    users_data = [
        ("G-0001", 'abuela', 'abuela123', 'user', 'abuela@recetas.com', 'María González'),
        ("G-0002", 'admin', 'ChefObscuro123!', 'admin', 'admin@recetas.com', 'Administrador Sistema'),
        ("G-0003", 'chef_obscuro', 'DarkChef2024!', 'admin', 'chef@obscuro.com', 'Chef Obscuro'),
        ("G-0004", 'juan_perez', 'password123', 'user', 'juan@recetas.com', 'Juan Pérez'),
        ("G-0005", 'maria_garcia', 'password123', 'user', 'maria@recetas.com', 'María García')
    ]

    for user in users_data:
        try:
            c.execute("INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?, ?)", user)
        except sqlite3.IntegrityError:
            pass

    # --------------------------------------------------
    # 🥘 Recetas
    # --------------------------------------------------

    recetas_data = [
        (1, 'Sopa de Tomate Clásica', 'tomates, cebolla, ajo, albahaca', 'Cocinar a fuego lento por 45 minutos', 0, None, 'sopas', "G-0001", '2024-01-01'),
        (2, 'Torta de Chocolate Familiar', 'harina, huevos, chocolate, azúcar', 'Mezclar y hornear a 180° por 30 min', 0, None, 'postres', "G-0001", '2024-01-02'),
        (3, 'RECETA SECRETA: Salsa Ancestral', 'INGREDIENTES CLASIFICADOS', 'INSTRUCCIONES SECRETAS - BLOQUEADA POR CHEF OBSCURO', 1, 'S4uc3S3cr3t4!', 'salsas', "G-0001", '2024-01-03'),
        (4, 'Guiso de la Abuela', 'carne, papas, zanahorias, cebolla', 'Guisar por 2 horas a fuego medio', 0, None, 'guisos', "G-0001", '2024-01-04'),
        (5, 'RECETA ULTRA SECRETA: Postre Familiar', 'INGREDIENTES ULTRASECRETOS', 'RECETA BLOQUEADA - SOLO PARA FAMILIA', 1, 'POSTr3F4m1114r!', 'postres', "G-0001", '2024-01-05')
    ]

    for receta in recetas_data:
        try:
            c.execute("INSERT OR IGNORE INTO recetas VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", receta)
        except sqlite3.IntegrityError:
            pass
