# app.py - ARCHIVO COMPLETO CORREGIDO
from flask import Flask, jsonify, request, session, render_template
from flask_cors import CORS
import sqlite3
import hashlib
import os
from datetime import datetime
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# SOLO ESTA CONFIGURACIÓN CORS - ELIMINA CUALQUIER OTRA
CORS(app, 
     supports_credentials=True,
     origins=["http://localhost:5173"],
     methods=["GET", "POST", "PUT", "DELETE"])

DATABASE = 'data/database.db'

def get_db_connection():
    """Obtiene una conexión a la base de datos con manejo de errores"""
    try:
        conn = sqlite3.connect(DATABASE, timeout=30)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.OperationalError as e:
        print(f"Error de base de datos: {e}")
        # Reintentar después de un breve delay
        import time
        time.sleep(0.1)
        conn = sqlite3.connect(DATABASE, timeout=30)
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
            nickname TEXT UNIQUE,
            email TEXT,
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

# =============================================
# ENDPOINTS DE LA APLICACIÓN
# =============================================

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # VULNERABILIDAD: SQL Injection
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute(query)
        user = c.fetchone()
        
        if user:
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['role'] = user[3]
            
            log_event("LOGIN_EXITOSO", f"Usuario {user[1]} inició sesión", user[0])
            
            # Si se usa SQL Injection exitoso, proporcionar flag
            if "' OR '1'='1" in username or "' OR '1'='1" in password:
                return jsonify({
                    'success': True,
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'role': user[3],
                        'email': user[4],
                        'full_name': user[5]
                    },
                    'flag': 'SQL1_FLAG_123',
                    'message': '¡SQL Injection detectado! Flag: SQL1_FLAG_123'
                })
            
            return jsonify({
                'success': True,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'role': user[3],
                    'email': user[4],
                    'full_name': user[5]
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Credenciales incorrectas'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error en el sistema: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Sesión cerrada'})

