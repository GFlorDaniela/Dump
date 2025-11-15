from flask import Blueprint, session, jsonify
from ..models.database import get_game_db_connection
from ..utils.helpers import requires_auth, log_event

# Define el Blueprint
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
def api_dashboard():
    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()

        c.execute("SELECT * FROM recetas ORDER BY id ASC")
        all_recetas = c.fetchall()

        recetas_disponibles = []
        recetas_bloqueadas = []
        
        for receta in all_recetas:
            receta_data = {
                'id': receta['id'],
                'nombre': receta['nombre'],
                'ingredientes': receta['ingredientes'],
                'instrucciones': receta['instrucciones'],
                'bloqueada': bool(receta['bloqueada']),
                'password_bloqueo': None,
                'categoria': receta['categoria'],
                'user_id': receta['user_id']
            }

            if bool(receta['bloqueada']):
                recetas_bloqueadas.append(receta_data)
            else:
                recetas_disponibles.append(receta_data)

        # RECUPERAR USER DE SESIÓN
        user = {
            "id": session.get("user_id"),
            "username": session.get("username")
        }

        # IMPORTANTE: SI NO HAY USUARIO EN SESIÓN → 401
        if not user["id"]:
            return jsonify({"success": False, "message": "No autenticado"}), 401

        log_event("DASHBOARD_LOAD", f"Usuario {user['username']} cargó dashboard", user["id"])

        return jsonify({
            'success': True,
            'user': user,                 # <===== 🔥 EL FIX
            'recetas': recetas_disponibles,
            'bloqueadas': recetas_bloqueadas
        })

    except Exception as e:
        print(f"Error cargando dashboard: {e}")
        return jsonify({'success': False, 'message': f'Error interno del servidor: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()