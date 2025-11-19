import os
import sys

# Añadir el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import create_app

if __name__ == '__main__':
    app = create_app()

    print("=== Servidor Abuela Cripto iniciado correctamente! ===")
    print("📍 Frontend: http://localhost:5173")
    print("📍 Backend: http://localhost:5000")
    print("📍 API Health: http://localhost:5000/api/health")
    print("\n⚠️  ADVERTENCIA: Esta aplicación contiene vulnerabilidades intencionales")
    print("   para fines educativos. No usar en producción.")
    
    print("\n🔑 Credenciales de prueba:")
    print("   👵 Presentadora: Daniela / 94477Despeñadero")
    print("   👨‍🦳 Usuario vulnerable: abuela / abuela123")
    print("   👨‍💼 Admin vulnerable: admin / ChefObscuro123!")
    
    print("\n🏆 Flags predefinidas para testing:")
    print("   • SQL Injection: SQL1_FLAG_7x9aB2cD")
    print("   • IDOR: IDOR_FLAG_5z2qW8rT") 
    print("   • Information Disclosure: INFO_FLAG_9m4nX6pL")
    print("   • Weak Authentication: WEAK_AUTH_FLAG_1k7jR3sV")
    print("\n")

    app.run(debug=True, host='0.0.0.0', port=5000)