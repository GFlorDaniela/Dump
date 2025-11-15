from flask import Blueprint, request, session, jsonify
from ..models.database import get_users_db_connection, get_game_db_connection  # Cambiado de ...models
from ..utils.security import check_password, hash_password  # Cambiado de ...utils
from ..utils.helpers import log_event  # Cambiado de ...utils
import uuid
import sqlite3
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')

    # SISTEMA SEGURO - SIN VULNERABILIDADES
    # Primero verificar si es presentador (autenticación fuerte)
    presenter = authenticate_presentador(username, password)
    if presenter:
        session['user_id'] = presenter['id']
        session['username'] = presenter['nickname']
        session['role'] = 'presentador'
        session['uuid'] = presenter['uuid']

        presenter_data = {
            'id': presenter['id'],
            'username': presenter['nickname'],
            'role': 'presentador',
            'nombre': presenter['nombre'],
            'apellido': presenter['apellido'],
            'email': presenter['email']
        }

        return jsonify({
            'success': True,
            'user': presenter_data,
            'message': 'Login exitoso como presentador'
        })

    # Si no es presentador, verificar como jugador
    player = authenticate_jugador(username, password)
    if player:
        session['user_id'] = player['id']
        session['username'] = player['nickname']
        session['role'] = 'jugador'
        session['uuid'] = player['uuid']

        player_data = {
            'id': player['id'],
            'username': player['nickname'],
            'role': 'jugador',
            'nombre': player['nombre'],
            'apellido': player['apellido'],
            'email': player['email']
        }

        return jsonify({
            'success': True,
            'user': player_data,
            'message': 'Login exitoso como jugador'
        })

    return jsonify({
        'success': False,
        'message': 'Credenciales incorrectas'
    }), 401

def authenticate_presentador(username, password):
    """Autenticación FUERTE para presentadores"""
    conn = get_users_db_connection()
    c = conn.cursor()

    c.execute('SELECT * FROM presentadores WHERE nickname = ? OR email = ?', (username, username))
    presenter = c.fetchone()
    conn.close()

    if presenter and check_password(password, presenter['password_hash']):
        return dict(presenter)
    return None

def authenticate_jugador(username, password):
    """Autenticación SEGURA para jugadores - ACTUALIZADO"""
    conn = get_users_db_connection()
    c = conn.cursor()

    c.execute('SELECT * FROM jugadores WHERE nickname = ? OR email = ?', (username, username))
    player = c.fetchone()
    conn.close()

    if player and check_password(password, player['password_hash']):
        return dict(player)
    return None

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Sesión cerrada'})

@auth_bp.route('/register/jugador', methods=['POST'])
def register_jugador():
    data = request.get_json()
    nickname = data.get('nickname')
    nombre = data.get('nombre')
    apellido = data.get('apellido')
    email = data.get('email')
    password = data.get('password')

    if not all([nickname, nombre, apellido, email, password]):
        return jsonify({'success': False, 'message': 'Todos los campos son requeridos'})

    conn = get_users_db_connection()
    c = conn.cursor()

    try:
        # ✅ USAR HASH DE CONTRASEÑA (SEGURO)
        password_hash = hash_password(password)
        player_uuid = str(uuid.uuid4())
        created_at = datetime.now().isoformat()

        c.execute('''
            INSERT INTO jugadores (uuid, nickname, nombre, apellido, email, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (player_uuid, nickname, nombre, apellido, email, password_hash, created_at))

        conn.commit()
        player_id = c.lastrowid

        return jsonify({
            'success': True,
            'player': {
                'id': player_id,
                'uuid': player_uuid,
                'nickname': nickname,
                'nombre': nombre,
                'apellido': apellido,
                'email': email,
                'total_score': 0,
                'role': 'jugador'
            }
        })

    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Nickname o email ya existen'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error en el registro: {str(e)}'})
    finally:
        conn.close()