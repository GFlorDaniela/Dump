# app.py
from flask import Flask, jsonify, request, session, render_template
from flask_cors import CORS
import sqlite3
import hashlib
import os
from datetime import datetime
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
CORS(app, supports_credentials=True)

DATABASE = 'data/database.db'

def init_db():
    """Inicializa la base de datos con datos realistas"""
    if not os.path.exists('data'):
        os.makedirs('data')
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Tabla de usuarios
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            email TEXT,
            full_name TEXT
        )
    ''')
    
    # Tabla de recetas
    c.execute('''
        CREATE TABLE IF NOT EXISTS recetas (
            id INTEGER PRIMARY KEY,
            nombre TEXT,
            ingredientes TEXT,
            instrucciones TEXT,
            bloqueada INTEGER DEFAULT 0,
            password_bloqueo TEXT,
            categoria TEXT,
            user_id INTEGER,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Tabla de logs del sistema
    c.execute('''
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            event TEXT,
            details TEXT,
            user_id INTEGER
        )
    ''')
    
    # Insertar datos iniciales
    try:
        # Usuarios
        users_data = [
            (1, 'abuela', 'abuela123', 'user', 'abuela@recetas.com', 'María González'),
            (2, 'admin', 'ChefObscuro123!', 'admin', 'admin@recetas.com', 'Administrador Sistema'),
            (3, 'chef_obscuro', 'DarkChef2024!', 'admin', 'chef@obscuro.com', 'Chef Obscuro'),
            (4, 'juan_perez', 'password123', 'user', 'juan@recetas.com', 'Juan Pérez'),
            (5, 'maria_garcia', 'password123', 'user', 'maria@recetas.com', 'María García')
        ]
        
        for user in users_data:
            c.execute("INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?, ?)", user)
        
        # Recetas
        recetas_data = [
            (1, 'Sopa de Tomate Clásica', 'tomates, cebolla, ajo, albahaca', 'Cocinar a fuego lento por 45 minutos', 0, NULL, 'sopas', 1, '2024-01-01'),
            (2, 'Torta de Chocolate Familiar', 'harina, huevos, chocolate, azúcar', 'Mezclar y hornear a 180° por 30 min', 0, NULL, 'postres', 1, '2024-01-02'),
            (3, 'RECETA SECRETA: Salsa Ancestral', 'INGREDIENTES CLASIFICADOS', 'INSTRUCCIONES SECRETAS - BLOQUEADA POR CHEF OBSCURO', 1, 'S4uc3S3cr3t4!', 'salsas', 1, '2024-01-03'),
            (4, 'Guiso de la Abuela', 'carne, papas, zanahorias, cebolla', 'Guisar por 2 horas a fuego medio', 0, NULL, 'guisos', 1, '2024-01-04'),
            (5, 'RECETA ULTRA SECRETA: Postre Familiar', 'INGREDIENTES ULTRASECRETOS', 'RECETA BLOQUEADA - SOLO PARA FAMILIA', 1, 'P0str3F4m1l14r!', 'postres', 1, '2024-01-05'),
            (6, 'Ensalada de la Casa', 'lechuga, tomate, cebolla, aceite', 'Mezclar todos los ingredientes', 0, NULL, 'ensaladas', 4, '2024-01-06'),
            (7, 'Pasta Carbonara', 'pasta, huevos, panceta, queso', 'Cocinar la pasta y mezclar con la salsa', 0, NULL, 'pastas', 5, '2024-01-07')
        ]
        
        for receta in recetas_data:
            c.execute("INSERT OR IGNORE INTO recetas VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", receta)
        
        # Logs del sistema
        logs_data = [
            (1, '2024-01-15 10:30:00', 'LOGIN', 'Usuario abuela inició sesión', 1),
            (2, '2024-01-15 14:22:00', 'PASSWORD_CHANGE', 'Chef Obscuro cambió contraseña de admin', 3),
            (3, '2024-01-15 14:25:00', 'RECIPE_LOCK', 'Recetas secretas bloqueadas por Chef Obscuro', 3),
            (4, '2024-01-16 09:15:00', 'RECIPE_CREATE', 'Nueva receta creada: Ensalada de la Casa', 4),
            (5, '2024-01-16 11:30:00', 'RECIPE_CREATE', 'Nueva receta creada: Pasta Carbonara', 5)
        ]
        
        for log in logs_data:
            c.execute("INSERT OR IGNORE INTO system_logs VALUES (?, ?, ?, ?, ?)", log)
            
    except sqlite3.IntegrityError:
        pass
    
    conn.commit()
    conn.close()

# API Routes
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # VULNERABILIDAD: SQL Injection
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute(query)
        user = c.fetchone()
        conn.close()
        
        if user:
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['role'] = user[3]
            
            log_event("LOGIN_EXITOSO", f"Usuario {user[1]} inició sesión", user[0])
            
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

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Sesión cerrada'})

@app.route('/api/dashboard')
def api_dashboard():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Recetas no bloqueadas
    c.execute("SELECT * FROM recetas WHERE bloqueada = 0")
    recetas_disponibles = c.fetchall()
    
    # Recetas bloqueadas
    c.execute("SELECT id, nombre FROM recetas WHERE bloqueada = 1")
    recetas_bloqueadas = c.fetchall()
    
    conn.close()
    
    # Convertir a formato JSON
    recetas_json = []
    for receta in recetas_disponibles:
        recetas_json.append({
            'id': receta[0],
            'nombre': receta[1],
            'ingredientes': receta[2],
            'instrucciones': receta[3],
            'bloqueada': bool(receta[4]),
            'categoria': receta[6],
            'user_id': receta[7],
            'created_at': receta[8]
        })
    
    bloqueadas_json = []
    for receta in recetas_bloqueadas:
        bloqueadas_json.append({
            'id': receta[0],
            'nombre': receta[1]
        })
    
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

@app.route('/api/recetas')
def api_recetas():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM recetas WHERE bloqueada = 0")
    recetas = c.fetchall()
    conn.close()
    
    recetas_json = []
    for receta in recetas:
        recetas_json.append({
            'id': receta[0],
            'nombre': receta[1],
            'ingredientes': receta[2],
            'instrucciones': receta[3],
            'bloqueada': bool(receta[4]),
            'categoria': receta[6],
            'user_id': receta[7],
            'created_at': receta[8]
        })
    
    return jsonify({'success': True, 'recetas': recetas_json})

@app.route('/api/receta/<int:receta_id>')
def api_receta(receta_id):
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM recetas WHERE id = ?", (receta_id,))
    receta = c.fetchone()
    conn.close()
    
    if not receta:
        return jsonify({'success': False, 'message': 'Receta no encontrada'})
    
    receta_json = {
        'id': receta[0],
        'nombre': receta[1],
        'ingredientes': receta[2],
        'instrucciones': receta[3],
        'bloqueada': bool(receta[4]),
        'categoria': receta[6],
        'user_id': receta[7],
        'created_at': receta[8]
    }
    
    return jsonify({'success': True, 'receta': receta_json})

@app.route('/api/desbloquear_receta/<int:receta_id>', methods=['POST'])
def api_desbloquear_receta(receta_id):
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    data = request.get_json()
    password = data.get('password', '')
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM recetas WHERE id = ?", (receta_id,))
    receta = c.fetchone()
    conn.close()
    
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
            'categoria': receta[6],
            'user_id': receta[7],
            'created_at': receta[8]
        }
        
        # Si es la última receta secreta, mostrar el FLAG
        if receta_id == 5:
            flag = hashlib.md5("abuela_recetas_recuperadas".encode()).hexdigest()
            return jsonify({
                'success': True, 
                'receta': receta_json,
                'flag': f"CTF{{{flag}}}"
            })
        
        return jsonify({'success': True, 'receta': receta_json})
    else:
        return jsonify({'success': False, 'message': 'Contraseña incorrecta'})

