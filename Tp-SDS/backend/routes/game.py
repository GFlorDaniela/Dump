# routes/game.py
from flask import jsonify, request
from database.db import get_db_connection
from utils.helpers import requires_auth, update_leaderboard
from datetime import datetime
import uuid

def init_game_routes(app):
    
    @app.route('/api/game/roles')
    def api_game_roles():
        """Endpoint para obtener los roles disponibles"""
        return jsonify({
            'success': True,
            'roles': [
                {
                    'id': 'presentador',
                    'name': '🎤 Presentador',
                    'description': 'Modera el juego y sigue el progreso de los jugadores'
                },
                {
                    'id': 'jugador', 
                    'name': '🎮 Jugador',
                    'description': 'Participa en el desafío encontrando vulnerabilidades'
                }
            ]
        })

    @app.route('/api/game/register', methods=['POST'])
    def api_game_register():
        data = request.get_json()
        nickname = data.get('nickname')
        nombre = data.get('nombre')
        apellido = data.get('apellido')
        email = data.get('email')
        role = data.get('role', 'jugador')
        
        if not nickname or not nombre or not apellido or not email or not role:
            return jsonify({'success': False, 'message': 'Todos los campos son requeridos'})
        
        if role not in ['presentador', 'jugador']:
            return jsonify({'success': False, 'message': 'Rol inválido'})
        
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            
            # Verificar si el nickname ya existe
            c.execute("SELECT id FROM game_players WHERE nickname = ?", (nickname,))
            if c.fetchone():
                return jsonify({'success': False, 'message': 'Nickname ya existe'})
            
            # Verificar si el email ya existe
            c.execute("SELECT id FROM game_players WHERE email = ?", (email,))
            if c.fetchone():
                return jsonify({'success': False, 'message': 'Email ya registrado'})
            
            # Crear nuevo jugador con UUID
            player_uuid = str(uuid.uuid4())
            created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            c.execute(
                "INSERT INTO game_players (uuid, nickname, nombre, apellido, email, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (player_uuid, nickname, nombre, apellido, email, role, created_at)
            )
            player_id = c.lastrowid
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'player': {
                    'id': player_id,
                    'uuid': player_uuid,
                    'nickname': nickname,
                    'nombre': nombre,
                    'apellido': apellido,
                    'email': email,
                    'role': role,
                    'total_score': 0,
                    'created_at': created_at
                }
            })
            
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/game/submit-flag', methods=['POST'])
    @requires_auth
    def api_game_submit_flag():
        data = request.get_json()
        player_id = data.get('player_id')
        flag_hash = data.get('flag_hash')
        
        if not player_id or not flag_hash:
            return jsonify({'success': False, 'message': 'Datos incompletos'})
        
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            
            # Verificar si la flag existe y no ha sido completada
            c.execute("SELECT * FROM vulnerabilities WHERE flag_hash = ?", (flag_hash,))
            vulnerability = c.fetchone()
            
            if not vulnerability:
                return jsonify({'success': False, 'message': 'Flag inválida'})
            
            # Verificar si ya completó esta vulnerabilidad
            c.execute(
                "SELECT id FROM game_flags WHERE player_id = ? AND flag_hash = ?", 
                (player_id, flag_hash)
            )
            if c.fetchone():
                return jsonify({'success': False, 'message': 'Ya completaste esta vulnerabilidad'})
            
            # Registrar la flag completada
            completed_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            c.execute(
                "INSERT INTO game_flags (player_id, vulnerability_type, flag_hash, points, completed_at) VALUES (?, ?, ?, ?, ?)",
                (player_id, vulnerability[1], flag_hash, vulnerability[4], completed_at)
            )
            
            # Actualizar puntuación total del jugador
            c.execute(
                "UPDATE game_players SET total_score = total_score + ?, last_activity = ? WHERE id = ?",
                (vulnerability[4], completed_at, player_id)
            )
            
            # Actualizar leaderboard
            update_leaderboard()
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': f'¡Vulnerabilidad {vulnerability[1]} completada! +{vulnerability[4]} puntos',
                'points': vulnerability[4],
                'vulnerability': vulnerability[1]
            })
            
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/game/leaderboard')
    @requires_auth
    def api_game_leaderboard():
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            
            c.execute("""
                SELECT gp.id, gp.nickname, gp.total_score, l.position, l.last_updated,
                       (SELECT COUNT(*) FROM game_flags WHERE player_id = gp.id) as flags_completed
                FROM leaderboard l
                JOIN game_players gp ON l.player_id = gp.id
                ORDER BY l.position
                LIMIT 10
            """)
            leaderboard = c.fetchall()
            
            leaderboard_data = []
            for player in leaderboard:
                leaderboard_data.append({
                    'id': player[0],
                    'position': player[3],
                    'nickname': player[1],
                    'total_score': player[2],
                    'flags_completed': player[4],
                    'last_updated': player[5]
                })
            
            return jsonify({'success': True, 'leaderboard': leaderboard_data})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/game/player-stats/<int:player_id>')
    @requires_auth
    def api_game_player_stats(player_id):
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            
            # Stats del jugador
            c.execute("""
                SELECT gp.nickname, gp.total_score, gp.created_at, gp.last_activity,
                       COUNT(gf.id) as flags_completed
                FROM game_players gp
                LEFT JOIN game_flags gf ON gp.id = gf.player_id
                WHERE gp.id = ?
                GROUP BY gp.id
            """, (player_id,))
            player_stats = c.fetchone()
            
            # Vulnerabilidades completadas
            c.execute("""
                SELECT vulnerability_type, points, completed_at 
                FROM game_flags 
                WHERE player_id = ? 
                ORDER BY completed_at
            """, (player_id,))
            completed_vulns = c.fetchall()
            
            if not player_stats:
                return jsonify({'success': False, 'message': 'Jugador no encontrado'})
            
            return jsonify({
                'success': True,
                'stats': {
                    'nickname': player_stats[0],
                    'total_score': player_stats[1],
                    'created_at': player_stats[2],
                    'last_activity': player_stats[3],
                    'flags_completed': player_stats[4]
                },
                'completed_vulnerabilities': [
                    {
                        'type': vuln[0],
                        'points': vuln[1],
                        'completed_at': vuln[2]
                    } for vuln in completed_vulns
                ]
            })
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/game/vulnerabilities')
    @requires_auth
    def api_game_vulnerabilities():
        """Endpoint para obtener la lista de vulnerabilidades disponibles"""
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            
            c.execute("SELECT name, description, difficulty, points, solution_hint FROM vulnerabilities")
            vulnerabilities = c.fetchall()
            
            vulns_data = []
            for vuln in vulnerabilities:
                vulns_data.append({
                    'name': vuln[0],
                    'description': vuln[1],
                    'difficulty': vuln[2],
                    'points': vuln[3],
                    'hint': vuln[4]
                })
            
            return jsonify({'success': True, 'vulnerabilities': vulns_data})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()

    @app.route('/api/game/players')
    @requires_auth
    def api_game_players():
        """Endpoint para presentadores - ver todos los jugadores"""
        conn = None
        try:
            conn = get_db_connection()
            c = conn.cursor()
            
            c.execute("""
                SELECT uuid, nickname, nombre, apellido, email, role, total_score, created_at, last_activity
                FROM game_players 
                ORDER BY total_score DESC, last_activity DESC
            """)
            players = c.fetchall()
            
            players_data = []
            for player in players:
                players_data.append({
                    'uuid': player[0],
                    'nickname': player[1],
                    'nombre': player[2],
                    'apellido': player[3],
                    'email': player[4],
                    'role': player[5],
                    'total_score': player[6],
                    'created_at': player[7],
                    'last_activity': player[8]
                })
            
            return jsonify({'success': True, 'players': players_data})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'})
        finally:
            if conn:
                conn.close()