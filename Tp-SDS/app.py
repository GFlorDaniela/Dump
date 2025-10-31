from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
import hashlib
import os
import subprocess
import re
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'supersecretkey_abuela_123'
DATABASE = 'data/database.db'

def init_db():
    """Inicializa la base de datos con datos realistas"""
    if not os.path.exists('data'):
        os.makedirs('data')
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Tabla de usuarios (el Chef Obscuro cambió las contraseñas)
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            email TEXT
        )
    ''')
    
    # Tabla de recetas (algunas bloqueadas por el Chef Obscuro)
    c.execute('''
        CREATE TABLE IF NOT EXISTS recetas (
            id INTEGER PRIMARY KEY,
            nombre TEXT,
            ingredientes TEXT,
            instrucciones TEXT,
            bloqueada INTEGER DEFAULT 0,
            password_bloqueo TEXT,
            categoria TEXT
        )
    ''')
    
    # Tabla de logs del sistema
    c.execute('''
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            event TEXT,
            details TEXT
        )
    ''')
    
    # Insertar datos iniciales
    try:
        # Usuarios - El Chef Obscuro cambió la contraseña de admin
        c.execute("INSERT OR IGNORE INTO users VALUES (1, 'abuela', 'abuela123', 'user', 'abuela@recetas.com')")
        c.execute("INSERT OR IGNORE INTO users VALUES (2, 'admin', 'ChefObscuro123!', 'admin', 'admin@recetas.com')")  # Contraseña cambiada
        c.execute("INSERT OR IGNORE INTO users VALUES (3, 'chef_obscuro', 'DarkChef2024!', 'admin', 'chef@obscuro.com')")
        
        # Recetas - Algunas bloqueadas por el Chef Obscuro
        c.execute("INSERT OR IGNORE INTO recetas VALUES (1, 'Sopa de Tomate Clásica', 'tomates, cebolla, ajo, albahaca', 'Cocinar a fuego lento por 45 minutos', 0, NULL, 'sopas')")
        c.execute("INSERT OR IGNORE INTO recetas VALUES (2, 'Torta de Chocolate Familiar', 'harina, huevos, chocolate, azúcar', 'Mezclar y hornear a 180° por 30 min', 0, NULL, 'postres')")
        c.execute("INSERT OR IGNORE INTO recetas VALUES (3, 'RECETA SECRETA: Salsa Ancestral', 'INGREDIENTES CLASIFICADOS', 'INSTRUCCIONES SECRETAS - BLOQUEADA POR CHEF OBSCURO', 1, 'S4uc3S3cr3t4!', 'salsas')")
        c.execute("INSERT OR IGNORE INTO recetas VALUES (4, 'Guiso de la Abuela', 'carne, papas, zanahorias, cebolla', 'Guisar por 2 horas a fuego medio', 0, NULL, 'guisos')")
        c.execute("INSERT OR IGNORE INTO recetas VALUES (5, 'RECETA ULTRA SECRETA: Postre Familiar', 'INGREDIENTES ULTRASECRETOS', 'RECETA BLOQUEADA - SOLO PARA FAMILIA', 1, 'P0str3F4m1l14r!', 'postres')")
        
        # Logs del sistema
        c.execute("INSERT OR IGNORE INTO system_logs VALUES (1, '2024-01-15 10:30:00', 'LOGIN', 'Usuario abuela inició sesión')")
        c.execute("INSERT OR IGNORE INTO system_logs VALUES (2, '2024-01-15 14:22:00', 'PASSWORD_CHANGE', 'Chef Obscuro cambió contraseña de admin')")
        c.execute("INSERT OR IGNORE INTO system_logs VALUES (3, '2024-01-15 14:25:00', 'RECIPE_LOCK', 'Recetas secretas bloqueadas por Chef Obscuro')")
        
    except sqlite3.IntegrityError:
        pass
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        # VULNERABILIDAD 1: SQL Injection en login
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
                
                # Log el login exitoso
                log_event(f"LOGIN_EXITOSO", f"Usuario {user[1]} inició sesión")
                
                flash('¡Bienvenida de vuelta, Abuela!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Credenciales incorrectas. ¿Olvidaste tu contraseña?', 'error')
        except Exception as e:
            flash('Error en el sistema. Contacta al administrador.', 'error')
    
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Obtener recetas no bloqueadas
    c.execute("SELECT * FROM recetas WHERE bloqueada = 0")
    recetas_disponibles = c.fetchall()
    
    # Obtener recetas bloqueadas (solo nombres para mostrar que están bloqueadas)
    c.execute("SELECT id, nombre FROM recetas WHERE bloqueada = 1")
    recetas_bloqueadas = c.fetchall()
    
    conn.close()
    
    return render_template('dashboard.html', 
                         recetas=recetas_disponibles, 
                         bloqueadas=recetas_bloqueadas,
                         username=session.get('username'))

@app.route('/recetas')
def recetas():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    conn = sqlite3.connect(DATABASE)  # Corregí el typo "0M7MM8G"
    c = conn.cursor()
    
    # Obtener todas las recetas no bloqueadas
    c.execute("SELECT * FROM recetas WHERE bloqueada = 0")  # "recetas" no "receta"
    recetas_disponibles = c.fetchall()  # Corregí el nombre de la variable
    
    conn.close()
    
    return render_template('recetas.html',
                         recetas=recetas_disponibles,  # Corregí los nombres
                         username=session.get('username'))

@app.route('/buscar_recetas', methods=['GET', 'POST'])
def buscar_recetas():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    recetas = []
    if request.method == 'POST':
        busqueda = request.form.get('busqueda', '')
        
        # VULNERABILIDAD 2: SQL Injection en búsqueda
        query = f"SELECT * FROM recetas WHERE (nombre LIKE '%{busqueda}%' OR ingredientes LIKE '%{busqueda}%') AND bloqueada = 0"
        
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        try:
            c.execute(query)
            recetas = c.fetchall()
        except Exception as e:
            # VULNERABILIDAD: Information Disclosure en errores
            flash(f'Error en la búsqueda: {str(e)}', 'error')
        conn.close()
    
    return render_template('buscar_recetas.html', recetas=recetas)

@app.route('/ver_receta/<int:receta_id>')
def ver_receta(receta_id):
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM recetas WHERE id = ?", (receta_id,))
    receta = c.fetchone()
    conn.close()
    
    if not receta:
        flash('Receta no encontrada', 'error')
        return redirect(url_for('dashboard'))
    
    # Si la receta está bloqueada, pedir contraseña
    if receta[4] == 1:  # bloqueada = 1
        return redirect(url_for('desbloquear_receta', receta_id=receta_id))
    
    return render_template('ver_receta.html', receta=receta)

@app.route('/desbloquear_receta/<int:receta_id>', methods=['GET', 'POST'])
def desbloquear_receta(receta_id):
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM recetas WHERE id = ?", (receta_id,))
    receta = c.fetchone()
    conn.close()
    
    if not receta:
        flash('Receta no encontrada', 'error')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        password = request.form.get('password', '')
        
        # VULNERABILIDAD 3: Verificación débil de contraseña
        if password == receta[5]:  # password_bloqueo
            # ¡Receta desbloqueada!
            session[f'receta_{receta_id}_desbloqueada'] = True
            
            # Si es la última receta secreta, mostrar el FLAG
            if receta_id == 5:  # La receta ultra secreta
                flag = hashlib.md5("abuela_recetas_recuperadas".encode()).hexdigest()
                session['flag_encontrado'] = f"CTF{{{flag}}}"
                return render_template('flag_encontrado.html', 
                                    receta=receta, 
                                    flag=session['flag_encontrado'])
            
            return render_template('ver_receta.html', receta=receta)
        else:
            flash('Contraseña incorrecta. El Chef Obscuro ha bloqueado esta receta.', 'error')
    
    return render_template('desbloquear_receta.html', receta=receta)

@app.route('/perfil')
def perfil():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    # VULNERABILIDAD 4: IDOR - Puedes ver cualquier perfil
    user_id = request.args.get('user_id', session.get('user_id'))
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    usuario = c.fetchone()
    conn.close()
    
    if usuario:
        return render_template('perfil.html', usuario=usuario)
    else:
        flash('Usuario no encontrado', 'error')
        return redirect(url_for('dashboard'))

@app.route('/logs_sistema')
def logs_sistema():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    # VULNERABILIDAD 5: Broken Access Control - Cualquier usuario puede ver logs
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 10")
    logs = c.fetchall()
    conn.close()
    
    return render_template('logs_sistema.html', logs=logs)

@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'POST':
        email = request.form.get('email', '')
        
        # VULNERABILIDAD 6: Information Disclosure - Revela si un email existe
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE email = ?", (email,))
        usuario = c.fetchone()
        conn.close()
        
        if usuario:
            flash(f'Se ha enviado un enlace de recuperación a {email}', 'success')
            # En un caso real, aquí se enviaría un email
        else:
            flash('Email no encontrado en el sistema', 'error')
    
    return render_template('reset_password.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Has cerrado sesión', 'info')
    return redirect(url_for('index'))

def log_event(event_type, details):
    """Función para logear eventos del sistema"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    c.execute("INSERT INTO system_logs (timestamp, event, details) VALUES (?, ?, ?)",
              (timestamp, event_type, details))
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)