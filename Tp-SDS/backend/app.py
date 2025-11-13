# app.py - VERSIÓN CORREGIDA
import os
import sys

# Añadir el directorio actual al path de Python
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, render_template
from flask_cors import CORS
from config import Config

# Importar inicialización de base de datos
from database.db import init_db

# Importar rutas
from routes.auth import init_auth_routes
from routes.recetas import init_recetas_routes
from routes.perfil import init_perfil_routes
from routes.logs import init_logs_routes
from routes.game import init_game_routes

def create_app():
    """
    Factory function para crear la aplicación Flask
    """
    app = Flask(__name__)
    
    # Configuración de la aplicación
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['DEBUG'] = True
    
    # Configurar CORS para el frontend
    CORS(app, 
         supports_credentials=Config.CORS_SUPPORTS_CREDENTIALS,
         origins=Config.CORS_ORIGINS,
         methods=Config.CORS_METHODS)
    
    # Registrar blueprints/rutas
    register_routes(app)
    
    # Registrar manejadores de errores
    register_error_handlers(app)
    
    return app

def register_routes(app):
    """
    Registra todas las rutas de la aplicación
    """
    print("🔄 Registrando rutas...")
    
    # Inicializar rutas de autenticación
    init_auth_routes(app)
    print("  ✅ Rutas de autenticación registradas")
    
    # Inicializar rutas de recetas
    init_recetas_routes(app)
    print("  ✅ Rutas de recetas registradas")
    
    # Inicializar rutas de perfil
    init_perfil_routes(app)
    print("  ✅ Rutas de perfil registradas")
    
    # Inicializar rutas de logs
    init_logs_routes(app)
    print("  ✅ Rutas de logs registradas")
    
    # Inicializar rutas del juego
    init_game_routes(app)
    print("  ✅ Rutas del juego registradas")
    
    # Ruta principal - Página de inicio
    @app.route('/')
    def index():
        return render_template('index.html')
    
    # Ruta de salud/status de la API
    @app.route('/api/health')
    def api_health():
        return {
            'status': 'healthy',
            'message': 'API de Recetas Secretas funcionando correctamente',
            'version': '1.0.0'
        }
    
    # Ruta de información del sistema
    @app.route('/api/info')
    def api_info():
        return {
            'app_name': 'Abuela Cripto - Recetas Secretas',
            'description': 'Aplicación educativa con vulnerabilidades de seguridad',
            'version': '1.0.0',
            'vulnerabilities': [
                'SQL Injection',
                'IDOR (Insecure Direct Object References)',
                'Information Disclosure',
                'Broken Access Control',
                'Weak Authentication'
            ],
            'educational_purpose': True
        }

def register_error_handlers(app):
    """
    Registra manejadores de errores personalizados
    """
    
    @app.errorhandler(404)
    def not_found(error):
        return {
            'success': False,
            'message': 'Endpoint no encontrado',
            'error': str(error)
        }, 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return {
            'success': False,
            'message': 'Método no permitido',
            'error': str(error)
        }, 405
    
    @app.errorhandler(500)
    def internal_server_error(error):
        return {
            'success': False,
            'message': 'Error interno del servidor',
            'error': str(error)
        }, 500
    
    @app.errorhandler(Exception)
    def handle_generic_error(error):
        return {
            'success': False,
            'message': 'Error inesperado en el servidor',
            'error': str(error)
        }, 500

def setup_database():
    """
    Configura e inicializa la base de datos
    """
    try:
        print("🔄 Inicializando base de datos...")
        init_db()
        print("✅ Base de datos inicializada correctamente")
    except Exception as e:
        print(f"❌ Error al inicializar la base de datos: {e}")
        raise

def print_routes(app):
    """
    Imprime todas las rutas registradas (útil para debugging)
    """
    print("\n🌐 Rutas de la API disponibles:")
    print("=" * 60)
    for rule in app.url_map.iter_rules():
        methods = ','.join(sorted(rule.methods - {'OPTIONS', 'HEAD'}))
        print(f"{rule.endpoint:35} {methods:25} {rule.rule}")
    print("=" * 60)

if __name__ == '__main__':
    try:
        # Crear la aplicación
        app = create_app()
        
        # Configurar la base de datos
        setup_database()
        
        # Mostrar rutas disponibles (solo en desarrollo)
        print_routes(app)
        
        # Mensaje de inicio
        print("\n🚀 Servidor Abuela Cripto iniciado correctamente!")
        print("📍 Frontend: http://localhost:5173")
        print("📍 Backend:  http://localhost:5000")
        print("📍 API Health: http://localhost:5000/api/health")
        print("📍 API Info: http://localhost:5000/api/info")
        print("\n⚠️  ADVERTENCIA: Esta aplicación contiene vulnerabilidades intencionales")
        print("   para fines educativos. No usar en producción.")
        print("\n📝 Para probar el login usa:")
        print("   Usuario: abuela / Contraseña: abuela123")
        print("   Usuario: admin / Contraseña: ChefObscuro123!")
        print("\n")
        
        # Ejecutar la aplicación
        app.run(
            debug=True, 
            host='0.0.0.0', 
            port=5000,
            threaded=True
        )
        
    except Exception as e:
        print(f"❌ Error crítico al iniciar la aplicación: {e}")
        print("\n🔧 Solución de problemas:")
        print("1. Verifica que todos los archivos .py estén en las carpetas correctas")
        print("2. Asegúrate de tener los archivos __init__.py en cada carpeta")
        print("3. Verifica que no haya errores de sintaxis en los archivos .py")
        input("\nPresiona Enter para salir...")