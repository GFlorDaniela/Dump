from flask import Blueprint, jsonify
from ..utils.helpers import requires_auth
from app.utils.Vulnerabilities import VULNERABILITIES as Vulnerabilities

vuln_bp = Blueprint('vuln', __name__)

@vuln_bp.route('/vulnerabilities')
@requires_auth
def vulnerabilities_info():
    """Información completa sobre las vulnerabilidades implementadas"""
    return jsonify({
        'success': True,
        'vulnerabilities':Vulnerabilities
    })