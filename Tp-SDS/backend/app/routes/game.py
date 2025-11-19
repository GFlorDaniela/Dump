from flask import Blueprint, request, session, jsonify
from app.models.database import get_users_db_connection, get_game_db_connection
from ..utils.helpers import requires_auth, update_leaderboard
from datetime import datetime
import uuid
from app.utils.Vulnerabilities import VULNERABILITIES as Vulnerabilities

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
    
    # ✅ CORREGIDO: Obtener user_id del objeto user
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'No autenticado'})
    
    raw_player_id = user_data.get('numeric_id')  # ← ID numérico del user
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

        # Actualizar score usando el ID numérico
        users_conn = get_users_db_connection()
        users_c = users_conn.cursor()
        
        # Verificar que el jugador existe
        users_c.execute("SELECT id FROM jugadores WHERE id = ?", (raw_player_id,))
        player_exists = users_c.fetchone()
        
        if not player_exists:
            return jsonify({'success': False, 'message': 'Jugador no encontrado'})

        # Actualizar score usando el ID numérico
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
            'player_id': raw_player_id
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
        # Obtener parámetros de paginación
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Validar parámetros
        page = max(1, page)
        per_page = min(max(1, per_page), 100)
        
        conn = get_users_db_connection()
        c = conn.cursor()

        # ✅ OBTENER LA PUNTUACIÓN MÁS ALTA DE TODA LA BASE DE DATOS
        c.execute('''
            SELECT MAX(total_score) as max_score 
            FROM jugadores 
            WHERE role = 'jugador'
        ''')
        max_score_result = c.fetchone()
        top_score_global = max_score_result[0] if max_score_result and max_score_result[0] is not None else 0

        # Contar total de jugadores con puntuación > 0
        c.execute('''
            SELECT COUNT(*) FROM jugadores 
            WHERE role = 'jugador' AND total_score > 0
        ''')
        total_players = c.fetchone()[0]
        
        # Calcular paginación
        total_pages = max(1, (total_players + per_page - 1) // per_page)
        page = min(page, total_pages)
        offset = (page - 1) * per_page

        # Obtener jugadores paginados
        c.execute('''
            SELECT id, nickname, total_score, nombre, apellido, email, last_activity
            FROM jugadores 
            WHERE role = 'jugador' AND total_score > 0
            ORDER BY total_score DESC
            LIMIT ? OFFSET ?
        ''', (per_page, offset))

        rows = c.fetchall()
        leaderboard_data = []

        for i, p in enumerate(rows):
            global_position = offset + i + 1
            
            leaderboard_data.append({
                'id': f"U-{p[0]:04d}",
                'user_id': p[0],
                'nickname': p[1],
                'total_score': p[2] or 0,
                'nombre': p[3],
                'apellido': p[4],
                'email': p[5],
                'last_activity': p[6],
                'position': global_position,
                'flags_captured': 0,
                'flags_count': 0
            })

        return jsonify({
            'success': True, 
            'leaderboard': leaderboard_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_players': total_players,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            },
            'global_stats': {  # ✅ NUEVO: Estadísticas globales
                'top_score': top_score_global,
                'total_players_with_score': total_players
            },
            'total_players': total_players
        })

    except Exception as e:
        print(f"❌ Error en leaderboard: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error: {str(e)}'
        })
    finally:
        if conn:
            conn.close()

# ============================
#   VULNERABILITIES LIST - MEJORADA
# ============================
@game_bp.route('/vulnerabilities')
@requires_auth
def api_game_vulnerabilities():
    """Información completa sobre vulnerabilidades"""
    return jsonify({
        'success': True,
        'vulnerabilities': Vulnerabilities
    })

