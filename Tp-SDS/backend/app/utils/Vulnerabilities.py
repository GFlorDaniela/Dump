VULNERABILITIES = [
    # ============================================================
    # 🔥 VULNERABILIDADES ORIGINALES (sin las viejas de SQLi)
    # ============================================================

    {
        'id': 1,
        'name': 'IDOR - Perfiles',
        'description': 'Accede a perfiles de otros usuarios modificando el user_id',
        'difficulty': 'Medio',
        'points': 150,
        'flag_hash': 'IDOR_FLAG_5z2qW8rT',
        'solution_hint': 'Modifica el parámetro user_id en la URL del perfil'
    },
    {
        'id': 2,
        'name': 'Information Disclosure',
        'description': 'Encuentra información sensible expuesta en los logs del sistema',
        'difficulty': 'Fácil',
        'points': 80,
        'flag_hash': 'INFO_FLAG_9m4nX6pL',
        'solution_hint': 'Revisa todos los logs visibles'
    },
    {
        'id': 3,
        'name': 'Weak Authentication',
        'description': 'Adivina contraseñas débiles o usa credenciales por defecto',
        'difficulty': 'Medio',
        'points': 120,
        'flag_hash': 'WEAK_AUTH_FLAG_1k7jR3sV',
        'solution_hint': 'Prueba contraseñas comunes o credenciales por defecto'
    },

    # ============================================================
    # 🔥 NUEVAS VULNERABILIDADES SQL INJECTION (LAS 4 FINALES)
    # ============================================================

    {
        'id': 4,
        'name': 'SQL Injection - Login Bypass',
        'description': 'Permite saltarse el login inyectando SQL en usuario o contraseña.',
        'difficulty': 'Fácil',
        'points': 150,
        'flag_hash': 'b315f8fae0de3d257a4a9f2dbf7c9334',
        'solution_hint': "Proba ingresar: ' OR '1'='1"
    },
    {
        'id': 5,
        'name': 'SQL Injection - Recetas Ocultas',
        'description': 'Inyecta SQL en los filtros de búsqueda para acceder a recetas ocultas.',
        'difficulty': 'Medio',
        'points': 180,
        'flag_hash': 'f8e6d0c9547ebf47b4cb7b571f89c623',
        'solution_hint': "Proba filtrar con: %' OR 1=1 --"
    },
    {
        'id': 6,
        'name': 'SQL Injection - UNION Data Extract',
        'description': 'Explotá UNION SELECT para recuperar datos de otras tablas.',
        'difficulty': 'Difícil',
        'points': 220,
        'flag_hash': '872a0a4424dcd7f374a3fd01d2b07b48',
        'solution_hint': "Intentá: ' UNION SELECT username, password FROM users --"
    },
    {
        'id': 7,
        'name': 'SQL Injection - Blind Boolean',
        'description': 'Inyección SQL ciega utilizando respuestas booleanas.',
        'difficulty': 'Avanzado',
        'points': 250,
        'flag_hash': '2a653b5d4685f87939edfae035964fcf',
        'solution_hint': "Testea respuesta con: ' AND 1=1 -- vs ' AND 1=2 --"
    },
     # ============================================================
    # 🔥 NUEVAS VULNERABILIDADES IDOR AVANZADAS (ENFOCADAS EN RECETAS)
    # ============================================================

    {
        'id': 8,
        'name': 'IDOR - Bloqueo de Recetas Ajenas',
        'description': 'Bloquea recetas de otros usuarios estableciendo contraseñas sin autorización.',
        'difficulty': 'Medio',
        'points': 200,
        'flag_hash': 'a7d8f9e0b1c2d3e4f5a6b7c8d9e0f1a2',
        'solution_hint': 'Encuentra el endpoint para bloquear recetas y prueba con IDs de otros usuarios'
    },
    {
        'id': 9,
        'name': 'IDOR - Acceso a Recetas Privadas',
        'description': 'Accede a recetas marcadas como privadas de otros usuarios mediante ID manipulation.',
        'difficulty': 'Medio',
        'points': 180,
        'flag_hash': 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
        'solution_hint': 'Las recetas privadas también tienen IDs secuenciales - prueba enumeración'
    },
    {
        'id': 10,
        'name': 'IDOR - Cambio de Contraseña de Usuario',
        'description': 'Cambia la contraseña de otros usuarios sin autorización.',
        'difficulty': 'Alto',
        'points': 300,
        'flag_hash': 'd7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        'solution_hint': 'Busca endpoints de cambio de contraseña y prueba con IDs de otros usuarios'
    },
    {
        'id': 11,
        'name': 'IDOR - Eliminación de Recetas Ajenas',
        'description': 'Elimina recetas de otros usuarios sin autorización.',
        'difficulty': 'Alto',
        'points': 280,
        'flag_hash': 'e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
        'solution_hint': 'Busca endpoints DELETE de recetas y prueba con IDs que no te pertenecen'
    }
]
