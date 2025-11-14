from flask import Blueprint
from ..utils.helpers import requires_auth

vuln_bp = Blueprint('vuln', __name__)

@vuln_bp.route('/info')
@requires_auth
def vulnerabilities_info():
    """Información sobre las vulnerabilidades implementadas"""
    return {
        'success': True,
        'vulnerabilities': [
            {
                'name': 'SQL Injection',
                'description': 'Inyección de código SQL malicioso',
                'locations': ['Login', 'Búsqueda de recetas'],
                'difficulty': 'Fácil'
            },
            {
                'name': 'IDOR',
                'description': 'Acceso a recursos sin verificación de permisos',
                'locations': ['Perfiles de usuario'],
                'difficulty': 'Medio'
            },
            {
                'name': 'Information Disclosure',
                'description': 'Exposición de información sensible',
                'locations': ['Logs del sistema'],
                'difficulty': 'Fácil'
            },
            {
                'name': 'Weak Authentication',
                'description': 'Autenticación débil o inexistente',
                'locations': ['Desbloqueo de recetas'],
                'difficulty': 'Medio'
            }
        ]
    }