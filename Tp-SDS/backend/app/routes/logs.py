from flask import Blueprint, session, jsonify
from ..models.database import get_game_db_connection
from ..utils.helpers import requires_auth

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/logs')
@requires_auth
def api_logs():
    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()
        
        c.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 10")
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

        # Siempre proporcionar flag de Information Disclosure cuando se ven logs
        return jsonify({
            'success': True,
            'logs': logs_json,
            'flag': 'INFO_FLAG_112',
            'message': '¡Information Disclosure detectado! Flag: INFO_FLAG_112'
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()