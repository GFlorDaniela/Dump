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
