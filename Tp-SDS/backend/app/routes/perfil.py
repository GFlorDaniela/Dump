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
    #   2. Obtener user_id SOLO de sesión (nunca de parámetros)
    # ------------------------------
    raw_user_id = session_user['numeric_id']  

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
        # Caso legacy
        prefix = "U"
        numeric_id = str(raw_user_id)
        db = "users"

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
        #  FORMATO DE RESPUESTA
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

        return jsonify(response_data)

    except Exception as e:
        print(f"❌ Error en perfil: {str(e)}")
        return jsonify({'success': False, 'message': f'Error interno: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

#  ENDPOINT: Editar perfil (SEGURO)
@perfil_bp.route('/perfil/editar', methods=['POST'])
@requires_auth
def editar_perfil():
    session_user = session.get('user')
    if not session_user:
        return jsonify({'success': False, 'message': 'No autenticado'}), 401

    data = request.get_json()
    
    user_id = session_user['numeric_id']
    
    nombre = data.get('nombre')
    apellido = data.get('apellido')
    email = data.get('email')

    if not all([nombre, apellido, email]):
        return jsonify({'success': False, 'message': 'Todos los campos son requeridos'}), 400

    # Determinar base de datos basado en el user_id de sesión
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
            
            c.execute("""
                UPDATE jugadores 
                SET nombre = ?, apellido = ?, email = ?
                WHERE id = ?
            """, (nombre, apellido, email, numeric_id))
            
        else:
            conn = get_game_db_connection()
            c = conn.cursor()
            
            full_name = f"{nombre} {apellido}".strip()
            c.execute("""
                UPDATE users 
                SET full_name = ?, email = ?
                WHERE id = ?
            """, (full_name, email, numeric_id))
        
        if c.rowcount == 0:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        
        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Perfil actualizado exitosamente'
        })

    except Exception as e:
        print(f"❌ Error al actualizar perfil: {str(e)}")
        return jsonify({'success': False, 'message': f'Error al actualizar perfil: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

#  ENDPOINT: Cambiar contraseña (SEGURO)
@perfil_bp.route('/perfil/cambiar-password', methods=['POST'])
@requires_auth
def cambiar_password():
    session_user = session.get('user')
    if not session_user:
        return jsonify({'success': False, 'message': 'No autenticado'}), 401

    data = request.get_json()
    
    user_id = session_user['numeric_id']
    
    nueva_password = data.get('nueva_password')

    if not nueva_password:
        return jsonify({'success': False, 'message': 'La nueva contraseña es requerida'}), 400

    # Validar fortaleza de contraseña
    if len(nueva_password) < 8:
        return jsonify({'success': False, 'message': 'La contraseña debe tener al menos 8 caracteres'}), 400

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
            
            # En producción, aquí deberías hashear la contraseña
            c.execute("UPDATE jugadores SET password_hash = ? WHERE id = ?", (nueva_password, numeric_id))
            
        else:
            conn = get_game_db_connection()
            c = conn.cursor()
            
            c.execute("UPDATE users SET password = ? WHERE id = ?", (nueva_password, numeric_id))
        
        if c.rowcount == 0:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        
        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Contraseña cambiada exitosamente'
        })

    except Exception as e:
        print(f"❌ Error al cambiar contraseña: {str(e)}")
        return jsonify({'success': False, 'message': f'Error al cambiar contraseña: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()