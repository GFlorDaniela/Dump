# config.py
import os
import secrets

class Config:
    SECRET_KEY = secrets.token_hex(32)
    DATABASE = 'data/database.db'
    CORS_ORIGINS = ["http://localhost:5173"]
    CORS_METHODS = ["GET", "POST", "PUT", "DELETE"]
    CORS_SUPPORTS_CREDENTIALS = True