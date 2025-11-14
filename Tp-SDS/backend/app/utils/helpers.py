from datetime import datetime
from functools import wraps
from flask import jsonify, session
from ..models.database import get_game_db_connection, get_users_db_connection

def log_event(event_type, details, user_id):
    """Función para logear eventos del sistema - usar game_db (vulnerable)"""
    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        c.execute("INSERT INTO system_logs (timestamp, event, details, user_id) VALUES (?, ?, ?, ?)",
                 (timestamp, event_type, details, user_id))
        conn.commit()
    except Exception as e:
        print(f"Error logueando evento: {e}")
    finally:
        if conn:
            conn.close()

def update_leaderboard():
    """Actualizar leaderboard - usar SOLO users_db"""
    conn = None
    try:
        conn = get_users_db_connection()  # ✅ SOLO users.db
        c = conn.cursor()
        
        # Obtener todos los jugadores ordenados por puntuación
        c.execute("SELECT id, total_score FROM jugadores ORDER BY total_score DESC")
        players = c.fetchall()
        
        # Limpiar leaderboard anterior en USERS database
        c.execute("DELETE FROM leaderboard")
        
        # Insertar nuevas posiciones en USERS database
        for position, player in enumerate(players, 1):
            last_updated = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            c.execute("INSERT INTO leaderboard (player_id, total_points, position, last_updated) VALUES (?, ?, ?, ?)",
                     (player['id'], player['total_score'], position, last_updated))
        
        conn.commit()
    except Exception as e:
        print(f"Error actualizando leaderboard: {e}")
    finally:
        if conn:
            conn.close()

def requires_auth(f):
    """Decorator para verificar autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'success': False, 'message': 'No autorizado'}), 401
        return f(*args, **kwargs)
    return decorated_function

def requires_presentador(f):
    """Decorator para verificar que es presentador"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id') or session.get('role') != 'presentador':
            return jsonify({'success': False, 'message': 'Se requiere rol de presentador'}), 403
        return f(*args, **kwargs)
    return decorated_function