@app.route('/api/dashboard')
def api_dashboard():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Recetas no bloqueadas
        c.execute("SELECT * FROM recetas WHERE bloqueada = 0")
        recetas_disponibles = c.fetchall()
        
        # Recetas bloqueadas
        c.execute("SELECT id, nombre FROM recetas WHERE bloqueada = 1")
        recetas_bloqueadas = c.fetchall()
        
        # Convertir a formato JSON
        recetas_json = []
        for receta in recetas_disponibles:
            recetas_json.append({
                'id': receta[0],
                'nombre': receta[1],
                'ingredientes': receta[2],
                'instrucciones': receta[3],
                'bloqueada': bool(receta[4]),
                'categoria': receta[6],
                'user_id': receta[7],
                'created_at': receta[8]
            })
        
        bloqueadas_json = []
        for receta in recetas_bloqueadas:
            bloqueadas_json.append({
                'id': receta[0],
                'nombre': receta[1]
            })
        
        return jsonify({
            'success': True,
            'recetas': recetas_json,
            'bloqueadas': bloqueadas_json,
            'user': {
                'id': session.get('user_id'),
                'username': session.get('username'),
                'role': session.get('role')
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/recetas')
def api_recetas():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM recetas WHERE bloqueada = 0")
        recetas = c.fetchall()
        
        recetas_json = []
        for receta in recetas:
            recetas_json.append({
                'id': receta[0],
                'nombre': receta[1],
                'ingredientes': receta[2],
                'instrucciones': receta[3],
                'bloqueada': bool(receta[4]),
                'categoria': receta[6],
                'user_id': receta[7],
                'created_at': receta[8]
            })
        
        return jsonify({'success': True, 'recetas': recetas_json})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/receta/<int:receta_id>')
def api_receta(receta_id):
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM recetas WHERE id = ?", (receta_id,))
        receta = c.fetchone()
        
        if not receta:
            return jsonify({'success': False, 'message': 'Receta no encontrada'})
        
        receta_json = {
            'id': receta[0],
            'nombre': receta[1],
            'ingredientes': receta[2],
            'instrucciones': receta[3],
            'bloqueada': bool(receta[4]),
            'categoria': receta[6],
            'user_id': receta[7],
            'created_at': receta[8]
        }
        
        return jsonify({'success': True, 'receta': receta_json})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/desbloquear_receta/<int:receta_id>', methods=['POST'])
def api_desbloquear_receta(receta_id):
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    data = request.get_json()
    password = data.get('password', '')
    
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM recetas WHERE id = ?", (receta_id,))
        receta = c.fetchone()
        
        if not receta:
            return jsonify({'success': False, 'message': 'Receta no encontrada'})
        
        # VULNERABILIDAD: Verificación débil de contraseña
        if password == receta[5]:  # password_bloqueo
            receta_json = {
                'id': receta[0],
                'nombre': receta[1],
                'ingredientes': receta[2],
                'instrucciones': receta[3],
                'bloqueada': bool(receta[4]),
                'categoria': receta[6],
                'user_id': receta[7],
                'created_at': receta[8]
            }
            
            # Proporcionar flags según la receta desbloqueada
            flag = None
            if receta_id == 3:
                flag = 'RECETA3_FLAG_202'
            elif receta_id == 5:
                flag = 'RECETA5_FLAG_303'
            
            response_data = {
                'success': True, 
                'receta': receta_json,
                'message': '¡Receta desbloqueada exitosamente!'
            }
            
            if flag:
                response_data['flag'] = flag
                response_data['message'] = f'¡Receta desbloqueada! Flag: {flag}'
            
            return jsonify(response_data)
        else:
            return jsonify({'success': False, 'message': 'Contraseña incorrecta'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

# VULNERABILIDAD: IDOR - Puedes ver cualquier perfil
@app.route('/api/perfil')
def api_perfil():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    user_id = request.args.get('user_id', session.get('user_id'))
    
    # Si se accede a un perfil diferente al propio, proporcionar flag IDOR
    flag_provided = False
    if user_id != str(session.get('user_id')):
        flag_provided = True
    
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        usuario = c.fetchone()
        
        if usuario:
            response_data = {
                'success': True,
                'usuario': {
                    'id': usuario[0],
                    'username': usuario[1],
                    'role': usuario[3],
                    'email': usuario[4],
                    'full_name': usuario[5]
                }
            }
            
            if flag_provided:
                response_data['flag'] = 'IDOR1_FLAG_789'
                response_data['message'] = '¡IDOR detectado! Flag: IDOR1_FLAG_789'
            
            return jsonify(response_data)
        else:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

# VULNERABILIDAD: Broken Access Control - Cualquier usuario puede ver logs
@app.route('/api/logs')
def api_logs():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 10")
        logs = c.fetchall()
        
        logs_json = []
        for log in logs:
            logs_json.append({
                'id': log[0],
                'timestamp': log[1],
                'event': log[2],
                'details': log[3],
                'user_id': log[4]
            })
        
        # Siempre proporcionar flag de Information Disclosure cuando se ven logs
        return jsonify({
            'success': True, 
            'logs': logs_json,
            'flag': 'INFO_FLAG_112',
            'message': '¡Information Disclosure detectado! Flag: INFO_FLAG_112'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/buscar', methods=['POST'])
def api_buscar():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    data = request.get_json()
    busqueda = data.get('busqueda', '')
    
    # VULNERABILIDAD: SQL Injection en búsqueda
    query = f"SELECT * FROM recetas WHERE (nombre LIKE '%{busqueda}%' OR ingredientes LIKE '%{busqueda}%') AND bloqueada = 0"
    
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute(query)
        recetas = c.fetchall()
        
        recetas_json = []
        for receta in recetas:
            recetas_json.append({
                'id': receta[0],
                'nombre': receta[1],
                'ingredientes': receta[2],
                'instrucciones': receta[3],
                'bloqueada': bool(receta[4]),
                'categoria': receta[6],
                'user_id': receta[7],
                'created_at': receta[8]
            })
        
        # Si se detecta SQL Injection en la búsqueda, proporcionar flag
        response_data = {'success': True, 'recetas': recetas_json}
        
        if "'" in busqueda or "UNION" in busqueda.upper() or "SELECT" in busqueda.upper():
            response_data['flag'] = 'SQL2_FLAG_456'
            response_data['message'] = '¡SQL Injection en búsqueda detectado! Flag: SQL2_FLAG_456'
        
        return jsonify(response_data)
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error en la búsqueda: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================
# ENDPOINTS DEL SISTEMA DE GAMIFICACIÓN
# =============================================

@app.route('/api/game/register', methods=['POST'])
def api_game_register():
    data = request.get_json()
    nickname = data.get('nickname')
    email = data.get('email')
    
    if not nickname or not email:
        return jsonify({'success': False, 'message': 'Nickname y email requeridos'})
    
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Verificar si el nickname ya existe
        c.execute("SELECT id FROM game_players WHERE nickname = ?", (nickname,))
        if c.fetchone():
            return jsonify({'success': False, 'message': 'Nickname ya existe'})
        
        # Crear nuevo jugador
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        c.execute(
            "INSERT INTO game_players (nickname, email, created_at) VALUES (?, ?, ?)",
            (nickname, email, created_at)
        )
        player_id = c.lastrowid
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'player': {
                'id': player_id,
                'nickname': nickname,
                'email': email,
                'total_score': 0,
                'created_at': created_at
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/game/submit-flag', methods=['POST'])
def api_game_submit_flag():
    data = request.get_json()
    player_id = data.get('player_id')
    flag_hash = data.get('flag_hash')
    
    if not player_id or not flag_hash:
        return jsonify({'success': False, 'message': 'Datos incompletos'})
    
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Verificar si la flag existe y no ha sido completada
        c.execute("SELECT * FROM vulnerabilities WHERE flag_hash = ?", (flag_hash,))
        vulnerability = c.fetchone()
        
        if not vulnerability:
            return jsonify({'success': False, 'message': 'Flag inválida'})
        
        # Verificar si ya completó esta vulnerabilidad
        c.execute(
            "SELECT id FROM game_flags WHERE player_id = ? AND flag_hash = ?", 
            (player_id, flag_hash)
        )
        if c.fetchone():
            return jsonify({'success': False, 'message': 'Ya completaste esta vulnerabilidad'})
        
        # Registrar la flag completada
        completed_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        c.execute(
            "INSERT INTO game_flags (player_id, vulnerability_type, flag_hash, points, completed_at) VALUES (?, ?, ?, ?, ?)",
            (player_id, vulnerability[1], flag_hash, vulnerability[4], completed_at)
        )
        
        # Actualizar puntuación total del jugador
        c.execute(
            "UPDATE game_players SET total_score = total_score + ?, last_activity = ? WHERE id = ?",
            (vulnerability[4], completed_at, player_id)
        )
        
        # Actualizar leaderboard
        update_leaderboard()
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'¡Vulnerabilidad {vulnerability[1]} completada! +{vulnerability[4]} puntos',
            'points': vulnerability[4],
            'vulnerability': vulnerability[1]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

def update_leaderboard():
    """Actualiza el leaderboard con las nuevas puntuaciones"""
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Obtener todos los jugadores ordenados por puntuación
        c.execute("""
            SELECT id, total_score 
            FROM game_players 
            ORDER BY total_score DESC, last_activity DESC
        """)
        players = c.fetchall()
        
        # Limpiar leaderboard anterior
        c.execute("DELETE FROM leaderboard")
        
        # Insertar nuevas posiciones
        for position, (p_id, total_points) in enumerate(players, 1):
            last_updated = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            c.execute(
                "INSERT INTO leaderboard (player_id, total_points, position, last_updated) VALUES (?, ?, ?, ?)",
                (p_id, total_points, position, last_updated)
            )
        
        conn.commit()
    except Exception as e:
        print(f"Error actualizando leaderboard: {e}")
    finally:
        if conn:
            conn.close()

@app.route('/api/game/leaderboard')
def api_game_leaderboard():
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute("""
            SELECT gp.id, gp.nickname, gp.total_score, l.position, l.last_updated,
                   (SELECT COUNT(*) FROM game_flags WHERE player_id = gp.id) as flags_completed
            FROM leaderboard l
            JOIN game_players gp ON l.player_id = gp.id
            ORDER BY l.position
            LIMIT 10
        """)
        leaderboard = c.fetchall()
        
        leaderboard_data = []
        for player in leaderboard:
            leaderboard_data.append({
                'id': player[0],
                'position': player[3],
                'nickname': player[1],
                'total_score': player[2],
                'flags_completed': player[4],
                'last_updated': player[5]
            })
        
        return jsonify({'success': True, 'leaderboard': leaderboard_data})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/game/player-stats/<int:player_id>')
def api_game_player_stats(player_id):
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Stats del jugador
        c.execute("""
            SELECT gp.nickname, gp.total_score, gp.created_at, gp.last_activity,
                   COUNT(gf.id) as flags_completed
            FROM game_players gp
            LEFT JOIN game_flags gf ON gp.id = gf.player_id
            WHERE gp.id = ?
            GROUP BY gp.id
        """, (player_id,))
        player_stats = c.fetchone()
        
        # Vulnerabilidades completadas
        c.execute("""
            SELECT vulnerability_type, points, completed_at 
            FROM game_flags 
            WHERE player_id = ? 
            ORDER BY completed_at
        """, (player_id,))
        completed_vulns = c.fetchall()
        
        if not player_stats:
            return jsonify({'success': False, 'message': 'Jugador no encontrado'})
        
        return jsonify({
            'success': True,
            'stats': {
                'nickname': player_stats[0],
                'total_score': player_stats[1],
                'created_at': player_stats[2],
                'last_activity': player_stats[3],
                'flags_completed': player_stats[4]
            },
            'completed_vulnerabilities': [
                {
                    'type': vuln[0],
                    'points': vuln[1],
                    'completed_at': vuln[2]
                } for vuln in completed_vulns
            ]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/game/vulnerabilities')
def api_game_vulnerabilities():
    """Endpoint para obtener la lista de vulnerabilidades disponibles"""
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute("SELECT name, description, difficulty, points, solution_hint FROM vulnerabilities")
        vulnerabilities = c.fetchall()
        
        vulns_data = []
        for vuln in vulnerabilities:
            vulns_data.append({
                'name': vuln[0],
                'description': vuln[1],
                'difficulty': vuln[2],
                'points': vuln[3],
                'hint': vuln[4]
            })
        
        return jsonify({'success': True, 'vulnerabilities': vulns_data})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

def log_event(event_type, details, user_id):
    """Función para logear eventos del sistema"""
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        c.execute("INSERT INTO system_logs (timestamp, event, details, user_id) VALUES (?, ?, ?, ?)",
                  (timestamp, event_type, details, user_id))
        conn.commit()
    except Exception as e:
        print(f"Error logueando evento: {e}")
    finally:
        if conn:
            conn.close()

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)