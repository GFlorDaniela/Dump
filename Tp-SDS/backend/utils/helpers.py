# utils/helpers.py
from datetime import datetime
from database.db import get_db_connection

def log_event(event_type, details, user_id):
    """Función para logear eventos del sistema"""
    conn = None
    try:
        conn = get_db_connection()
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
    """Actualiza el leaderboard con las nuevas puntuaciones"""
    conn = None
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Obtener todos los jugadores ordenados por puntuación
        c.execute("""
            SELECT id, total_score 
            FROM game_players 
            ORDER BY total_score DESC, last_activity DESC
        """)
        players = c.fetchall()
        
        # Limpiar leaderboard anterior
        c.execute("DELETE FROM leaderboard")
        
        # Insertar nuevas posiciones
        for position, (p_id, total_points) in enumerate(players, 1):
            last_updated = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            c.execute(
                "INSERT INTO leaderboard (player_id, total_points, position, last_updated) VALUES (?, ?, ?, ?)",
                (p_id, total_points, position, last_updated)
            )
        
        conn.commit()
    except Exception as e:
        print(f"Error actualizando leaderboard: {e}")
    finally:
        if conn:
            conn.close()

def requires_auth(f):
    """Decorator para verificar autenticación"""
    from functools import wraps
    from flask import jsonify, session
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'success': False, 'message': 'No autorizado'}), 401
        return f(*args, **kwargs)
    return decorated_function