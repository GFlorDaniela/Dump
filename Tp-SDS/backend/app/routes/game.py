from flask import Blueprint, request, session, jsonify
from app.models.database import get_users_db_connection, get_game_db_connection
from ..utils.helpers import requires_auth, update_leaderboard
from datetime import datetime
import uuid

game_bp = Blueprint('game', __name__)

# ============================
#   INFORMACIÓN DE ROLES
# ============================
@game_bp.route('/roles')
def api_game_roles():
    return jsonify({
        'success': True,
        'roles': [
            {
                'id': 'presentador',
                'name': 'Presentador',
                'description': 'Modera el juego y sigue el progreso de los jugadores'
            },
            {
                'id': 'jugador',
                'name': 'Jugador',
                'description': 'Participa en el desafío encontrando vulnerabilidades'
            }
        ]
    })


# ============================
#   REGISTRO EN GAME (duplica en users.db)
# ============================
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

        # Verificar nickname y email
        c.execute("SELECT id FROM jugadores WHERE nickname = ?", (nickname,))
        if c.fetchone():
            return jsonify({'success': False, 'message': 'Nickname ya existe'})

        c.execute("SELECT id FROM jugadores WHERE email = ?", (email,))
        if c.fetchone():
            return jsonify({'success': False, 'message': 'Email ya registrado'})

        # Crear jugador
        player_uuid = str(uuid.uuid4())
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        c.execute("""
            INSERT INTO jugadores (uuid, nickname, nombre, apellido, email, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (player_uuid, nickname, nombre, apellido, email, role, created_at))

        player_id = c.lastrowid
        conn.commit()

        return jsonify({
            'success': True,
            'player': {
                'id': f"U-{player_id:04d}",
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


# ============================
#   SUBMIT FLAG
# ============================
@game_bp.route('/submit-flag', methods=['POST'])
@requires_auth
def api_game_submit_flag():
    data = request.get_json()
    raw_player_id = session.get('user_id')   # ID REAL sin prefijo
    flag_hash = data.get('flag_hash')

    if not raw_player_id or not flag_hash:
        return jsonify({'success': False, 'message': 'Datos incompletos'})

    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()

        # Flag existe?
        c.execute("SELECT * FROM vulnerabilities WHERE flag_hash = ?", (flag_hash,))
        vulnerability = c.fetchone()

        if not vulnerability:
            return jsonify({'success': False, 'message': 'Flag inválida o no encontrada'})

        # Ya completada?
        c.execute("""
            SELECT id 
            FROM game_flags 
            WHERE player_id = ? AND flag_hash = ?
        """, (raw_player_id, flag_hash))

        if c.fetchone():
            return jsonify({'success': False, 'message': 'Ya completaste esta vulnerabilidad'})

        # Registrar flag
        completed_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        c.execute("""
            INSERT INTO game_flags (player_id, vulnerability_type, flag_hash, points, completed_at)
            VALUES (?, ?, ?, ?, ?)
        """, (raw_player_id, vulnerability['name'], flag_hash, vulnerability['points'], completed_at))

        # Actualizar score
        users_conn = get_users_db_connection()
        users_c = users_conn.cursor()
        users_c.execute("""
            UPDATE jugadores 
            SET total_score = total_score + ?, last_activity = ?
            WHERE id = ?
        """, (vulnerability['points'], completed_at, raw_player_id))
        users_conn.commit()
        users_conn.close()

        update_leaderboard()
        conn.commit()

        return jsonify({
            'success': True,
            'message': f'¡Vulnerabilidad {vulnerability["name"]} completada! +{vulnerability["points"]} puntos',
            'points': vulnerability['points'],
            'vulnerability': vulnerability['name'],
            'player_id': f"U-{raw_player_id:04d}"
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()


# ============================
#   LEADERBOARD
# ============================
@game_bp.route('/leaderboard')
@requires_auth
def api_game_leaderboard():
    conn = None
    try:
        conn = get_users_db_connection()
        c = conn.cursor()

        c.execute('''
            SELECT 
                j.id, j.nickname, j.total_score, j.nombre, j.apellido,
                l.position, l.last_updated,
                (SELECT COUNT(*) FROM game_flags WHERE player_id = j.id) as flags_completed
            FROM jugadores j
            LEFT JOIN leaderboard l ON j.id = l.player_id
            WHERE j.role = 'jugador'
            ORDER BY l.position ASC, j.total_score DESC
            LIMIT 10
        ''')

        rows = c.fetchall()
        leaderboard_data = []

        for p in rows:
            leaderboard_data.append({
                'id': f"U-{p[0]:04d}",
                'nickname': p[1],
                'total_score': p[2],
                'nombre': p[3],
                'apellido': p[4],
                'position': p[5],
                'last_updated': p[6],
                'flags_completed': p[7] or 0
            })

        return jsonify({'success': True, 'leaderboard': leaderboard_data})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()


# ============================
#   VULNERABILITIES LIST
# ============================
@game_bp.route('/vulnerabilities')
@requires_auth
def api_game_vulnerabilities():
    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()

        c.execute("""
            SELECT name, description, difficulty, points, solution_hint
            FROM vulnerabilities
        """)
        vulnerabilities = c.fetchall()

        data = [{
            'name': v[0],
            'description': v[1],
            'difficulty': v[2],
            'points': v[3],
            'hint': v[4]
        } for v in vulnerabilities]

        return jsonify({'success': True, 'vulnerabilities': data})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()


# ================================
#     VULNERABILIDADES COMPLETAS
# ================================
# Estas van vulnerables y sin prefijos

@game_bp.route('/sql-injection-login', methods=['POST'])
@requires_auth
def sql_injection_login():
    data = request.json
    user = data.get('user')
    password = data.get('password')

    conn = get_users_db_connection()
    c = conn.cursor()

    # intencionalmente vulnerable
    query = f"SELECT id, nickname FROM jugadores WHERE nickname = '{user}' AND password = '{password}'"
    c.execute(query)
    row = c.fetchone()
    conn.close()

    if row:
        return {'success': True, 'message': 'Login exitoso (vulnerable)', 'user': row[1]}
    else:
        return {'success': False, 'message': 'Credenciales incorrectas'}


@game_bp.route('/idor-test', methods=['GET'])
@requires_auth
def idor_vulnerability():
    user_id = request.args.get('id')  # vulnerable
    conn = get_users_db_connection()
    c = conn.cursor()

    c.execute("SELECT id, nickname, email FROM jugadores WHERE id = ?", (user_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        return {'success': False, 'message': 'Usuario no encontrado'}

    return {
        'success': True,
        'user': {
            'id': row[0],
            'nickname': row[1],
            'email': row[2]
        }
    }


@game_bp.route('/information-disclosure', methods=['GET'])
@requires_auth
def information_disclosure():
    return {
        'success': True,
        'system_info': {
            'debug': True,
            'paths': {
                'user_db': '../data/user.db',
                'game_db': '../data/game.db'
            },
            'secrets': {
                'admin_key': 'HARDCODED_ADMIN_KEY_12345'
            }
        }
    }


@game_bp.route('/weak-authentication', methods=['POST'])
@requires_auth
def weak_authentication():
    data = request.json
    token = data.get('token')

    if token == "letmein":
        return {'success': True, 'message': 'Acceso débil concedido'}
    return {'success': False, 'message': 'Token inválido'}
