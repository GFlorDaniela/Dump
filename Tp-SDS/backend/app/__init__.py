from flask import Flask
from flask_cors import CORS
from .config import Config
from .models.database import init_databases, seed_vulnerabilities_db

# Importar Blueprints
from .routes.auth import auth_bp
from .routes.game import game_bp
from .routes.recetas import recetas_bp
from .routes.logs import logs_bp
from .routes.perfil import perfil_bp
from .routes.presentadores import presentadores_bp
from .routes.vulnerabilities import vuln_bp
from .routes.dashboard import dashboard_bp  # dashboard

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Inicializar CORS
    CORS(app, supports_credentials=True, origins=Config.CORS_ORIGINS)
    
    # Inicializar bases de datos
    with app.app_context():
        init_databases()
    
    # --- Registrar Blueprints ---
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(game_bp, url_prefix='/api/game')
    app.register_blueprint(recetas_bp, url_prefix='/api')
    app.register_blueprint(logs_bp, url_prefix='/api')
    app.register_blueprint(perfil_bp, url_prefix='/api')
    app.register_blueprint(presentadores_bp, url_prefix='/api/presentador')
    app.register_blueprint(vuln_bp, url_prefix='/api/vulnerabilities')
    app.register_blueprint(dashboard_bp, url_prefix='/api')  # Dashboard
    
    # Rutas básicas
    register_basic_routes(app)
    register_error_handlers(app)
    
    return app


def register_basic_routes(app):
    @app.route('/')
    def index():
        return {'message': 'API Abuela Cripto - CTF Educativo'}

    @app.route('/api/health')
    def api_health():
        return {
            'status': 'healthy',
            'message': 'API de Recetas Secretas funcionando correctamente',
            'version': '1.0.0'
        }

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
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'message': 'Endpoint no encontrado'}, 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return {'success': False, 'message': 'Método no permitido'}, 405

    @app.errorhandler(500)
    def internal_error(error):
        return {'success': False, 'message': 'Error interno del servidor'}, 500
