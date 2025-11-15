from flask import Blueprint, session, jsonify
from ..models.database import get_game_db_connection
from ..utils.helpers import requires_auth, log_event

# Define el Blueprint
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
@requires_auth
def api_dashboard():
    """Carga los datos del dashboard: recetas y estadísticas."""
    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()

        # 1. Obtener todas las recetas
        # NOTA: Usamos c.fetchone() / c.fetchall() que devuelven objetos Row (diccionario-como)
        c.execute("SELECT * FROM recetas ORDER BY id ASC")
        all_recetas = c.fetchall()

        recetas_disponibles = []
        recetas_bloqueadas = []
        
        # 2. Clasificar las recetas y convertir a formato JSON
        for receta in all_recetas:
            receta_data = {
                'id': receta['id'],
                'nombre': receta['nombre'],
                'ingredientes': receta['ingredientes'],
                'instrucciones': receta['instrucciones'],
                'bloqueada': bool(receta['bloqueada']),
                # El frontend no necesita la contraseña a menos que se obtenga por SQLi, aquí la ocultamos:
                'password_bloqueo': None, 
                'categoria': receta['categoria'],
                'user_id': receta['user_id']
            }
            
            if bool(receta['bloqueada']):
                recetas_bloqueadas.append(receta_data)
            else:
                recetas_disponibles.append(receta_data)

        log_event("DASHBOARD_LOAD", f"Usuario {session.get('username')} cargó dashboard", session.get('user_id'))

        # 3. Devolver los datos esperados por el frontend
        return jsonify({
            'success': True,
            'recetas': recetas_disponibles,
            'bloqueadas': recetas_bloqueadas
        })

    except Exception as e:
        print(f"Error cargando dashboard: {e}")
        return jsonify({'success': False, 'message': f'Error interno del servidor: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()