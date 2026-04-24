from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import jwt
import bcrypt
import sqlite3
import json
import os
from functools import wraps

import database
from diet_engine import generate_diet_plan

app = Flask(__name__, static_folder="../frontend")
CORS(app)

JWT_SECRET = 'super-secret-fatloss-key-2026'

# Initialize database
database.init_db()

def authenticate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.user = data
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 403
            
        return f(*args, **kwargs)
    return decorated

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400

    conn = database.get_db_connection()
    try:
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        cur = conn.cursor()
        cur.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
                    (name, email, hashed.decode('utf-8')))
        conn.commit()
        user_id = cur.lastrowid
        return jsonify({'message': 'User registered successfully', 'userId': user_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 400
    except Exception as e:
        return jsonify({'error': 'Server error'}), 500
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = database.get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'Invalid email or password'}), 400

    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 400

    token = jwt.encode({'id': user['id'], 'name': user['name']}, JWT_SECRET, algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': {'id': user['id'], 'name': user['name'], 'email': user['email']}
    })

@app.route('/api/profile', methods=['GET'])
@authenticate_token
def get_profile():
    conn = database.get_db_connection()
    profile = conn.execute('SELECT * FROM health_profiles WHERE user_id = ?', (request.user['id'],)).fetchone()
    conn.close()
    
    if profile:
        profile_dict = dict(profile)
        # Parse the JSON string back to dict so frontend gets correct structure format
        if 'generated_plan' in profile_dict and profile_dict['generated_plan']:
            try:
                profile_dict['generated_plan'] = json.loads(profile_dict['generated_plan'])
            except json.JSONDecodeError:
                pass
        return jsonify({'profile': profile_dict})
    return jsonify({'profile': None})

@app.route('/api/profile', methods=['POST'])
@authenticate_token
def save_profile():
    data = request.json
    
    generated_plan = generate_diet_plan(data)
    plan_json = json.dumps(generated_plan)

    conn = database.get_db_connection()
    row = conn.execute('SELECT id FROM health_profiles WHERE user_id = ?', (request.user['id'],)).fetchone()
    
    try:
        if row:
            conn.execute('''
                UPDATE health_profiles 
                SET age = ?, weight = ?, height = ?, activity_level = ?, goal = ?, 
                    region = ?, disease = ?, generated_plan = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            ''', (data.get('age'), data.get('weight'), data.get('height'), data.get('activity_level'),
                  data.get('goal'), data.get('region'), data.get('disease'), plan_json, request.user['id']))
        else:
            conn.execute('''
                INSERT INTO health_profiles (user_id, age, weight, height, activity_level, goal, region, disease, generated_plan)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (request.user['id'], data.get('age'), data.get('weight'), data.get('height'), 
                  data.get('activity_level'), data.get('goal'), data.get('region'), data.get('disease'), plan_json))
        
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500
        
    conn.close()
    
    return jsonify({
        'message': 'Profile saved and plan generated successfully',
        'plan': generated_plan
    })

if __name__ == '__main__':
    app.run(port=3000, debug=True)
