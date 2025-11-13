# routes/auth.py
from flask import jsonify, request, session
from database.db import get_db_connection
from utils.helpers import log_event, requires_auth

def init_auth_routes(app):
    
    @app.route('/api/login', methods=['POST'])
    def api_login():
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # VULNERABILIDAD: SQL Injection
        query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
        
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute(query)
            user = c.fetchone()
            
            if user:
                session['user_id'] = user[0]
                session['username'] = user[1]
                session['role'] = user[3]
                
                log_event("LOGIN_EXITOSO", f"Usuario {user[1]} inició sesión", user[0])
                
                # Si se usa SQL Injection exitoso, proporcionar flag
                sql_injection_detected = (
                    "' OR '1'='1" in username or 
                    "' OR '1'='1" in password or
                    "' OR '1'='1' --" in username or
                    "' OR '1'='1' --" in password or
                    "'=''='" in username or
                    "'=''='" in password
                )
                
                if sql_injection_detected:
                    return jsonify({
                        'success': True,
                        'user': {
                            'id': user[0],
                            'username': user[1],
                            'role': user[3],
                            'email': user[4],
                            'full_name': user[5]
                        },
                        'flag': 'SQL1_FLAG_123',
                        'message': '¡SQL Injection detectado! Flag: SQL1_FLAG_123'
                    })
                
                return jsonify({
                    'success': True,
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'role': user[3],
                        'email': user[4],
                        'full_name': user[5]
                    }
                })
            else:
                return jsonify({'success': False, 'message': 'Credenciales incorrectas'})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error en el sistema: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/logout', methods=['POST'])
    @requires_auth
    def api_logout():
        user_id = session.get('user_id')
        username = session.get('username')
        
        session.clear()
        
        # Log del logout
        log_event("LOGOUT", f"Usuario {username} cerró sesión", user_id)
        
        return jsonify({'success': True, 'message': 'Sesión cerrada'})

    @app.route('/api/check-auth')
    def api_check_auth():
        """Endpoint para verificar si el usuario está autenticado"""
        if session.get('user_id'):
            return jsonify({
                'success': True,
                'authenticated': True,
                'user': {
                    'id': session.get('user_id'),
                    'username': session.get('username'),
                    'role': session.get('role')
                }
            })
        else:
            return jsonify({
                'success': True,
                'authenticated': False
            })

    @app.route('/api/session-info')
    @requires_auth
    def api_session_info():
        """Endpoint para obtener información de la sesión actual"""
        return jsonify({
            'success': True,
            'session': {
                'user_id': session.get('user_id'),
                'username': session.get('username'),
                'role': session.get('role')
            }
        })