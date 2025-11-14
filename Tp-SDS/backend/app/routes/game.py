from flask import Blueprint, request, session, jsonify
from ..models.database import get_users_db_connection, get_game_db_connection
from ..utils.helpers import requires_auth, update_leaderboard
from datetime import datetime
import uuid

game_bp = Blueprint('game', __name__)

@game_bp.route('/roles')
def api_game_roles():
    return jsonify({
        'success': True,
        'roles': [
            {
                'id': 'presentador',
                'name': '🎤 Presentador',
                'description': 'Modera el juego y sigue el progreso de los jugadores'
            },
            {
                'id': 'jugador',
                'name': '🎮 Jugador',
                'description': 'Participa en el desafío encontrando vulnerabilidades'
            }
        ]
    })

@game_bp.route('/register', methods=['POST'])
@requires_auth
def api_game_register():
    data = request.get_json()
    nickname = data.get('nickname')
    nombre = data.get('nombre')
    apellido = data.get('apellido')
    email = data.get('email')
    role = data.get('role', 'jugador')

    if not nickname or not nombre or not apellido or not email or not role:
        return jsonify({'success': False, 'message': 'Todos los campos son requeridos'})

    if role not in ['presentador', 'jugador']:
        return jsonify({'success': False, 'message': 'Rol inválido'})

    conn = None
    try:
        conn = get_users_db_connection()
        c = conn.cursor()

        # Verificar si el nickname ya existe
        c.execute("SELECT id FROM jugadores WHERE nickname = ?", (nickname,))
        if c.fetchone():
            return jsonify({'success': False, 'message': 'Nickname ya existe'})

        # Verificar si el email ya existe
        c.execute("SELECT id FROM jugadores WHERE email = ?", (email,))
        if c.fetchone():
            return jsonify({'success': False, 'message': 'Email ya registrado'})

        # Crear nuevo jugador con UUID
        player_uuid = str(uuid.uuid4())
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        c.execute(
            "INSERT INTO jugadores (uuid, nickname, nombre, apellido, email, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (player_uuid, nickname, nombre, apellido, email, role, created_at)
        )

        player_id = c.lastrowid
        conn.commit()

        return jsonify({
            'success': True,
            'player': {
                'id': player_id,
                'uuid': player_uuid,
                'nickname': nickname,
                'nombre': nombre,
                'apellido': apellido,
                'email': email,
                'role': role,
                'total_score': 0,
                'created_at': created_at
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

@game_bp.route('/submit-flag', methods=['POST'])
@requires_auth
def api_game_submit_flag():
    data = request.get_json()
    player_id = data.get('player_id')
    flag_hash = data.get('flag_hash')

    if not player_id or not flag_hash:
        return jsonify({'success': False, 'message': 'Datos incompletos'})

    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()

        # Verificar si la flag existe
        c.execute("SELECT * FROM vulnerabilities WHERE flag_hash = ?", (flag_hash,))
        vulnerability = c.fetchone()

        if not vulnerability:
            return jsonify({'success': False, 'message': 'Flag inválida'})

        # Verificar si ya completó esta vulnerabilidad
        c.execute("SELECT id FROM game_flags WHERE player_id = ? AND flag_hash = ?", (player_id, flag_hash))
        if c.fetchone():
            return jsonify({'success': False, 'message': 'Ya completaste esta vulnerabilidad'})

        # Registrar la flag completada
        completed_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        c.execute(
            "INSERT INTO game_flags (player_id, vulnerability_type, flag_hash, points, completed_at) VALUES (?, ?, ?, ?, ?)",
            (player_id, vulnerability['name'], flag_hash, vulnerability['points'], completed_at)
        )

        # Actualizar puntuación total del jugador en users_db
        users_conn = get_users_db_connection()
        users_c = users_conn.cursor()
        users_c.execute(
            "UPDATE jugadores SET total_score = total_score + ?, last_activity = ? WHERE id = ?",
            (vulnerability['points'], completed_at, player_id)
        )
        users_conn.commit()
        users_conn.close()

        # Actualizar leaderboard
        update_leaderboard()

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'¡Vulnerabilidad {vulnerability["name"]} completada! +{vulnerability["points"]} puntos',
            'points': vulnerability['points'],
            'vulnerability': vulnerability['name']
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()

@game_bp.route('/leaderboard')
@requires_auth
def api_game_leaderboard():
    conn = None
    try:
        conn = get_users_db_connection()
        c = conn.cursor()
        
        c.execute("""
            SELECT j.id, j.nickname, j.total_score, l.position, l.last_updated,
            (SELECT COUNT(*) FROM game_flags WHERE player_id = j.id) as flags_completed
            FROM leaderboard l
            JOIN jugadores j ON l.player_id = j.id
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

@game_bp.route('/vulnerabilities')
@requires_auth
def api_game_vulnerabilities():
    conn = None
    try:
        conn = get_game_db_connection()
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

# === VULNERABILIDADES EDUCATIVAS - PARTE DEL JUEGO ===

@game_bp.route('/sql-injection-login', methods=['POST'])
@requires_auth
def sql_injection_login():
    """Endpoint vulnerable a SQL Injection - PARTE DEL JUEGO"""
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    
    conn = get_game_db_connection()  # ✅ Usar base de datos del juego
    c = conn.cursor()
    
    # ✅ VULNERABILIDAD INTENCIONAL - PARTE DEL DESAFÍO
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    
    try:
        c.execute(query)
        results = c.fetchall()
        
        # Si la inyección fue exitosa, proporcionar flag
        if "OR '1'='1'" in username.upper() or "OR '1'='1'" in password.upper() or results:
            return jsonify({
                'success': True,
                'flag': 'SQL1_FLAG_123',
                'message': '¡SQL Injection detectado! Flag: SQL1_FLAG_123',
                'vulnerability': 'SQL Injection',
                'points': 100
            })
            
    except Exception as e:
        # Manejar errores de la base de datos del juego
        pass
    
    conn.close()
    
    return jsonify({
        'success': False,
        'message': 'Intento de SQL Injection fallido o credenciales incorrectas'
    })

@game_bp.route('/idor-test', methods=['GET'])
@requires_auth
def idor_vulnerability():
    """Endpoint vulnerable a IDOR - PARTE DEL JUEGO"""
    user_id = request.args.get('user_id', None)
    
    conn = get_game_db_connection()
    c = conn.cursor()
    
    # ✅ VULNERABILIDAD IDOR INTENCIONAL
    if user_id:
        c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user_data = c.fetchone()
        
        if user_data and user_id != str(session.get('user_id')):
            # ✅ DETECTÓ IDOR - Dar flag
            return jsonify({
                'success': True,
                'user_data': {
                    'id': user_data[0],
                    'username': user_data[1],
                    'role': user_data[3],
                    'email': user_data[4],
                    'full_name': user_data[5]
                } if user_data else None,
                'flag': 'IDOR1_FLAG_789',
                'message': '¡IDOR detectado! Flag: IDOR1_FLAG_789',
                'vulnerability': 'IDOR', 
                'points': 150
            })
    
    conn.close()
    return jsonify({'success': False, 'message': 'No se detectó IDOR'})

@game_bp.route('/information-disclosure', methods=['GET'])
@requires_auth
def information_disclosure():
    """Endpoint vulnerable a Information Disclosure - PARTE DEL JUEGO"""
    conn = get_game_db_connection()
    c = conn.cursor()
    
    # ✅ VULNERABILIDAD: Exponer logs sensibles
    c.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 10")
    logs = c.fetchall()
    
    logs_data = []
    for log in logs:
        logs_data.append({
            'id': log[0],
            'timestamp': log[1],
            'event': log[2],
            'details': log[3],
            'user_id': log[4]
        })
    
    conn.close()
    
    # ✅ SI HAY LOGS CON INFORMACIÓN SENSIBLE, DAR FLAG
    sensitive_found = any('password' in str(log[3]).lower() or 'flag' in str(log[3]).lower() for log in logs)
    
    response_data = {
        'success': True,
        'logs': logs_data,
        'message': 'Logs del sistema obtenidos'
    }
    
    if sensitive_found:
        response_data['flag'] = 'INFO_FLAG_112'
        response_data['message'] = '¡Information Disclosure detectado! Flag: INFO_FLAG_112'
        response_data['vulnerability'] = 'Information Disclosure'
        response_data['points'] = 80
    
    return jsonify(response_data)

@game_bp.route('/weak-authentication', methods=['POST'])
@requires_auth
def weak_authentication():
    """Endpoint vulnerable a Weak Authentication - PARTE DEL JUEGO"""
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    
    conn = get_game_db_connection()
    c = conn.cursor()
    
    # ✅ VULNERABILIDAD: Contraseñas débiles conocidas
    weak_passwords = ['123456', 'password', 'admin', '1234', 'test', 'abuela123', 'ChefObscuro123!']
    
    c.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = c.fetchone()
    
    conn.close()
    
    if user:
        # ✅ SI USA CONTRASEÑA DÉBIL, DAR FLAG
        if password in weak_passwords:
            return jsonify({
                'success': True,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'role': user[3]
                },
                'flag': 'WEAK_AUTH_FLAG_131',
                'message': '¡Weak Authentication detectado! Flag: WEAK_AUTH_FLAG_131',
                'vulnerability': 'Weak Authentication',
                'points': 120
            })
        else:
            return jsonify({
                'success': True,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'role': user[3]
                },
                'message': 'Login exitoso (pero no es una contraseña débil conocida)'
            })
    
    return jsonify({
        'success': False,
        'message': 'Credenciales incorrectas'
    })