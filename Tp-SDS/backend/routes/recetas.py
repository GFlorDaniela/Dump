from flask import jsonify, request, session
from database.db import get_db_connection
from utils.helpers import requires_auth, log_event

def init_recetas_routes(app):
    
    @app.route('/api/dashboard')
    @requires_auth
    def api_dashboard():
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            
            # Recetas no bloqueadas
            c.execute("SELECT * FROM recetas WHERE bloqueada = 0")
            recetas_disponibles = c.fetchall()
            
            # Recetas bloqueadas
            c.execute("SELECT id, nombre, categoria FROM recetas WHERE bloqueada = 1")
            recetas_bloqueadas = c.fetchall()
            
            # Convertir a formato JSON
            recetas_json = []
            for receta in recetas_disponibles:
                recetas_json.append({
                    'id': receta[0],
                    'nombre': receta[1],
                    'ingredientes': receta[2],
                    'instrucciones': receta[3],
                    'bloqueada': bool(receta[4]),
                    'password_bloqueo': receta[5],
                    'categoria': receta[6],
                    'user_id': receta[7],
                    'created_at': receta[8]
                })
            
            bloqueadas_json = []
            for receta in recetas_bloqueadas:
                bloqueadas_json.append({
                    'id': receta[0],
                    'nombre': receta[1],
                    'categoria': receta[2]
                })
            
            # Log del acceso al dashboard
            log_event("DASHBOARD_ACCESS", f"Usuario {session.get('username')} accedió al dashboard", session.get('user_id'))
            
            return jsonify({
                'success': True,
                'recetas': recetas_json,
                'bloqueadas': bloqueadas_json,
                'user': {
                    'id': session.get('user_id'),
                    'username': session.get('username'),
                    'role': session.get('role')
                }
            })
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/recetas')
    @requires_auth
    def api_recetas():
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("SELECT * FROM recetas WHERE bloqueada = 0")
            recetas = c.fetchall()
            
            recetas_json = []
            for receta in recetas:
                recetas_json.append({
                    'id': receta[0],
                    'nombre': receta[1],
                    'ingredientes': receta[2],
                    'instrucciones': receta[3],
                    'bloqueada': bool(receta[4]),
                    'password_bloqueo': receta[5],
                    'categoria': receta[6],
                    'user_id': receta[7],
                    'created_at': receta[8]
                })
            
            # Log del acceso a recetas
            log_event("RECETAS_ACCESS", f"Usuario {session.get('username')} accedió a todas las recetas", session.get('user_id'))
            
            return jsonify({'success': True, 'recetas': recetas_json})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/receta/<int:receta_id>')
    @requires_auth
    def api_receta(receta_id):
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("SELECT * FROM recetas WHERE id = ?", (receta_id,))
            receta = c.fetchone()
            
            if not receta:
                return jsonify({'success': False, 'message': 'Receta no encontrada'})
            
            receta_json = {
                'id': receta[0],
                'nombre': receta[1],
                'ingredientes': receta[2],
                'instrucciones': receta[3],
                'bloqueada': bool(receta[4]),
                'password_bloqueo': receta[5],
                'categoria': receta[6],
                'user_id': receta[7],
                'created_at': receta[8]
            }
            
            # Log del acceso a receta específica
            log_event("RECETA_ACCESS", f"Usuario {session.get('username')} accedió a receta ID: {receta_id}", session.get('user_id'))
            
            return jsonify({'success': True, 'receta': receta_json})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/desbloquear_receta/<int:receta_id>', methods=['POST'])
    @requires_auth
    def api_desbloquear_receta(receta_id):
        data = request.get_json()
        password = data.get('password', '')
        
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("SELECT * FROM recetas WHERE id = ?", (receta_id,))
            receta = c.fetchone()
            
            if not receta:
                return jsonify({'success': False, 'message': 'Receta no encontrada'})
            
            # VULNERABILIDAD: Verificación débil de contraseña
            if password == receta[5]:  # password_bloqueo
                receta_json = {
                    'id': receta[0],
                    'nombre': receta[1],
                    'ingredientes': receta[2],
                    'instrucciones': receta[3],
                    'bloqueada': bool(receta[4]),
                    'password_bloqueo': receta[5],
                    'categoria': receta[6],
                    'user_id': receta[7],
                    'created_at': receta[8]
                }
                
                # Proporcionar flags según la receta desbloqueada
                flag = None
                if receta_id == 3:
                    flag = 'RECETA3_FLAG_202'
                elif receta_id == 5:
                    flag = 'RECETA5_FLAG_303'
                
                response_data = {
                    'success': True, 
                    'receta': receta_json,
                    'message': '¡Receta desbloqueada exitosamente!'
                }
                
                if flag:
                    response_data['flag'] = flag
                    response_data['message'] = f'¡Receta desbloqueada! Flag: {flag}'
                
                # Log del desbloqueo exitoso
                log_event("RECETA_DESBLOQUEADA", f"Usuario {session.get('username')} desbloqueó receta: {receta[1]}", session.get('user_id'))
                
                return jsonify(response_data)
            else:
                # Log del intento fallido
                log_event("RECETA_DESBLOQUEO_FALLIDO", f"Usuario {session.get('username')} falló al desbloquear receta ID: {receta_id}", session.get('user_id'))
                return jsonify({'success': False, 'message': 'Contraseña incorrecta'})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/buscar', methods=['POST'])
    @requires_auth
    def api_buscar():
        data = request.get_json()
        busqueda = data.get('busqueda', '')
        
        # VULNERABILIDAD: SQL Injection en búsqueda
        query = f"SELECT * FROM recetas WHERE (nombre LIKE '%{busqueda}%' OR ingredientes LIKE '%{busqueda}%' OR categoria LIKE '%{busqueda}%') AND bloqueada = 0"
        
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute(query)
            recetas = c.fetchall()
            
            recetas_json = []
            for receta in recetas:
                recetas_json.append({
                    'id': receta[0],
                    'nombre': receta[1],
                    'ingredientes': receta[2],
                    'instrucciones': receta[3],
                    'bloqueada': bool(receta[4]),
                    'password_bloqueo': receta[5],
                    'categoria': receta[6],
                    'user_id': receta[7],
                    'created_at': receta[8]
                })
            
            # Si se detecta SQL Injection en la búsqueda, proporcionar flag
            response_data = {'success': True, 'recetas': recetas_json}
            
            sql_injection_detected = (
                "'" in busqueda or 
                "UNION" in busqueda.upper() or 
                "SELECT" in busqueda.upper() or
                "INSERT" in busqueda.upper() or
                "DELETE" in busqueda.upper() or
                "UPDATE" in busqueda.upper() or
                "DROP" in busqueda.upper() or
                "--" in busqueda or
                ";" in busqueda
            )
            
            if sql_injection_detected:
                response_data['flag'] = 'SQL2_FLAG_456'
                response_data['message'] = '¡SQL Injection en búsqueda detectado! Flag: SQL2_FLAG_456'
            
            # Log de la búsqueda
            log_event("BUSQUEDA_RECETAS", f"Usuario {session.get('username')} buscó: '{busqueda}' - Resultados: {len(recetas_json)}", session.get('user_id'))
            
            return jsonify(response_data)
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error en la búsqueda: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/recetas/categorias')
    @requires_auth
    def api_recetas_categorias():
        """Endpoint para obtener todas las categorías disponibles"""
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("SELECT DISTINCT categoria FROM recetas ORDER BY categoria")
            categorias = c.fetchall()
            
            categorias_list = [categoria[0] for categoria in categorias]
            
            return jsonify({
                'success': True,
                'categorias': categorias_list
            })
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/recetas/filtrar', methods=['POST'])
    @requires_auth
    def api_recetas_filtrar():
        """Endpoint para filtrar recetas por categoría"""
        data = request.get_json()
        categoria = data.get('categoria', '')
        
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            
            if categoria:
                c.execute("SELECT * FROM recetas WHERE categoria = ? AND bloqueada = 0", (categoria,))
            else:
                c.execute("SELECT * FROM recetas WHERE bloqueada = 0")
            
            recetas = c.fetchall()
            
            recetas_json = []
            for receta in recetas:
                recetas_json.append({
                    'id': receta[0],
                    'nombre': receta[1],
                    'ingredientes': receta[2],
                    'instrucciones': receta[3],
                    'bloqueada': bool(receta[4]),
                    'password_bloqueo': receta[5],
                    'categoria': receta[6],
                    'user_id': receta[7],
                    'created_at': receta[8]
                })
            
            # Log del filtrado
            log_event("FILTRADO_RECETAS", f"Usuario {session.get('username')} filtró por categoría: '{categoria}'", session.get('user_id'))
            
            return jsonify({
                'success': True,
                'recetas': recetas_json,
                'filtro': categoria
            })
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()