# ============================
#   MY FLAGS - OBTENER FLAGS CAPTURADAS (CORREGIDO)
# ============================
@game_bp.route('/my-flags', methods=['GET'])
@requires_auth
def api_game_my_flags():
    """Obtener las flags capturadas por el jugador actual"""
    
    # ✅ CORREGIDO: Obtener user_id del objeto user en session
    user_data = session.get('user')
    if not user_data:
        return jsonify({'success': False, 'message': 'No autenticado'})
    
    # Usar numeric_id del user object
    user_id = user_data.get('numeric_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'No autenticado'})

    print(f"✅ MY-FLAGS: user_id encontrado = {user_id}")

    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()
        
        # Obtener flags capturadas por el jugador
        c.execute("""
            SELECT 
                gf.flag_hash, 
                gf.vulnerability_type, 
                gf.points, 
                gf.completed_at,
                v.name as vulnerability_name,
                v.description
            FROM game_flags gf
            LEFT JOIN vulnerabilities v ON gf.flag_hash = v.flag_hash
            WHERE gf.player_id = ?
            ORDER BY gf.completed_at DESC
        """, (user_id,))
        
        flags = c.fetchall()
        flags_list = [dict(flag) for flag in flags]
        
        # Calcular puntos totales
        total_points = sum(flag['points'] for flag in flags_list) if flags_list else 0
        
        print(f"✅ DEBUG my-flags: {len(flags_list)} flags encontradas, {total_points} puntos totales")
        
        return jsonify({
            'success': True,
            'flags': flags_list,
            'total_flags': len(flags_list),
            'total_points': total_points
        })
        
    except Exception as e:
        print(f"❌ ERROR en my-flags: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()
            
# En tu archivo routes/game.py - CORREGIR los endpoints IDOR

@game_bp.route('/idor/bloquear-receta', methods=['POST'])
@requires_auth
def idor_bloquear_receta():
    """Endpoint VULNERABLE - Bloquear recetas de otros usuarios (IDOR)"""
    try:
        data = request.get_json()
        receta_id = data.get('receta_id')
        password = data.get('password')
        
        if not receta_id or not password:
            return jsonify({'success': False, 'message': 'receta_id y password requeridos'}), 400
        
        # ✅ CORREGIDO: Usar game_db_connection para recetas
        conn = get_game_db_connection()
        c = conn.cursor()
        
        # Primero obtener info de la receta para verificar ownership
        c.execute("SELECT id, nombre, user_id FROM recetas WHERE id = ?", (receta_id,))
        receta = c.fetchone()
        
        if not receta:
            conn.close()
            return jsonify({'success': False, 'message': 'Receta no encontrada'}), 404
        
        # VULNERABLE: No verifica si la receta pertenece al usuario actual
        c.execute("""
            UPDATE recetas 
            SET bloqueada = 1, password_bloqueo = ?
            WHERE id = ?
        """, (password, receta_id))
        
        conn.commit()
        conn.close()
        
        response = {
            'success': True, 
            'message': f'Receta "{receta[1]}" bloqueada exitosamente con contraseña',
            'receta_bloqueada': {
                'id': receta_id,
                'nombre': receta[1],
                'user_id_propietario': receta[2]
            }
        }
        
        # ✅ FLAG para vulnerabilidad IDOR 8
        current_user_id = session.get('user', {}).get('numeric_id')
        if receta[2] != current_user_id:  # Si no es la receta del usuario actual
            response['flag'] = 'a7d8f9e0b1c2d3e4f5a6b7c8d9e0f1a2'
        
        return jsonify(response)
    
    except Exception as e:
        print(f"❌ Error en idor_bloquear_receta: {str(e)}")
        return jsonify({'success': False, 'message': f'Error interno: {str(e)}'}), 500

@game_bp.route('/idor/recetas-privadas', methods=['GET'])
@requires_auth
def idor_recetas_privadas():
    """Endpoint VULNERABLE - Acceder a recetas privadas (IDOR)"""
    try:
        receta_id = request.args.get('receta_id')
        
        if not receta_id:
            return jsonify({'success': False, 'message': 'receta_id requerido'}), 400
        
        # ✅ CORREGIDO: Usar game_db_connection para recetas
        conn = get_game_db_connection()
        c = conn.cursor()
        
        # VULNERABLE: No verifica permisos de acceso a recetas privadas
        c.execute("""
            SELECT id, nombre, ingredientes, instrucciones, user_id, bloqueada
            FROM recetas 
            WHERE id = ?
        """, (receta_id,))
        
        receta = c.fetchone()
        conn.close()
        
        if not receta:
            return jsonify({'success': False, 'message': 'Receta no encontrada'}), 404
        
        receta_data = {
            'id': receta[0],
            'nombre': receta[1],
            'ingredientes': receta[2],
            'instrucciones': receta[3],
            'user_id': receta[4],
            'bloqueada': bool(receta[5])
        }
        
        response = {
            'success': True,
            'receta': receta_data
        }
        
        # ✅ FLAG para vulnerabilidad IDOR 9
        current_user_id = session.get('user', {}).get('numeric_id')
        if receta[5] == 1 and receta[4] != current_user_id:  # Es privada y no es del usuario actual
            response['flag'] = 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a'
        
        return jsonify(response)
    
    except Exception as e:
        print(f"❌ Error en idor_recetas_privadas: {str(e)}")
        return jsonify({'success': False, 'message': f'Error interno: {str(e)}'}), 500

@game_bp.route('/idor/cambiar-password-usuario', methods=['POST'])
@requires_auth
def idor_cambiar_password_usuario():
    """Endpoint VULNERABLE - Cambiar contraseña de otros usuarios (IDOR)"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        nueva_password = data.get('nueva_password')
        
        if not user_id or not nueva_password:
            return jsonify({'success': False, 'message': 'user_id y nueva_password requeridos'}), 400
        
        # Validar fortaleza básica
        if len(nueva_password) < 4:
            return jsonify({'success': False, 'message': 'La contraseña debe tener al menos 4 caracteres'}), 400
        
        # ✅ CORREGIDO: Usar users_db_connection para jugadores
        conn = get_users_db_connection()
        c = conn.cursor()
        
        # Verificar que el usuario existe
        c.execute("SELECT id, nombre FROM jugadores WHERE id = ?", (user_id,))
        usuario = c.fetchone()
        
        if not usuario:
            conn.close()
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        
        # VULNERABLE: No verifica que el user_id sea el mismo que el usuario autenticado
        c.execute("UPDATE jugadores SET password_hash = ? WHERE id = ?", (nueva_password, user_id))
        
        conn.commit()
        conn.close()
        
        response = {
            'success': True,
            'message': f'Contraseña del usuario {usuario[1]} cambiada exitosamente',
            'usuario_afectado': {
                'id': user_id,
                'nombre': usuario[1]
            }
        }
        
        # ✅ FLAG para vulnerabilidad IDOR 10
        current_user_id = session.get('user', {}).get('numeric_id')
        if str(user_id) != str(current_user_id):  # Si no es el usuario actual
            response['flag'] = 'd7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
        
        return jsonify(response)
    
    except Exception as e:
        print(f"❌ Error en idor_cambiar_password_usuario: {str(e)}")
        return jsonify({'success': False, 'message': f'Error interno: {str(e)}'}), 500

@game_bp.route('/idor/eliminar-receta', methods=['DELETE'])
@requires_auth
def idor_eliminar_receta():
    """Endpoint VULNERABLE - Eliminar recetas de otros usuarios (IDOR)"""
    try:
        receta_id = request.args.get('receta_id')
        
        if not receta_id:
            return jsonify({'success': False, 'message': 'receta_id requerido'}), 400
        
        # ✅ CORREGIDO: Usar game_db_connection para recetas
        conn = get_game_db_connection()
        c = conn.cursor()
        
        # Primero obtener info de la receta
        c.execute("SELECT id, nombre, user_id FROM recetas WHERE id = ?", (receta_id,))
        receta = c.fetchone()
        
        if not receta:
            conn.close()
            return jsonify({'success': False, 'message': 'Receta no encontrada'}), 404
        
        # VULNERABLE: No verifica ownership antes de eliminar
        c.execute("DELETE FROM recetas WHERE id = ?", (receta_id,))
        
        conn.commit()
        conn.close()
        
        response = {
            'success': True,
            'message': f'Receta "{receta[1]}" eliminada permanentemente',
            'receta_eliminada': {
                'id': receta_id,
                'nombre': receta[1],
                'user_id_propietario': receta[2]
            }
        }
        
        # ✅ FLAG para vulnerabilidad IDOR 11
        current_user_id = session.get('user', {}).get('numeric_id')
        if receta[2] != current_user_id:  # Si no es la receta del usuario actual
            response['flag'] = 'e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c'
        
        return jsonify(response)
    
    except Exception as e:
        print(f"❌ Error en idor_eliminar_receta: {str(e)}")
        return jsonify({'success': False, 'message': f'Error interno: {str(e)}'}), 500

@game_bp.route('/idor/explorar-recursos', methods=['GET'])
@requires_auth
def idor_explorar_recursos():
    """Endpoint para explorar recursos disponibles (ayuda para encontrar IDs)"""
    try:
        # ✅ CORREGIDO: Usar game_db_connection para recetas y users_db_connection para jugadores
        game_conn = get_game_db_connection()
        users_conn = get_users_db_connection()
        
        game_c = game_conn.cursor()
        users_c = users_conn.cursor()
        
        # Obtener algunas recetas públicas para empezar (de game.db)
        game_c.execute("""
            SELECT id, nombre, user_id, bloqueada  
            FROM recetas 
            WHERE bloqueada = 0 
            ORDER BY id 
            LIMIT 15
        """)
        recetas = game_c.fetchall()
        
        # Obtener algunos usuarios (solo IDs y nombres) (de users.db)
        users_c.execute("""
            SELECT id, nombre, apellido 
            FROM jugadores 
            WHERE role = 'jugador'
            ORDER BY id 
            LIMIT 10
        """)
        usuarios = users_c.fetchall()
        
        game_conn.close()
        users_conn.close()
        
        return jsonify({
            'success': True,
            'recetas_publicas': [
                {
                    'id': r[0], 
                    'nombre': r[1], 
                    'user_id': r[2], 
                    'bloqueada': bool(r[3]),
                    'tipo': 'receta_publica'
                }
                for r in recetas
            ],
            'usuarios': [
                {
                    'id': u[0], 
                    'nombre_completo': f"{u[1]} {u[2]}",
                    'tipo': 'usuario'
                }
                for u in usuarios
            ],
            'hint': 'Usa estos IDs como punto de partida para explorar otros recursos. Prueba IDs secuenciales para encontrar recursos de otros usuarios.'
        })
    
    except Exception as e:
        print(f"❌ Error en idor_explorar_recursos: {str(e)}")
        return jsonify({'success': False, 'message': f'Error interno: {str(e)}'}), 500
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
    """Endpoint para Information Disclosure Lab - Devuelve logs CTF específicos"""
    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()
        
        # Obtener todos los logs de ctf_logs ordenados cronológicamente
        c.execute("SELECT * FROM ctf_logs ORDER BY timestamp ASC")
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

        return jsonify({
            'success': True,
            'logs': logs_json,
            'message': 'Logs del sistema cargados correctamente'
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()
            

@game_bp.route('/weak-authentication', methods=['POST'])
@requires_auth
def weak_authentication():
    """Endpoint vulnerable para Weak Authentication Lab"""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    print(f"🔐 [BACKEND] Intento de login desde frontend: {username}/{password}")

    # Credenciales débiles que deberían funcionar
    weak_credentials = [
        {'username': 'abuela', 'password': 'abuela123'},
        {'username': 'admin', 'password': 'admin'},
        {'username': 'admin', 'password': 'password'},
        {'username': 'admin', 'password': '123456'},
        {'username': 'test', 'password': 'test'},
        {'username': 'user', 'password': 'password'},
        {'username': 'root', 'password': '123456'},
        {'username': 'guest', 'password': 'guest'},
        {'username': 'administrator', 'password': 'administrator'},
    ]

    # Verificar contra credenciales débiles primero
    for cred in weak_credentials:
        if username == cred['username'] and password == cred['password']:
            print(f"✅ [BACKEND] Autenticación débil exitosa con: {username}/{password}")
            return jsonify({
                'success': True,
                'message': f'¡Autenticación débil exitosa! Usuario: {username}',
                'flag': 'WEAK_AUTH_FLAG_1k7jR3sV',
                'user': username
            })

    print(f"🔍 [BACKEND] Probando en base de datos: {username}")
    
    # Si no coincide con credenciales débiles, verificar en la base de datos
    conn = get_game_db_connection()
    c = conn.cursor()
    
    try:
        # Consulta vulnerable - sin hash de contraseñas
        c.execute("SELECT id, username, password FROM users WHERE username = ? AND password = ?", 
                 (username, password))
        user = c.fetchone()
        
        if user:
            print(f"✅ [BACKEND] Autenticación por BD exitosa: {username}")
            return jsonify({
                'success': True,
                'message': f'¡Autenticación exitosa! Usuario: {username}',
                'flag': 'WEAK_AUTH_FLAG_1k7jR3sV',
                'user': username
            })
        else:
            print(f"❌ [BACKEND] Credenciales incorrectas: {username}/{password}")
            return jsonify({
                'success': False,
                'message': 'Credenciales incorrectas'
            })
            
    except Exception as e:
        print(f"❌ [BACKEND] Error en weak-authentication: {e}")
        return jsonify({
            'success': False,
            'message': 'Error en el servidor'
        })
    finally:
        conn.close()


# ============================
#   SQL INJECTION VULNERABILITIES
# ============================

@game_bp.route('/sql-injection-login', methods=['POST'])
def sql_injection_login():
    """Endpoint VULNERABLE - SQL Injection en login (ID: 4)"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'success': False, 'message': 'Usuario y contraseña requeridos'})

        # ✅ CORREGIDO: Usar game_db_connection para la BD vulnerable
        conn = get_game_db_connection()
        c = conn.cursor()

        # 🚨 VULNERABILIDAD INTENCIONAL - SQL Injection
        query = f"SELECT id, username, role, email FROM users WHERE username = '{username}' AND password = '{password}'"
        
        print(f"🔍 [SQLi Login] Query ejecutada: {query}")
        
        try:
            c.execute(query)
            user = c.fetchone()
        except sqlite3.Error as e:
            conn.close()
            return jsonify({
                'success': False, 
                'message': f'Error en consulta SQL: {str(e)}',
                'debug_query': query
            })

        conn.close()

        if user:
            response = {
                'success': True,
                'message': f'¡Login exitoso! Usuario: {user[1]}',
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'role': user[2],
                    'email': user[3]
                }
            }
            
            # ✅ FLAG para SQL Injection - Login Bypass (ID: 4)
            # Detectar si se usó SQL Injection para bypass
            if "' OR '1'='1" in username or "' OR '1'='1" in password or "1=1" in username or "1=1" in password:
                response['flag'] = 'SQLI_LOGIN_FLAG_4a8b9c0d'
                response['vulnerability_detected'] = 'SQL Injection - Login Bypass'
            
            return jsonify(response)
        else:
            return jsonify({
                'success': False, 
                'message': 'Credenciales incorrectas',
                'debug': 'Consulta ejecutada pero sin resultados'
            })

    except Exception as e:
        print(f"❌ Error en sql-injection-login: {str(e)}")
        return jsonify({'success': False, 'message': f'Error interno: {str(e)}'})

@game_bp.route('/sql-injection-search', methods=['POST'])
def sql_injection_search():
    """Endpoint VULNERABLE - SQL Injection en búsqueda (IDs: 5,6,7) - MEJORADO"""
    try:
        data = request.get_json()
        search_term = data.get('search_term', '')
        category = data.get('category', '')

        conn = get_game_db_connection()
        c = conn.cursor()

        response_data = {
            'success': True,
            'search_term': search_term,
            'recetas': [],
            'union_data': [],
            'vulnerabilities_detected': [],
            'debug_info': {}
        }

        # 🚨 VULNERABILIDAD INTENCIONAL - Concatenación directa en SQL
        base_query = "SELECT id, nombre, ingredientes, instrucciones, bloqueada, password_bloqueo, categoria, user_id FROM recetas"
        
        where_conditions = []
        if search_term:
            where_conditions.append(f"nombre LIKE '%{search_term}%' OR ingredientes LIKE '%{search_term}%'")
        if category:
            where_conditions.append(f"categoria = '{category}'")
        
        if where_conditions:
            query = base_query + " WHERE " + " AND ".join(where_conditions)
        else:
            query = base_query

        query += " ORDER BY id"

        response_data['debug_info']['original_query'] = query

        try:
            c.execute(query)
            recetas = c.fetchall()
            
            # Procesar recetas normales
            for receta in recetas:
                receta_data = {
                    'id': receta[0],
                    'nombre': receta[1],
                    'ingredientes': receta[2],
                    'instrucciones': receta[3],
                    'bloqueada': bool(receta[4]),
                    'password_bloqueo': receta[5],
                    'categoria': receta[6],
                    'user_id': receta[7],
                    'type': 'receta'
                }
                response_data['recetas'].append(receta_data)

        except sqlite3.Error as e:
            error_msg = str(e)
            response_data.update({
                'success': False,
                'message': 'Error en la búsqueda',
                'sql_error': error_msg
            })
            
            # ✅ Detectar Blind Boolean SQL Injection (ID: 7)
            if "' AND 1=1" in search_term or "' AND 1=2" in search_term:
                response_data['vulnerabilities_detected'].append('SQL Injection - Blind Boolean')
                response_data['flag_blind'] = 'SQLI_BLIND_FLAG_7e8f9a0b'
            
            conn.close()
            return jsonify(response_data)

        # ✅ MANEJO ESPECIAL PARA UNION QUERIES
        if 'UNION' in search_term.upper() and 'SELECT' in search_term.upper():
            response_data['vulnerabilities_detected'].append('SQL Injection - UNION Data Extract')
            response_data['flag_union'] = 'SQLI_UNION_FLAG_6d7e8f9a'
            
            try:
                # Ejecutar la consulta UNION completa
                union_query = search_term
                if not union_query.upper().startswith('SELECT'):
                    # Si es una inyección UNION en un campo de búsqueda
                    union_query = f"SELECT id, nombre, ingredientes, instrucciones, bloqueada, password_bloqueo, categoria, user_id FROM recetas WHERE 1=0 UNION {search_term}"
                
                print(f"🔍 [UNION Query] Ejecutando: {union_query}")
                c.execute(union_query)
                union_results = c.fetchall()
                union_columns = [description[0] for description in c.description] if c.description else []
                
                response_data['debug_info']['union_query'] = union_query
                response_data['debug_info']['union_columns'] = union_columns
                
                # Procesar resultados UNION
                for row in union_results:
                    row_data = {
                        'type': 'union_result',
                        'source': 'UNION query'
                    }
                    # Agregar datos dinámicamente basado en las columnas
                    for i, value in enumerate(row):
                        col_name = union_columns[i] if i < len(union_columns) else f'column_{i}'
                        row_data[col_name] = value
                    response_data['union_data'].append(row_data)
                    
            except sqlite3.Error as union_error:
                response_data['union_error'] = str(union_error)
                response_data['debug_info']['union_error'] = str(union_error)

        # ✅ SQL Injection - Recetas Ocultas (ID: 5)
        if ("' OR 1=1" in search_term or "%' OR" in search_term) and len(recetas) > 3:
            response_data['vulnerabilities_detected'].append('SQL Injection - Recetas Ocultas')
            response_data['flag_ocultas'] = 'SQLI_OCULTAS_FLAG_5c6d7e8f'
            response_data['message'] = f'¡Encontraste {len(recetas)} recetas (incluyendo ocultas)!'

        conn.close()
        return jsonify(response_data)

    except Exception as e:
        print(f"❌ Error en sql-injection-search: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error interno: {str(e)}'
        })

