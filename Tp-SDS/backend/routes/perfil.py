from flask import jsonify, request, session
from database.db import get_db_connection
from utils.helpers import requires_auth

def init_perfil_routes(app):
    
    # VULNERABILIDAD: IDOR - Puedes ver cualquier perfil
    @app.route('/api/perfil')
    @requires_auth
    def api_perfil():
        user_id = request.args.get('user_id', session.get('user_id'))
        
        # Si se accede a un perfil diferente al propio, proporcionar flag IDOR
        flag_provided = False
        if user_id != str(session.get('user_id')):
            flag_provided = True
        
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            usuario = c.fetchone()
            
            if usuario:
                response_data = {
                    'success': True,
                    'usuario': {
                        'id': usuario[0],
                        'username': usuario[1],
                        'role': usuario[3],
                        'email': usuario[4],
                        'full_name': usuario[5]
                    }
                }
                
                if flag_provided:
                    response_data['flag'] = 'IDOR1_FLAG_789'
                    response_data['message'] = '¡IDOR detectado! Flag: IDOR1_FLAG_789'
                
                return jsonify(response_data)
            else:
                return jsonify({'success': False, 'message': 'Usuario no encontrado'})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()
