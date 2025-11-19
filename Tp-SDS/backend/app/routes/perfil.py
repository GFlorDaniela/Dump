from flask import Blueprint, request, session, jsonify
from app.models.database import get_users_db_connection, get_game_db_connection
from ..utils.helpers import requires_auth
from ..utils.security import hash_password

perfil_bp = Blueprint('perfil', __name__)

# ==========================================================
#                  OBTENER PERFIL
# ==========================================================
@perfil_bp.route('/perfil')
@requires_auth
def api_perfil():

    # 1) Si viene por URL, lo usamos
    user_id = request.args.get("user_id")

    # 2) Si no viene nada, usamos la sesión
    if not user_id:
        session_user = session.get("user")
        if not session_user:
            return jsonify({"success": False, "message": "No autenticado"}), 401
        user_id = session_user.get("id")  # Ej: U-3 o G-1

    # Detectar si es U- o G-
    if str(user_id).startswith("U-"):
        numeric_id = user_id.replace("U-", "")
        db_type = "users"
    elif str(user_id).startswith("G-"):
        numeric_id = user_id.replace("G-", "")
        db_type = "game"
    else:
        numeric_id = user_id
        db_type = "users"

    try:
        if db_type == "users":
            conn = get_users_db_connection()
            query = """
            SELECT id, nickname, nombre, apellido, email, role 
            FROM jugadores WHERE id = ?
            """
        else:
            conn = get_game_db_connection()
            query = """
            SELECT id, username, full_name, email, role 
            FROM users WHERE id = ?
            """

        c = conn.cursor()
        c.execute(query, (numeric_id,))
        row = c.fetchone()

        if not row:
            return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

        # Respuesta para DB "users"
        if db_type == "users":
            uid, nickname, nombre, apellido, email, role = row
            full_name = f"{nombre} {apellido}"
            return jsonify({
                "success": True,
                "usuario": {
                    "id": f"U-{uid}",
                    "username": nickname,
                    "full_name": full_name,
                    "email": email,
                    "role": role
                }
            })

        # Respuesta para DB "game"
        uid, username, full_name, email, role = row
        return jsonify({
            "success": True,
            "usuario": {
                "id": f"G-{uid}",
                "username": username,
                "full_name": full_name,
                "email": email,
                "role": role
            }
        })

    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


# ==========================================================
#                  EDITAR PERFIL
# ==========================================================
@perfil_bp.route('/perfil/editar', methods=['POST'])
@requires_auth
def editar_perfil():

    session_user = session.get("user")
    if not session_user:
        return jsonify({"success": False, "message": "No autenticado"}), 401

    data = request.get_json()

    # 1) TOMAR USER_ID DESDE QUERY (IDOR TOTAL)
    target_id = request.args.get("user_id")

    # 2) Si NO viene en query → editar el perfil del que está logueado
    if not target_id:
        target_id = session_user.get("id")

    # 3) Determinar DB según prefijo
    if isinstance(target_id, str) and target_id.startswith("U-"):
        numeric_id = target_id.replace("U-", "")
        db_type = "users"

    elif isinstance(target_id, str) and target_id.startswith("G-"):
        numeric_id = target_id.replace("G-", "")
        db_type = "game"

    else:
        numeric_id = target_id
        db_type = "users"

    # 4) Datos del body
    nombre = data.get("nombre")
    apellido = data.get("apellido")
    email = data.get("email")

    if not all([nombre, apellido, email]):
        return jsonify({'success': False, 'message': 'Todos los campos son requeridos'}), 400

    conn = None
    try:
        if db_type == "users":
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
            'message': 'Perfil actualizado correctamente',
            'edited_user': target_id
        })

    except Exception as e:
        print("❌ Error al editar perfil:", e)
        return jsonify({'success': False, 'message': f'Error al editar perfil: {str(e)}'}), 500

    finally:
        if conn:
            conn.close()



# ==========================================================
#                  CAMBIAR PASSWORD
# ==========================================================
@perfil_bp.route('/perfil/cambiar-password', methods=['POST'])
@requires_auth
def cambiar_password():

    session_user = session.get("user")
    if not session_user:
        return jsonify({"success": False, "message": "No autenticado"}), 401

    data = request.get_json()

    # 1) Tomar el ID desde la QUERY (IDOR total)
    target_id = request.args.get("user_id")

    # 2) Si NO viene, usamos el usuario logueado
    if not target_id:
        target_id = session_user.get("id")

    # 3) Detectar DB por prefijo
    if target_id.startswith("U-"):
        numeric_id = target_id.replace("U-", "")
        db_type = "users"

    elif target_id.startswith("G-"):
        numeric_id = target_id.replace("G-", "")
        db_type = "game"

    else:
        numeric_id = target_id
        db_type = "users"

    nueva_password = data.get("nueva_password")
    if not nueva_password:
        return jsonify({"success": False, "message": "La nueva contraseña es requerida"}), 400

    try:
        if db_type == "users":
            conn = get_users_db_connection()
            c = conn.cursor()

            c.execute("""
                UPDATE jugadores 
                SET password_hash = ?
                WHERE id = ?
            """, (hash_password(nueva_password), numeric_id))

        else:
            conn = get_game_db_connection()
            c = conn.cursor()

            c.execute("""
                UPDATE users 
                SET password = ?
                WHERE id = ?
            """, (hash_password(nueva_password), numeric_id))

        if c.rowcount == 0:
            return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Contraseña cambiada",
            "edited_user": target_id
        })

    except Exception as e:
        print("❌ Error cambiando contraseña:", e)
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

    finally:
        conn.close()