# VULNERABILIDAD: IDOR - Puedes ver cualquier perfil
@app.route('/api/perfil')
def api_perfil():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    user_id = request.args.get('user_id', session.get('user_id'))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    usuario = c.fetchone()
    conn.close()
    
    if usuario:
        return jsonify({
            'success': True,
            'usuario': {
                'id': usuario[0],
                'username': usuario[1],
                'role': usuario[3],
                'email': usuario[4],
                'full_name': usuario[5]
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Usuario no encontrado'})

# VULNERABILIDAD: Broken Access Control - Cualquier usuario puede ver logs
@app.route('/api/logs')
def api_logs():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 10")
    logs = c.fetchall()
    conn.close()
    
    logs_json = []
    for log in logs:
        logs_json.append({
            'id': log[0],
            'timestamp': log[1],
            'event': log[2],
            'details': log[3],
            'user_id': log[4]
        })
    
    return jsonify({'success': True, 'logs': logs_json})

@app.route('/api/buscar', methods=['POST'])
def api_buscar():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
    
    data = request.get_json()
    busqueda = data.get('busqueda', '')
    
    # VULNERABILIDAD: SQL Injection en búsqueda
    query = f"SELECT * FROM recetas WHERE (nombre LIKE '%{busqueda}%' OR ingredientes LIKE '%{busqueda}%') AND bloqueada = 0"
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    try:
        c.execute(query)
        recetas = c.fetchall()
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error en la búsqueda: {str(e)}'})
    conn.close()
    
    recetas_json = []
    for receta in recetas:
        recetas_json.append({
            'id': receta[0],
            'nombre': receta[1],
            'ingredientes': receta[2],
            'instrucciones': receta[3],
            'bloqueada': bool(receta[4]),
            'categoria': receta[6],
            'user_id': receta[7],
            'created_at': receta[8]
        })
    
    return jsonify({'success': True, 'recetas': recetas_json})

def log_event(event_type, details, user_id):
    """Función para logear eventos del sistema"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    c.execute("INSERT INTO system_logs (timestamp, event, details, user_id) VALUES (?, ?, ?, ?)",
              (timestamp, event_type, details, user_id))
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)