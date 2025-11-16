from flask import Blueprint, request, session, jsonify
from app.models.database import get_users_db_connection, get_game_db_connection
from ..utils.helpers import requires_auth

perfil_bp = Blueprint('perfil', __name__)

@perfil_bp.route('/perfil')
@requires_auth
def api_perfil():
    # ------------------------------
    #   1. Obtener usuario de sesión
    # ------------------------------
    session_user = session.get('user')
    if not session_user:
        return jsonify({'success': False, 'message': 'No autenticado'}), 401

    # ------------------------------
    #   2. Obtener user_id solicitado o default a sesión
    # ------------------------------
    raw_user_id = request.args.get('user_id', session_user['numeric_id'])

    # ------------------------------
    #   3. Detectar prefijo
    # ------------------------------
    if isinstance(raw_user_id, str) and raw_user_id.startswith("U-"):
        prefix = "U"
        numeric_id = raw_user_id.replace("U-", "")
        db = "users"
    elif isinstance(raw_user_id, str) and raw_user_id.startswith("G-"):
        prefix = "G"
        numeric_id = raw_user_id.replace("G-", "")
        db = "game"
    else:
        # Caso legacy o IDOR sin prefijo
        prefix = "U"
        numeric_id = str(raw_user_id)
        db = "users"

    # ------------------------------
    #   4. Detectar IDOR
    # ------------------------------
    session_user_id = str(session_user['numeric_id'])
    flag_provided = str(numeric_id) != session_user_id

    conn = None
    try:
        # ------------------------------
        #   5. Elegir DB correcta
        # ------------------------------
        if db == "users":
            conn = get_users_db_connection()
            query = """
            SELECT id, nickname, nombre, apellido, email, role
            FROM jugadores
            WHERE id = ?
            """
        else:
            conn = get_game_db_connection()
            query = """
            SELECT id, username, full_name, email, role
            FROM users
            WHERE id = ?
            """

        c = conn.cursor()
        c.execute(query, (numeric_id,))
        row = c.fetchone()

        if not row:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

        # -------------------------------------
        #  FORMATO DE RESPUESTA PARA USUARIOS U
        # -------------------------------------
        if prefix == "U":
            user_id, nickname, nombre, apellido, email, role = row
            full_name = f"{nombre} {apellido}".strip()
            response_data = {
                "success": True,
                "usuario": {
                    "id": f"U-{user_id}",
                    "username": nickname,
                    "email": email,
                    "role": role,
                    "full_name": full_name
                }
            }
        # -------------------------------------
        #  FORMATO DE RESPUESTA PARA USUARIOS G
        # -------------------------------------
        else:
            user_id, username, full_name, email, role = row
            response_data = {
                "success": True,
                "usuario": {
                    "id": f"G-{user_id}",
                    "username": username,
                    "email": email,
                    "role": role,
                    "full_name": full_name
                }
            }

        # Flag IDOR
        if flag_provided:
            response_data['flag'] = 'IDOR1_FLAG_789'
            response_data['message'] = '¡IDOR detectado! Flag: IDOR1_FLAG_789'

        return jsonify(response_data)

    except Exception as e:
        print(f"❌ Error en perfil: {str(e)}")
        return jsonify({'success': False, 'message': f'Error interno: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# ✅ ENDPOINT: Editar perfil
@perfil_bp.route('/perfil/editar', methods=['POST'])
@requires_auth
def editar_perfil():
    session_user = session.get('user')
    if not session_user:
        return jsonify({'success': False, 'message': 'No autenticado'}), 401

    data = request.get_json()
    user_id = data.get('user_id', session_user['numeric_id'])
    nombre = data.get('nombre')
    apellido = data.get('apellido')
    email = data.get('email')

    if not all([nombre, apellido, email]):
        return jsonify({'success': False, 'message': 'Todos los campos son requeridos'}), 400

    # Detectar IDOR
    session_user_id = str(session_user['numeric_id'])
    flag_provided = str(user_id) != session_user_id

    # Determinar base de datos basado en el user_id
    if isinstance(user_id, str) and user_id.startswith("U-"):
        numeric_id = user_id.replace("U-", "")
        db = "users"
    elif isinstance(user_id, str) and user_id.startswith("G-"):
        numeric_id = user_id.replace("G-", "")
        db = "game"
    else:
        numeric_id = str(user_id)
        db = "users"

    conn = None
    try:
        if db == "users":
            conn = get_users_db_connection()
            c = conn.cursor()
            
            # ✅ CORREGIDO: Actualizar en tabla jugadores
            c.execute("""
                UPDATE jugadores 
                SET nombre = ?, apellido = ?, email = ?
                WHERE id = ?
            """, (nombre, apellido, email, numeric_id))
            
        else:
            conn = get_game_db_connection()
            c = conn.cursor()
            
            # ✅ CORREGIDO: Actualizar en tabla users
            full_name = f"{nombre} {apellido}".strip()
            c.execute("""
                UPDATE users 
                SET full_name = ?, email = ?
                WHERE id = ?
            """, (full_name, email, numeric_id))
        
        # Verificar si se actualizó alguna fila
        if c.rowcount == 0:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        
        conn.commit()

        response_data = {
            'success': True,
            'message': 'Perfil actualizado exitosamente'
        }

        # ✅ Flag por IDOR exitoso
        if flag_provided:
            response_data['flag'] = 'IDOR_EDIT_FLAG_890'
            response_data['message_idor'] = '¡IDOR en edición detectado! Flag: IDOR_EDIT_FLAG_890'

        return jsonify(response_data)

    except Exception as e:
        print(f"❌ Error al actualizar perfil: {str(e)}")
        return jsonify({'success': False, 'message': f'Error al actualizar perfil: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# ✅ ENDPOINT: Cambiar contraseña
@perfil_bp.route('/perfil/cambiar-password', methods=['POST'])
@requires_auth
def cambiar_password():
    session_user = session.get('user')
    if not session_user:
        return jsonify({'success': False, 'message': 'No autenticado'}), 401

    data = request.get_json()
    user_id = data.get('user_id', session_user['numeric_id'])
    nueva_password = data.get('nueva_password')

    if not nueva_password:
        return jsonify({'success': False, 'message': 'La nueva contraseña es requerida'}), 400

    # Detectar IDOR
    session_user_id = str(session_user['numeric_id'])
    flag_provided = str(user_id) != session_user_id

    # Determinar base de datos
    if isinstance(user_id, str) and user_id.startswith("U-"):
        numeric_id = user_id.replace("U-", "")
        db = "users"
    elif isinstance(user_id, str) and user_id.startswith("G-"):
        numeric_id = user_id.replace("G-", "")
        db = "game"
    else:
        numeric_id = str(user_id)
        db = "users"

    conn = None
    try:
        if db == "users":
            conn = get_users_db_connection()
            c = conn.cursor()
            
            # ✅ CORREGIDO: En tabla jugadores la columna es password_hash
            c.execute("UPDATE jugadores SET password_hash = ? WHERE id = ?", (nueva_password, numeric_id))
            
        else:
            conn = get_game_db_connection()
            c = conn.cursor()
            
            # ✅ CORREGIDO: En tabla users la columna es password
            c.execute("UPDATE users SET password = ? WHERE id = ?", (nueva_password, numeric_id))
        
        # Verificar si se actualizó alguna fila
        if c.rowcount == 0:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        
        conn.commit()

        response_data = {
            'success': True,
            'message': 'Contraseña cambiada exitosamente'
        }

        # ✅ Flag por IDOR exitoso en cambio de contraseña
        if flag_provided:
            response_data['flag'] = 'IDOR_PASSWORD_FLAG_891'
            response_data['message_idor'] = '¡IDOR en cambio de contraseña detectado! Flag: IDOR_PASSWORD_FLAG_891'

        return jsonify(response_data)

    except Exception as e:
        print(f"❌ Error al cambiar contraseña: {str(e)}")
        return jsonify({'success': False, 'message': f'Error al cambiar contraseña: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# ✅ ENDPOINT TEMPORAL: Debug de tablas (puedes eliminarlo después)
@perfil_bp.route('/debug/tablas')
@requires_auth
def debug_tablas():
    """Endpoint temporal para diagnosticar la estructura de la base de datos"""
    try:
        # Base de datos users
        conn_users = get_users_db_connection()
        c_users = conn_users.cursor()
        
        # Obtener todas las tablas en users
        c_users.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tablas_users = c_users.fetchall()
        
        # Obtener estructura de cada tabla en users
        estructura_users = {}
        for tabla in tablas_users:
            tabla_nombre = tabla[0]
            c_users.execute(f"PRAGMA table_info({tabla_nombre})")
            columnas = c_users.fetchall()
            estructura_users[tabla_nombre] = [dict(col) for col in columnas]
        
        conn_users.close()
        
        # Base de datos game
        conn_game = get_game_db_connection()
        c_game = conn_game.cursor()
        
        # Obtener todas las tablas en game
        c_game.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tablas_game = c_game.fetchall()
        
        # Obtener estructura de cada tabla en game
        estructura_game = {}
        for tabla in tablas_game:
            tabla_nombre = tabla[0]
            c_game.execute(f"PRAGMA table_info({tabla_nombre})")
            columnas = c_game.fetchall()
            estructura_game[tabla_nombre] = [dict(col) for col in columnas]
        
        conn_game.close()
        
        return jsonify({
            'success': True,
            'users_database': estructura_users,
            'game_database': estructura_game
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500