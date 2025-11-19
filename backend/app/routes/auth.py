from flask import Blueprint, request, jsonify, session
import sqlite3
import bcrypt
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from datetime import datetime

# -----------------------------------------------------
# 🔹 Blueprint con url_prefix para que React lo encuentre
# -----------------------------------------------------
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

USER_DB = "data/users.db"

def get_connection(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


# -------------------------------------
# 🔐 LOGIN
# -------------------------------------
@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'success': False, 'message': 'Usuario y contraseña requeridos'}), 400

    conn = get_connection(USER_DB)
    cursor = conn.cursor()
    
    # 🔍 Buscar primero en presentadores, luego en jugadores
    cursor.execute("""
        SELECT id, uuid, nickname, email, nombre, apellido, password_hash, role, 'presentadores' as source_table
        FROM presentadores 
        WHERE nickname = ?
        UNION ALL
        SELECT id, uuid, nickname, email, nombre, apellido, password_hash, role, 'jugadores' as source_table  
        FROM jugadores 
        WHERE nickname = ?
    """, (username, username))
    
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

    stored_hash = user["password_hash"]

    # Verificar contraseña
    if stored_hash.startswith("$2b$"):
        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            return jsonify({'success': False, 'message': 'Contraseña incorrecta'}), 401
    else:
        if not check_password_hash(stored_hash, password):
            return jsonify({'success': False, 'message': 'Contraseña incorrecta'}), 401

    # Generar ID público basado en la tabla de origen
    if user["source_table"] == "presentadores":
        public_id = f"P-{user['id']:04d}"  # Prefijo para presentadores
    else:
        public_id = f"U-{user['id']:04d}"  # Prefijo para jugadores

    user_data = {
        'id': public_id,
        'numeric_id': user['id'],
        'uuid': user['uuid'],
        'username': user['nickname'],
        'email': user['email'],
        'nombre': user['nombre'],
        'apellido': user['apellido'],
        'role': user['role'],
        'source_table': user["source_table"]
    }

    # Guardar usuario en sesión
    session['user'] = user_data

    return jsonify({'success': True, 'usuario': user_data}), 200


# -------------------------------------
# 🆕 REGISTRO
# -------------------------------------
@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    data = request.get_json()
    
    print("🔍 === DATOS RECIBIDOS EN BACKEND ===")
    print(f"📦 Data completa: {data}")
    if data:
        print("📊 Campos recibidos:")
        for key in ['username', 'password', 'email', 'nombre', 'apellido']:
            value = data.get(key)
            if key == 'password':
                print(f"   - {key}: {'***' if value else 'FALTANTE'}")
            else:
                print(f"   - {key}: '{value}'")
    print("🔍 =================================")
    
    if not data:
        return jsonify({
            'success': False, 
            'message': 'No se recibieron datos JSON'
        }), 400
        
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    email = data.get('email', '').strip()
    nombre = data.get('nombre', '').strip()
    apellido = data.get('apellido', '').strip()

    # Validación
    missing_fields = []
    if not username: missing_fields.append('username')
    if not password: missing_fields.append('password')
    if not email: missing_fields.append('email')
    if not nombre: missing_fields.append('nombre')
    if not apellido: missing_fields.append('apellido')
    
    if missing_fields:
        error_msg = f'Faltan campos obligatorios: {", ".join(missing_fields)}'
        return jsonify({'success': False, 'message': error_msg}), 400

    conn = get_connection(USER_DB)
    cursor = conn.cursor()
    
    # Verificar si el usuario ya existe
    cursor.execute("SELECT id FROM jugadores WHERE nickname = ?", (username,))
    if cursor.fetchone():
        conn.close()
        return jsonify({'success': False, 'message': 'El nombre de usuario ya existe'}), 409

    # Generar campos requeridos
    user_uuid = str(uuid.uuid4())
    created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    try:
        # 👇 INSERT con los campos EXACTOS de la tabla
        cursor.execute("""
            INSERT INTO jugadores 
            (uuid, nickname, nombre, apellido, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_uuid, 
            username, 
            nombre, 
            apellido, 
            email, 
            hashed_pw, 
            "jugador",  # role tiene valor por defecto pero lo incluimos por claridad
            created_at
        ))
        
        new_id = cursor.lastrowid
        conn.commit()
        print(f"✅ Usuario registrado exitosamente. ID: {new_id}")
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"❌ Error en base de datos: {e}")
        return jsonify({
            'success': False, 
            'message': f'Error al registrar usuario: {str(e)}'
        }), 500
        
    finally:
        conn.close()

    public_id = f"U-{new_id:04d}"
    usuario = {
        'id': public_id,
        'numeric_id': new_id,
        'username': username,
        'email': email,
        'nombre': nombre,
        'apellido': apellido,
        'role': 'jugador'
    }

    # Guardar usuario en sesión
    session['user'] = usuario

    return jsonify({
        'success': True, 
        'usuario': usuario, 
        'message': 'Usuario registrado exitosamente'
    }), 201


# -------------------------------------
# ✔ CHECK SESSION (F5 seguro)
# -------------------------------------
@auth_bp.route('/check-session', methods=['GET'])
def check_session():
    user = session.get("user")
    if user:
        # Verificar que el usuario aún existe en la base de datos
        conn = get_connection(USER_DB)
        cursor = conn.cursor()
        
        if user.get('source_table') == 'presentadores':
            cursor.execute("SELECT id FROM presentadores WHERE id = ?", (user['numeric_id'],))
        else:
            cursor.execute("SELECT id FROM jugadores WHERE id = ?", (user['numeric_id'],))
        
        user_exists = cursor.fetchone()
        conn.close()
        
        if user_exists:
            return jsonify({'success': True, 'usuario': user}), 200
        else:
            session.clear()  # Usuario eliminado, limpiar sesión
    
    return jsonify({'success': False, 'usuario': None}), 200

# -------------------------------------
# 🚪 LOGOUT
# -------------------------------------
@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Sesión cerrada'}), 200
