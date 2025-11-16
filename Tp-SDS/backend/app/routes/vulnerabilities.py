from flask import Blueprint, jsonify
from ..utils.helpers import requires_auth

vuln_bp = Blueprint('vuln', __name__)

@vuln_bp.route('/vulnerabilities')
@requires_auth
def vulnerabilities_info():
    """Información completa sobre las vulnerabilidades implementadas"""
    return jsonify({
        'success': True,
        'vulnerabilities': [
            {
                'id': 1,
                'name': 'SQL Injection - Login',
                'description': 'Inyecta SQL en el formulario de login para bypassear autenticación',
                'locations': ['Login'],
                'difficulty': 'Fácil',
                'points': 100,
                'flag_hash': 'SQL1_FLAG_7x9aB2cD',
                'solution_hint': 'Usa comillas simples para romper la consulta SQL',
                'endpoint': '/game/sql-injection-login',
                'method': 'POST'
            },
            {
                'id': 2,
                'name': 'SQL Injection - Búsqueda',
                'description': 'Inyecta SQL en la búsqueda de recetas para extraer información',
                'locations': ['Búsqueda de recetas'],
                'difficulty': 'Fácil',
                'points': 100,
                'flag_hash': 'SQL2_FLAG_3y8fE1gH',
                'solution_hint': 'Prueba con UNION SELECT para extraer datos',
                'endpoint': '/buscar',
                'method': 'POST'
            },
            {
                'id': 3,
                'name': 'IDOR - Perfiles',
                'description': 'Accede a perfiles de otros usuarios modificando el user_id',
                'locations': ['Perfiles de usuario'],
                'difficulty': 'Medio',
                'points': 150,
                'flag_hash': 'IDOR_FLAG_5z2qW8rT',
                'solution_hint': 'Modifica el parámetro user_id en la URL del perfil',
                'endpoint': '/perfil',
                'method': 'GET'
            },
            {
                'id': 4,
                'name': 'Information Disclosure',
                'description': 'Encuentra información sensible expuesta en los logs del sistema',
                'locations': ['Logs del sistema'],
                'difficulty': 'Fácil',
                'points': 80,
                'flag_hash': 'INFO_FLAG_9m4nX6pL',
                'solution_hint': 'Revisa todos los logs visibles en el dashboard',
                'endpoint': '/logs',
                'method': 'GET'
            },
            {
                'id': 5,
                'name': 'Weak Authentication',
                'description': 'Adivina contraseñas débiles o usa credenciales por defecto',
                'locations': ['Desbloqueo de recetas', 'Login'],
                'difficulty': 'Medio',
                'points': 120,
                'flag_hash': 'WEAK_AUTH_FLAG_1k7jR3sV',
                'solution_hint': 'Prueba contraseñas comunes o credenciales por defecto',
                'endpoint': '/game/weak-authentication',
                'method': 'POST'
            }
        ]
    })