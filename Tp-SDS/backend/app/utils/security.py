import bcrypt
import secrets

def hash_password(password):
    """Hash seguro para contraseñas"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    """Verificar contraseña hasheada"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def generate_player_token():
    """Generar token seguro para jugadores"""
    return secrets.token_urlsafe(32)