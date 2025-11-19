from flask import Blueprint, request, session, jsonify
from app.models.database import get_users_db_connection
from ..utils.helpers import requires_auth, requires_presentador
from ..utils.security import hash_password
import uuid
from datetime import datetime

presentadores_bp = Blueprint('presentadores', __name__)

# -------------------------------------
# DASHBOARD PARA PRESENTADORES
# -------------------------------------
@presentadores_bp.route('/dashboard')
@requires_auth
@requires_presentador
def presentador_dashboard():
    """Dashboard exclusivo para presentadores"""
    conn = None
    try:
        conn = get_users_db_connection()
        c = conn.cursor()
        
        # Estadísticas de jugadores
        c.execute("SELECT COUNT(*) as total_jugadores, AVG(total_score) as promedio_puntos FROM jugadores")
        stats = c.fetchone()
        
        # Top 5 jugadores
        c.execute("SELECT nickname, total_score FROM jugadores ORDER BY total_score DESC LIMIT 5")
        top_jugadores = c.fetchall()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_jugadores': stats['total_jugadores'],
                'promedio_puntos': stats['promedio_puntos'] or 0
            },
            'top_jugadores': [
                {'nickname': j['nickname'], 'puntos': j['total_score']} 
                for j in top_jugadores
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()


# -------------------------------------
# CREAR NUEVO PRESENTADOR
# -------------------------------------
@presentadores_bp.route('/crear-presentador', methods=['POST'])
@requires_auth
@requires_presentador
def crear_presentador():
    """Crear nuevo presentador (solo presentadores existentes)"""
    data = request.get_json()
    nickname = data.get('nickname')
    nombre = data.get('nombre')
    apellido = data.get('apellido')
    email = data.get('email')
    password = data.get('password')
    
    if not all([nickname, nombre, apellido, email, password]):
        return jsonify({'success': False, 'message': 'Todos los campos son requeridos'})
    
    conn = None
    try:
        conn = get_users_db_connection()
        c = conn.cursor()
        
        # Verificar si el nickname o email ya existen
        c.execute("SELECT id FROM presentadores WHERE nickname = ? OR email = ?", (nickname, email))
        if c.fetchone():
            return jsonify({'success': False, 'message': 'Nickname o email ya existen'})
        
        # Crear nuevo presentador
        presentador_uuid = str(uuid.uuid4())
        password_hash = hash_password(password)
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        c.execute('''
            INSERT INTO presentadores (uuid, nickname, nombre, apellido, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (presentador_uuid, nickname, nombre, apellido, email, password_hash, 'presentador', created_at))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Presentador creado exitosamente',
            'presentador': {
                'nickname': nickname,
                'nombre': nombre,
                'apellido': apellido,
                'email': email
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    finally:
        if conn:
            conn.close()
