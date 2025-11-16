from flask import Blueprint, request, session, jsonify
from app.models.database import get_game_db_connection
from ..utils.helpers import requires_auth, log_event

recetas_bp = Blueprint('recetas', __name__)

# -------------------------------------
# BÚSQUEDA DE RECETAS (vulnerable a SQLi)
# -------------------------------------
@recetas_bp.route('/buscar', methods=['POST'])
@requires_auth
def api_buscar():
    data = request.get_json()
    busqueda = data.get('busqueda', '')

    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()

        # VULNERABILIDAD intencional: SQL Injection
        query = f"SELECT * FROM recetas WHERE nombre LIKE '%{busqueda}%'"
        c.execute(query)
        recetas = c.fetchall()
        
        recetas_json = []
        for receta in recetas:
            # ✅ CORREGIDO: No mostrar password_bloqueo si la receta está desbloqueada
            password_bloqueo = receta[5] if receta[4] == 1 else None  # receta[4] es bloqueada
            
            recetas_json.append({
                'id': receta[0],
                'nombre': receta[1],
                'ingredientes': receta[2],
                'instrucciones': receta[3],
                'bloqueada': bool(receta[4]),
                'password_bloqueo': password_bloqueo,  # ✅ Solo si está bloqueada
                'categoria': receta[6],
                'user_id': receta[7],
                'created_at': receta[8]
            })

        response_data = {'success': True, 'recetas': recetas_json}

        # Detectar patrones de SQLi simples y asignar flag
        if any(x in busqueda for x in ["'", "--"]) or "OR '1'='1'" in busqueda.upper():
            response_data['flag'] = 'SQL2_FLAG_3y8fE1gH'
            response_data['message'] = '¡SQL Injection en búsqueda detectado! Flag: SQL2_FLAG_3y8fE1gH'
            response_data['vulnerability'] = 'SQL Injection - Búsqueda'
            response_data['points'] = 100

        log_event("BUSQUEDA_RECETAS", f"Usuario {session.get('username')} buscó: '{busqueda}' - Resultados: {len(recetas_json)}", session.get('user_id'))

        return jsonify(response_data)

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error en la búsqueda: {str(e)}'})
    finally:
        if conn:
            conn.close()

# -------------------------------------
# LISTAR TODAS LAS RECETAS DESBLOQUEADAS
# -------------------------------------
@recetas_bp.route('/recetas')
@requires_auth
def api_recetas():
    conn = None
    try:
        conn = get_game_db_connection()
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

        log_event("RECETAS_ACCESS", f"Usuario {session.get('username')} accedió a todas las recetas", session.get('user_id'))

        return jsonify({'success': True, 'recetas': recetas_json})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()


# -------------------------------------
# ACCEDER A UNA RECETA POR ID
# -------------------------------------
@recetas_bp.route('/receta/<int:receta_id>')
@requires_auth
def api_receta(receta_id):
    conn = None
    try:
        conn = get_game_db_connection()
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

        log_event("RECETA_ACCESS", f"Usuario {session.get('username')} accedió a receta ID: {receta_id}", session.get('user_id'))

        return jsonify({'success': True, 'receta': receta_json})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()


# -------------------------------------
# DESBLOQUEAR RECETA (contraseña débil) - CORREGIDO
# -------------------------------------
@recetas_bp.route('/desbloquear_receta/<int:receta_id>', methods=['POST'])
@requires_auth
def api_desbloquear_receta(receta_id):
    data = request.get_json()
    password = data.get('password', '')

    conn = None
    try:
        conn = get_game_db_connection()
        c = conn.cursor()
        
        c.execute("SELECT * FROM recetas WHERE id = ?", (receta_id,))
        receta = c.fetchone()

        if not receta:
            return jsonify({'success': False, 'message': 'Receta no encontrada'})

        # Comparación directa (vulnerable intencionalmente)
        if password == receta[5]:  # receta[5] es password_bloqueo
            # ✅ CORREGIDO: ACTUALIZAR LA BASE DE DATOS
            c.execute("""
                UPDATE recetas 
                SET bloqueada = 0 
                WHERE id = ?
            """, (receta_id,))
            conn.commit()
            
            # Obtener la receta actualizada
            c.execute("SELECT * FROM recetas WHERE id = ?", (receta_id,))
            receta_actualizada = c.fetchone()
            
            receta_json = {
                'id': receta_actualizada[0],
                'nombre': receta_actualizada[1],
                'ingredientes': receta_actualizada[2],
                'instrucciones': receta_actualizada[3],
                'bloqueada': bool(receta_actualizada[4]),  # Ahora será False
                'password_bloqueo': receta_actualizada[5],
                'categoria': receta_actualizada[6],
                'user_id': receta_actualizada[7],
                'created_at': receta_actualizada[8]
            }

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

            log_event("RECETA_DESBLOQUEADA", f"Usuario {session.get('username')} desbloqueó receta: {receta[1]}", session.get('user_id'))

            return jsonify(response_data)
        else:
            log_event("RECETA_DESBLOQUEO_FALLIDO", f"Usuario {session.get('username')} falló al desbloquear receta ID: {receta_id}", session.get('user_id'))
            return jsonify({'success': False, 'message': 'Contraseña incorrecta'})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()