@game_bp.route('/sql-injection-advanced', methods=['POST'])
def sql_injection_advanced():
    """Endpoint para técnicas avanzadas de SQL Injection"""
    try:
        data = request.get_json()
        custom_query = data.get('query', '')
        
        if not custom_query:
            return jsonify({'success': False, 'message': 'Query requerida'})

        # ✅ CORREGIDO: Usar game_db_connection
        conn = get_game_db_connection()
        c = conn.cursor()

        print(f"🔍 [SQLi Advanced] Query personalizada: {custom_query}")

        response_data = {
            'success': True,
            'query_executed': custom_query,
            'results': [],
            'vulnerabilities_detected': []
        }

        try:
            c.execute(custom_query)
            
            # Intentar obtener resultados
            try:
                rows = c.fetchall()
                
                # Si es una consulta SELECT, procesar resultados
                if custom_query.upper().strip().startswith('SELECT'):
                    column_names = [description[0] for description in c.description]
                    
                    for row in rows:
                        row_data = {}
                        for i, value in enumerate(row):
                            row_data[column_names[i]] = value
                        response_data['results'].append(row_data)
                    
                    response_data['columns'] = column_names
                    response_data['row_count'] = len(rows)
                
                # Si es una consulta de modificación (INSERT/UPDATE/DELETE)
                else:
                    response_data['affected_rows'] = c.rowcount
                    conn.commit()
                    
            except sqlite3.ProgrammingError:
                # Para consultas que no devuelven resultados
                response_data['message'] = 'Consulta ejecutada (sin resultados para mostrar)'
                conn.commit()

        except sqlite3.Error as e:
            response_data.update({
                'success': False,
                'message': 'Error en consulta SQL',
                'sql_error': str(e)
            })

        conn.close()

        # ✅ Detectar técnicas avanzadas
        if 'UNION' in custom_query.upper():
            response_data['vulnerabilities_detected'].append('UNION-based SQL Injection')
        
        if 'SLEEP(' in custom_query.upper() or 'SLEEP (' in custom_query.upper():
            response_data['vulnerabilities_detected'].append('Time-based Blind SQL Injection')
            
        if 'BENCHMARK(' in custom_query.upper():
            response_data['vulnerabilities_detected'].append('Benchmark-based SQL Injection')

        return jsonify(response_data)

    except Exception as e:
        print(f"❌ Error en sql-injection-advanced: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error interno: {str(e)}'
        })

