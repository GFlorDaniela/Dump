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

    try:
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
        return jsonify({'success': False, 'message': f'Error interno: {str(e)}'})

    finally:
        conn.close()