@game_bp.route('/sql-injection-test', methods=['GET'])
def sql_injection_test():
    """Endpoint de prueba para verificar la base de datos"""
    try:
        conn = get_game_db_connection()
        c = conn.cursor()
        
        # Obtener información de la base de datos
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = c.fetchall()
        
        table_info = {}
        for table in tables:
            table_name = table[0]
            c.execute(f"PRAGMA table_info({table_name})")
            columns = c.fetchall()
            table_info[table_name] = [
                {'name': col[1], 'type': col[2], 'pk': bool(col[5])}
                for col in columns
            ]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'database': 'game.db',
            'tables': [table[0] for table in tables],
            'schema': table_info,
            'hint': 'Usa esta información para construir tus inyecciones SQL'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })
    

@game_bp.route('/sql-injection-database-info', methods=['GET'])   
def sql_injection_database_info():
    """Endpoint para mostrar la estructura COMPLETA de la base de datos en tiempo real"""
    try:
        conn = get_game_db_connection()
        c = conn.cursor()
        
        # 1. Obtener todas las tablas
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [table[0] for table in c.fetchall()]
        
        database_info = {
            'database_name': 'game.db',
            'tables': {},
            'total_tables': len(tables),
            'timestamp': datetime.now().isoformat()
        }
        
        # 2. Para cada tabla, obtener estructura Y datos
        for table_name in tables:
            # Obtener estructura de la tabla
            c.execute(f"PRAGMA table_info({table_name})")
            columns = c.fetchall()
            
            # Obtener primeros 10 registros de cada tabla
            c.execute(f"SELECT * FROM {table_name} LIMIT 10")
            sample_data = c.fetchall()
            column_names = [description[0] for description in c.description] if c.description else []
            
            # Obtener conteo total
            c.execute(f"SELECT COUNT(*) FROM {table_name}")
            total_records = c.fetchone()[0]
            
            database_info['tables'][table_name] = {
                'structure': [
                    {
                        'cid': col[0],
                        'name': col[1],
                        'type': col[2],
                        'notnull': bool(col[3]),
                        'default_value': col[4],
                        'pk': bool(col[5])
                    }
                    for col in columns
                ],
                'sample_data': [
                    dict(zip(column_names, row)) if column_names else {}
                    for row in sample_data
                ],
                'total_records': total_records,
                'column_names': column_names
            }
        
        conn.close()
        
        return jsonify({
            'success': True,
            'database_info': database_info,
            'message': 'Estructura de la base de datos cargada en tiempo real'
        })
        
    except Exception as e:
        print(f"❌ Error en sql-injection-database-info: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })