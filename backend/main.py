#!/usr/bin/env python3
from flask import Flask, jsonify, request
from flask_cors import CORS
from flasgger import Swagger
import os
import sys
import subprocess
import tempfile
import shutil
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.yaml_loader import AppsConfig
from utils.nginx_gen import NginxConfigGenerator
from utils.systemd_control import SystemdController
from config.bootstrap import initialize_bootstrap_config, get_bootstrap_config
from database.connection import init_database
from auth.providers.factory import AuthProviderFactory
from auth.session_manager import SessionManager
from auth.api_key_manager import APIKeyManager
from auth.middleware import init_auth_middleware
from auth.decorators import (
    auth_required, admin_required, require_permissions, 
    validate_json_content, require_fields, auth_rate_limit
)
from database.models.user import User
from database.models.api_key import ApiKey

app = Flask(__name__)
CORS(app)

# Initialize bootstrap configuration
initialize_bootstrap_config()
bootstrap_config = get_bootstrap_config()

# Set Flask secret key from bootstrap config
app.config['SECRET_KEY'] = bootstrap_config.get_app_secret_key()

# Set up comprehensive logging
logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(logs_dir, exist_ok=True)

# Choose log file based on debug mode
if app.debug:
    log_file = os.path.join(logs_dir, 'forgeboard-debug.log')
    log_level = logging.DEBUG
    startup_msg = 'ForgeBoard debug startup'
else:
    log_file = os.path.join(logs_dir, 'forgeboard.log')
    log_level = logging.INFO
    startup_msg = 'ForgeBoard startup'

# Set up file handler
file_handler = RotatingFileHandler(
    log_file,
    maxBytes=10240000,  # 10MB
    backupCount=10
)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(log_level)

# Configure both app logger and root logger to capture all activity
app.logger.addHandler(file_handler)
app.logger.setLevel(log_level)

# Also configure werkzeug logger to capture HTTP requests
werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.addHandler(file_handler)
werkzeug_logger.setLevel(log_level)

# Configure root logger to capture any other logs
root_logger = logging.getLogger()
root_logger.addHandler(file_handler)
root_logger.setLevel(log_level)

app.logger.info(startup_msg)

# Initialize database
init_database(app)

# Initialize authentication
auth_config = {
    'password': {
        'min_length': 8,
        'require_uppercase': True,
        'require_lowercase': True,
        'require_numbers': True,
        'require_special': False
    },
    'security': {
        'max_login_attempts': 5,
        'lockout_duration': 300,
        'password_reset_expiry': 3600
    },
    'session_timeout': 86400,
    'refresh_timeout': 604800,
    'refresh_enabled': True,
    'api_keys': {
        'enabled': True,
        'max_per_user': 5,
        'default_expiry': None
    }
}

# Initialize authentication managers
session_manager = SessionManager(app, auth_config)
api_key_manager = APIKeyManager(auth_config.get('api_keys', {}))
auth_provider = AuthProviderFactory.create_provider('local', auth_config)

# Initialize authentication middleware
init_auth_middleware(session_manager, api_key_manager)

# Configure Swagger
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs"
}

swagger_template = {
    "info": {
        "title": "ForgeBoard API",
        "description": "API for managing Python micro-apps via systemd and NGINX",
        "version": "1.0.0",
        "contact": {
            "name": "ForgeBoard Team",
            "url": "https://github.com/your-org/forgeboard"
        }
    },
    "host": "localhost:5000",
    "basePath": "/",
    "schemes": ["http", "https"],
    "securityDefinitions": {
        "BearerAuth": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT token authentication. Use format: Bearer <token>"
        },
        "ApiKeyAuth": {
            "type": "apiKey",
            "name": "X-API-Key",
            "in": "header",
            "description": "API key authentication"
        }
    }
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

app.config['APPS_CONFIG'] = os.environ.get('APPS_CONFIG', 'apps.yml')

# Initialize utilities
apps_config = AppsConfig(app.config['APPS_CONFIG'])
nginx_gen = NginxConfigGenerator()
systemd_ctrl = SystemdController()


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    ---
    tags:
      - System
    responses:
      200:
        description: Service is healthy
        schema:
          type: object
          properties:
            status:
              type: string
              example: healthy
            service:
              type: string
              example: forgeboard
    """
    return jsonify({"status": "healthy", "service": "forgeboard"}), 200


@app.route('/api/apps', methods=['GET'])
def list_apps():
    """
    List all registered apps
    ---
    tags:
      - Apps
    responses:
      200:
        description: List of all apps with their runtime status
        schema:
          type: object
          properties:
            apps:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                  slug:
                    type: string
                  port:
                    type: integer
                  type:
                    type: string
                    enum: [flask, fastapi, django]
                  status:
                    type: string
                  domain:
                    type: string
                  runtime_status:
                    type: object
            total:
              type: integer
      500:
        description: Internal server error
    """
    try:
        apps = apps_config.get_all()
        
        # Add runtime status to each app
        apps_data = []
        for app in apps:
            app_dict = app.to_dict()
            status = systemd_ctrl.get_service_status(app)
            app_dict['runtime_status'] = {
                'active': status.get('active', False),
                'enabled': status.get('enabled', False),
                'status': status.get('status', 'unknown')
            }
            apps_data.append(app_dict)
        
        return jsonify({
            "apps": apps_data,
            "total": len(apps_data)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/apps/<slug>', methods=['GET'])
def get_app(slug):
    """
    Get details for a specific app
    ---
    tags:
      - Apps
    parameters:
      - name: slug
        in: path
        type: string
        required: true
        description: The app slug identifier
    responses:
      200:
        description: App details with runtime status
      404:
        description: App not found
      500:
        description: Internal server error
    """
    try:
        app_obj = apps_config.get_by_slug(slug)
        if not app_obj:
            return jsonify({"error": f"App '{slug}' not found"}), 404
        
        app_data = app_obj.to_dict()
        status = systemd_ctrl.get_service_status(app_obj)
        app_data['runtime_status'] = status
        
        return jsonify(app_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/apps/<slug>/start', methods=['POST'])
def start_app(slug):
    """
    Start an app
    ---
    tags:
      - Apps
    parameters:
      - name: slug
        in: path
        type: string
        required: true
        description: The app slug identifier
    responses:
      200:
        description: App started successfully
        schema:
          type: object
          properties:
            message:
              type: string
            status:
              type: string
              example: started
      404:
        description: App not found
      500:
        description: Failed to start app
    """
    try:
        app_obj = apps_config.get_by_slug(slug)
        if not app_obj:
            return jsonify({"error": f"App '{slug}' not found"}), 404
        
        # Check if service file exists, create if not
        status = systemd_ctrl.get_service_status(app_obj)
        if not status['exists']:
            success, msg = systemd_ctrl.write_service(app_obj)
            if not success:
                return jsonify({"error": f"Failed to create service: {msg}"}), 500
        
        # Start the service
        success, msg = systemd_ctrl.start_service(app_obj)
        if success:
            # Update app status in YAML
            apps_config.update_app(slug, {'status': 'running'})
            return jsonify({"message": msg, "status": "started"}), 200
        else:
            return jsonify({"error": msg}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/apps/<slug>/stop', methods=['POST'])
def stop_app(slug):
    """
    Stop an app
    ---
    tags:
      - Apps
    parameters:
      - name: slug
        in: path
        type: string
        required: true
        description: The app slug identifier
    responses:
      200:
        description: App stopped successfully
        schema:
          type: object
          properties:
            message:
              type: string
            status:
              type: string
              example: stopped
      404:
        description: App not found
      500:
        description: Failed to stop app
    """
    try:
        app_obj = apps_config.get_by_slug(slug)
        if not app_obj:
            return jsonify({"error": f"App '{slug}' not found"}), 404
        
        success, msg = systemd_ctrl.stop_service(app_obj)
        if success:
            # Update app status in YAML
            apps_config.update_app(slug, {'status': 'stopped'})
            return jsonify({"message": msg, "status": "stopped"}), 200
        else:
            return jsonify({"error": msg}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/apps/<slug>/status', methods=['GET'])
def app_status(slug):
    try:
        app_obj = apps_config.get_by_slug(slug)
        if not app_obj:
            return jsonify({"error": f"App '{slug}' not found"}), 404
        
        status = systemd_ctrl.get_service_status(app_obj)
        return jsonify(status), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/apps/<slug>/logs', methods=['GET'])
def app_logs(slug):
    """
    Get logs for an app
    ---
    tags:
      - Apps
    parameters:
      - name: slug
        in: path
        type: string
        required: true
        description: The app slug identifier
      - name: lines
        in: query
        type: integer
        default: 50
        description: Number of log lines to retrieve
    responses:
      200:
        description: App logs
        schema:
          type: object
          properties:
            logs:
              type: string
            lines:
              type: integer
            app:
              type: string
      404:
        description: App not found
      500:
        description: Failed to retrieve logs
    """
    try:
        app_obj = apps_config.get_by_slug(slug)
        if not app_obj:
            return jsonify({"error": f"App '{slug}' not found"}), 404
        
        lines = request.args.get('lines', 50, type=int)
        success, logs = systemd_ctrl.get_service_logs(app_obj, lines=lines)
        
        if success:
            return jsonify({
                "logs": logs,
                "lines": lines,
                "app": slug
            }), 200
        else:
            return jsonify({"error": logs}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/nginx/reload', methods=['POST'])
def reload_nginx():
    try:
        # Regenerate all nginx configs
        apps = apps_config.get_all()
        results = nginx_gen.generate_all_configs(apps)
        
        # Check if all configs were generated successfully
        failed = [slug for slug, result in results.items() if not result['success']]
        if failed:
            return jsonify({
                "error": "Failed to generate some configs",
                "failed": failed,
                "results": results
            }), 500
        
        # Reload nginx
        success, msg = nginx_gen.reload_nginx()
        if success:
            return jsonify({
                "message": msg,
                "configs_generated": len(apps)
            }), 200
        else:
            return jsonify({"error": msg}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/apps/<slug>/nginx', methods=['POST'])
def update_app_nginx(slug):
    try:
        app_obj = apps_config.get_by_slug(slug)
        if not app_obj:
            return jsonify({"error": f"App '{slug}' not found"}), 404
        
        # Generate and write nginx config
        success, msg = nginx_gen.write_config(app_obj)
        if not success:
            return jsonify({"error": msg}), 500
        
        # Reload nginx
        success, msg = nginx_gen.reload_nginx()
        if success:
            return jsonify({"message": "NGINX config updated and reloaded"}), 200
        else:
            return jsonify({"error": f"Config written but reload failed: {msg}"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/apps/create', methods=['POST'])
def create_app():
    """
    Create a new app using cookiecutter
    ---
    tags:
      - Apps
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - type
          properties:
            name:
              type: string
              description: App name
            type:
              type: string
              enum: [flask, fastapi]
              description: App type
            description:
              type: string
              description: App description
            author_name:
              type: string
              default: Developer
            author_email:
              type: string
              default: dev@example.com
            domain:
              type: string
              description: Custom domain (optional)
    responses:
      201:
        description: App created successfully
      400:
        description: Invalid input
      500:
        description: Creation failed
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('name') or not data.get('type'):
            return jsonify({"error": "Name and type are required"}), 400
        
        if data['type'] not in ['flask', 'fastapi']:
            return jsonify({"error": "Invalid app type. Must be 'flask' or 'fastapi'"}), 400
        
        # Generate slug from name
        slug = data['name'].lower().replace(' ', '-').replace('_', '-')
        
        # Check if app already exists
        if apps_config.get_by_slug(slug):
            return jsonify({"error": f"App with slug '{slug}' already exists"}), 400
        
        # Get next available port
        port = apps_config.get_next_available_port()
        
        # Set up cookiecutter context
        context = {
            'project_name': data['name'],
            'project_slug': slug,
            'project_description': data.get('description', f'A {data["type"]} application'),
            'author_name': data.get('author_name', 'Developer'),
            'author_email': data.get('author_email', 'dev@example.com'),
            'port': str(port),
            'domain': data.get('domain', f'{slug}.local'),
            'python_version': '3.12'
        }
        
        # Create temporary directory for cookiecutter
        with tempfile.TemporaryDirectory() as temp_dir:
            # Path to cookiecutter template
            template_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                'scaffold',
                f'cookiecutter-{data["type"]}'
            )
            
            # Run cookiecutter
            cmd = [
                'cookiecutter',
                template_path,
                '--no-input',
                '--output-dir', temp_dir
            ]
            
            # Add context values
            for key, value in context.items():
                cmd.extend([f'--overwrite-if-exists', f'{key}={value}'])
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                return jsonify({"error": f"Cookiecutter failed: {result.stderr}"}), 500
            
            # Move generated app to apps directory
            generated_path = os.path.join(temp_dir, slug)
            target_path = f'/var/www/apps/{slug}'
            
            # Create apps directory if it doesn't exist
            os.makedirs('/var/www/apps', exist_ok=True)
            
            # Move the generated app
            shutil.move(generated_path, target_path)
        
        # Create virtual environment and install dependencies
        venv_path = f'{target_path}/venv'
        subprocess.run([sys.executable, '-m', 'venv', venv_path], check=True)
        
        # Install dependencies if requirements.txt exists
        requirements_path = os.path.join(target_path, 'requirements.txt')
        if os.path.exists(requirements_path):
            pip_path = os.path.join(venv_path, 'bin', 'pip')
            subprocess.run([pip_path, 'install', '-r', requirements_path], check=True)
        
        # Create app entry
        new_app = {
            'name': data['name'],
            'slug': slug,
            'port': port,
            'type': data['type'],
            'status': 'stopped',
            'domain': context['domain'],
            'path': target_path,
            'virtualenv': f'{target_path}/venv',
            'entry_point': 'app.py' if data['type'] == 'flask' else 'main.py',
            'description': context['project_description']
        }
        
        # Add to apps config
        apps_config.add_app(apps_config.App(**new_app))
        
        # Generate NGINX config
        app_obj = apps_config.get_by_slug(slug)
        nginx_success, nginx_msg = nginx_gen.write_config(app_obj)
        
        # Generate systemd service file
        systemd_success, systemd_msg = systemd_ctrl.write_service(app_obj)
        
        return jsonify({
            "message": "App created successfully",
            "app": new_app,
            "nginx_status": nginx_msg,
            "systemd_status": systemd_msg
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/system/permissions', methods=['GET'])
def check_permissions():
    """
    Check system permissions for NGINX and systemd
    ---
    tags:
      - System
    responses:
      200:
        description: Permission status
        schema:
          type: object
          properties:
            nginx:
              type: object
              properties:
                ok:
                  type: boolean
                message:
                  type: string
            systemd:
              type: object
              properties:
                ok:
                  type: boolean
                message:
                  type: string
            overall:
              type: boolean
    """
    nginx_ok, nginx_msg = nginx_gen.check_permissions()
    systemd_ok, systemd_msg = systemd_ctrl.check_permissions()
    
    return jsonify({
        "nginx": {"ok": nginx_ok, "message": nginx_msg},
        "systemd": {"ok": systemd_ok, "message": systemd_msg},
        "overall": nginx_ok and systemd_ok
    }), 200


# Authentication endpoints
@app.route('/api/auth/login', methods=['POST'])
@validate_json_content
@require_fields('username', 'password')
@auth_rate_limit
def login():
    """
    Login with username/password
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: credentials
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
              example: "admin"
            password:
              type: string
              example: "password123"
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            access_token:
              type: string
            refresh_token:
              type: string
            token_type:
              type: string
              example: "Bearer"
            expires_in:
              type: integer
            user:
              type: object
      401:
        description: Invalid credentials
      429:
        description: Rate limit exceeded
    """
    data = request.get_json()
    
    # Authenticate user
    auth_result = auth_provider.authenticate(data)
    
    if not auth_result.success:
        return jsonify({
            'error': auth_result.error.value if auth_result.error else 'authentication_failed',
            'message': auth_result.error_message or 'Authentication failed'
        }), 401
    
    # Create session
    session_data = session_manager.create_session(
        user_id=auth_result.user_id,
        ip_address=request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
        user_agent=request.headers.get('User-Agent', '')
    )
    
    return jsonify({
        'access_token': session_data['access_token'],
        'refresh_token': session_data['refresh_token'],
        'token_type': session_data['token_type'],
        'expires_in': session_data['expires_in'],
        'user': {
            'id': auth_result.user_id,
            'username': auth_result.username,
            'email': auth_result.email,
            'display_name': auth_result.display_name,
            'is_admin': auth_result.is_admin,
            'password_change_required': auth_result.password_change_required
        }
    }), 200


@app.route('/api/auth/refresh', methods=['POST'])
@validate_json_content
@require_fields('refresh_token')
@auth_rate_limit
def refresh_token():
    """
    Refresh authentication token
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: token
        required: true
        schema:
          type: object
          properties:
            refresh_token:
              type: string
    responses:
      200:
        description: Token refreshed successfully
      401:
        description: Invalid refresh token
    """
    data = request.get_json()
    refresh_token = data.get('refresh_token')
    
    session_data = session_manager.refresh_session(refresh_token)
    if not session_data:
        return jsonify({
            'error': 'invalid_refresh_token',
            'message': 'Invalid or expired refresh token'
        }), 401
    
    return jsonify(session_data), 200


@app.route('/api/auth/logout', methods=['POST'])
@auth_required
def logout():
    """
    Logout current session
    ---
    tags:
      - Authentication
    security:
      - BearerAuth: []
    responses:
      200:
        description: Logout successful
      401:
        description: Not authenticated
    """
    token = session_manager.extract_token_from_request(request)
    if token:
        session_manager.revoke_session(token)
    
    return jsonify({'message': 'Logged out successfully'}), 200


@app.route('/api/auth/me', methods=['GET'])
@auth_required
def get_current_user():
    """
    Get current user information
    ---
    tags:
      - Authentication
    security:
      - BearerAuth: []
    responses:
      200:
        description: User information
        schema:
          type: object
          properties:
            id:
              type: integer
            username:
              type: string
            email:
              type: string
            display_name:
              type: string
            is_admin:
              type: boolean
            permissions:
              type: array
              items:
                type: string
      401:
        description: Not authenticated
    """
    from auth.middleware import get_current_user
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'user_not_found'}), 404
    
    return jsonify(user.to_dict()), 200


@app.route('/api/auth/register', methods=['POST'])
@validate_json_content
@require_fields('username', 'email', 'password')
@auth_rate_limit
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: user_data
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
            email:
              type: string
            password:
              type: string
            display_name:
              type: string
    responses:
      201:
        description: User registered successfully
      400:
        description: Invalid user data
      409:
        description: User already exists
    """
    data = request.get_json()
    
    # Register user
    auth_result = auth_provider.register_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        display_name=data.get('display_name', data['username'])
    )
    
    if not auth_result.success:
        status_code = 409 if 'already exists' in (auth_result.error_message or '') else 400
        return jsonify({
            'error': auth_result.error.value if auth_result.error else 'registration_failed',
            'message': auth_result.error_message or 'Registration failed'
        }), status_code
    
    return jsonify({
        'message': 'User registered successfully',
        'user': {
            'id': auth_result.user_id,
            'username': auth_result.username,
            'email': auth_result.email,
            'display_name': auth_result.display_name,
            'is_admin': auth_result.is_admin
        }
    }), 201


# API Key endpoints
@app.route('/api/me/api-keys', methods=['GET'])
@auth_required
def get_user_api_keys():
    """
    Get current user's API keys
    ---
    tags:
      - API Keys
    security:
      - BearerAuth: []
    responses:
      200:
        description: List of API keys
        schema:
          type: array
          items:
            type: object
      401:
        description: Not authenticated
    """
    from auth.middleware import get_current_user_id
    user_id = get_current_user_id()
    
    api_keys = api_key_manager.get_user_api_keys(user_id)
    return jsonify(api_keys), 200


@app.route('/api/me/api-keys', methods=['POST'])
@auth_required
@validate_json_content
@require_fields('name')
def create_api_key():
    """
    Create a new API key
    ---
    tags:
      - API Keys
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: api_key_data
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
            permissions:
              type: array
              items:
                type: string
            expires_days:
              type: integer
    responses:
      201:
        description: API key created successfully
      400:
        description: Invalid request data
      401:
        description: Not authenticated
    """
    from auth.middleware import get_current_user_id
    user_id = get_current_user_id()
    data = request.get_json()
    
    # Check if user can create more keys
    if not api_key_manager.can_create_key(user_id):
        return jsonify({
            'error': 'api_key_limit_exceeded',
            'message': 'Maximum number of API keys reached'
        }), 400
    
    api_key_data, raw_key = api_key_manager.create_api_key(
        user_id=user_id,
        name=data['name'],
        permissions=data.get('permissions'),
        expires_days=data.get('expires_days')
    )
    
    if not api_key_data:
        return jsonify({
            'error': 'api_key_creation_failed',
            'message': 'Failed to create API key'
        }), 400
    
    return jsonify({
        'message': 'API key created successfully',
        'api_key': raw_key,
        'key_data': api_key_data
    }), 201


@app.route('/api/me/api-keys/<int:key_id>', methods=['DELETE'])
@auth_required
def revoke_api_key(key_id):
    """
    Revoke an API key
    ---
    tags:
      - API Keys
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: key_id
        type: integer
        required: true
    responses:
      200:
        description: API key revoked successfully
      401:
        description: Not authenticated
      404:
        description: API key not found
    """
    from auth.middleware import get_current_user_id
    user_id = get_current_user_id()
    
    if api_key_manager.revoke_api_key(key_id, user_id):
        return jsonify({'message': 'API key revoked successfully'}), 200
    else:
        return jsonify({'error': 'api_key_not_found'}), 404


# User management endpoints (admin only)
@app.route('/api/users', methods=['GET'])
@admin_required
def list_users():
    """
    List all users (admin only)
    ---
    tags:
      - User Management
    security:
      - BearerAuth: []
    responses:
      200:
        description: List of users
        schema:
          type: array
          items:
            type: object
      401:
        description: Not authenticated
      403:
        description: Admin required
    """
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200


@app.route('/api/users', methods=['POST'])
@admin_required
@validate_json_content
@require_fields('username', 'email', 'password')
def create_user():
    """
    Create a new user (admin only)
    ---
    tags:
      - User Management
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: user_data
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
            email:
              type: string
            password:
              type: string
            display_name:
              type: string
            is_admin:
              type: boolean
    responses:
      201:
        description: User created successfully
      400:
        description: Invalid user data
      401:
        description: Not authenticated
      403:
        description: Admin required
    """
    data = request.get_json()
    
    # Create user
    auth_result = auth_provider.register_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        display_name=data.get('display_name', data['username']),
        is_admin=data.get('is_admin', False)
    )
    
    if not auth_result.success:
        status_code = 409 if 'already exists' in (auth_result.error_message or '') else 400
        return jsonify({
            'error': auth_result.error.value if auth_result.error else 'user_creation_failed',
            'message': auth_result.error_message or 'User creation failed'
        }), status_code
    
    return jsonify({
        'message': 'User created successfully',
        'user': {
            'id': auth_result.user_id,
            'username': auth_result.username,
            'email': auth_result.email,
            'display_name': auth_result.display_name,
            'is_admin': auth_result.is_admin
        }
    }), 201


# Password reset endpoints
@app.route('/api/auth/forgot-password', methods=['POST'])
@validate_json_content
@require_fields('email')
@auth_rate_limit
def forgot_password():
    """
    Initiate password reset
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: email_data
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
              format: email
    responses:
      200:
        description: Password reset email sent (always returns 200 to prevent email enumeration)
      400:
        description: Invalid request data
      429:
        description: Rate limit exceeded
    """
    data = request.get_json()
    email = data.get('email')
    
    # Always return success to prevent email enumeration
    success = auth_provider.reset_password(email)
    
    return jsonify({
        'message': 'If an account with this email exists, a password reset link has been sent.'
    }), 200


@app.route('/api/auth/reset-password', methods=['POST'])
@validate_json_content
@require_fields('token', 'new_password')
@auth_rate_limit
def reset_password():
    """
    Complete password reset
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: reset_data
        required: true
        schema:
          type: object
          properties:
            token:
              type: string
            new_password:
              type: string
    responses:
      200:
        description: Password reset successful
      400:
        description: Invalid token or password
      429:
        description: Rate limit exceeded
    """
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    
    # Complete password reset
    auth_result = auth_provider.complete_password_reset(token, new_password)
    
    if not auth_result.success:
        return jsonify({
            'error': auth_result.error.value if auth_result.error else 'password_reset_failed',
            'message': auth_result.error_message or 'Password reset failed'
        }), 400
    
    return jsonify({
        'message': 'Password reset successful'
    }), 200


@app.route('/api/auth/change-password', methods=['POST'])
@auth_required
@validate_json_content
@require_fields('current_password', 'new_password')
@auth_rate_limit
def change_password():
    """
    Change current user's password
    ---
    tags:
      - Authentication
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: password_data
        required: true
        schema:
          type: object
          properties:
            current_password:
              type: string
            new_password:
              type: string
    responses:
      200:
        description: Password changed successfully
      400:
        description: Invalid current password or new password
      401:
        description: Not authenticated
      429:
        description: Rate limit exceeded
    """
    from auth.middleware import get_current_user_id
    user_id = get_current_user_id()
    data = request.get_json()
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    # Change password
    auth_result = auth_provider.change_password(user_id, current_password, new_password)
    
    if not auth_result.success:
        return jsonify({
            'error': auth_result.error.value if auth_result.error else 'password_change_failed',
            'message': auth_result.error_message or 'Password change failed'
        }), 400
    
    return jsonify({
        'message': 'Password changed successfully'
    }), 200


# Email configuration endpoints (admin only)
@app.route('/api/admin/email/config', methods=['GET'])
@admin_required
def get_email_config():
    """
    Get email configuration (admin only)
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: Email configuration
      401:
        description: Not authenticated
      403:
        description: Admin required
    """
    from auth.email_service import EmailService
    from config.manager import ConfigManager
    
    config_manager = ConfigManager()
    email_service = EmailService(config_manager)
    
    return jsonify(email_service.get_configuration()), 200


@app.route('/api/admin/email/config', methods=['POST'])
@admin_required
@validate_json_content
def update_email_config():
    """
    Update email configuration (admin only)
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: email_config
        required: true
        schema:
          type: object
          properties:
            enabled:
              type: boolean
            provider:
              type: string
              enum: [smtp, oauth2]
            from_email:
              type: string
            from_name:
              type: string
            smtp_host:
              type: string
            smtp_port:
              type: integer
            smtp_username:
              type: string
            smtp_password:
              type: string
            smtp_use_tls:
              type: boolean
            smtp_use_ssl:
              type: boolean
            tenant_id:
              type: string
            client_id:
              type: string
            client_secret:
              type: string
    responses:
      200:
        description: Email configuration updated
      400:
        description: Invalid configuration
      401:
        description: Not authenticated
      403:
        description: Admin required
    """
    from auth.email_service import EmailService
    from config.manager import ConfigManager
    
    config_manager = ConfigManager()
    email_service = EmailService(config_manager)
    
    data = request.get_json()
    
    try:
        if email_service.update_configuration(data):
            return jsonify({'message': 'Email configuration updated successfully'}), 200
        else:
            return jsonify({'error': 'Failed to update email configuration - check server logs for details'}), 400
    except Exception as e:
        return jsonify({'error': f'Email configuration error: {str(e)}'}), 400


@app.route('/api/admin/email/test', methods=['POST'])
@admin_required
def test_email_config():
    """
    Test email configuration (admin only)
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: Email test result
      401:
        description: Not authenticated
      403:
        description: Admin required
    """
    from auth.email_service import EmailService
    from config.manager import ConfigManager
    
    config_manager = ConfigManager()
    email_service = EmailService(config_manager)
    
    result = email_service.test_email_configuration()
    
    return jsonify(result), 200 if result['success'] else 400


# Authentication configuration endpoints (admin only)
@app.route('/api/admin/auth/config', methods=['GET'])
@admin_required
def get_auth_config():
    """
    Get authentication configuration (admin only)
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: Authentication configuration
      401:
        description: Not authenticated
      403:
        description: Admin required
    """
    from config.manager import ConfigManager
    
    config_manager = ConfigManager()
    
    # Get current authentication configuration
    auth_config = config_manager.get_config('auth') or {}
    
    # Return sanitized config (no secrets)
    sanitized_config = {
        'enabled': auth_config.get('enabled', True),
        'method': auth_config.get('method', 'local'),
        'session': {
            'timeout': auth_config.get('session', {}).get('timeout', 86400),
            'refresh_enabled': auth_config.get('session', {}).get('refresh_enabled', True),
            'refresh_timeout': auth_config.get('session', {}).get('refresh_timeout', 604800)
        },
        'api_keys': {
            'enabled': auth_config.get('api_keys', {}).get('enabled', True),
            'max_per_user': auth_config.get('api_keys', {}).get('max_per_user', 5),
            'default_expiry': auth_config.get('api_keys', {}).get('default_expiry', None)
        },
        'local': {
            'password': {
                'min_length': auth_config.get('local', {}).get('password', {}).get('min_length', 8),
                'require_uppercase': auth_config.get('local', {}).get('password', {}).get('require_uppercase', True),
                'require_lowercase': auth_config.get('local', {}).get('password', {}).get('require_lowercase', True),
                'require_numbers': auth_config.get('local', {}).get('password', {}).get('require_numbers', True),
                'require_special': auth_config.get('local', {}).get('password', {}).get('require_special', False)
            },
            'security': {
                'max_login_attempts': auth_config.get('local', {}).get('security', {}).get('max_login_attempts', 5),
                'lockout_duration': auth_config.get('local', {}).get('security', {}).get('lockout_duration', 300),
                'password_reset_expiry': auth_config.get('local', {}).get('security', {}).get('password_reset_expiry', 3600)
            }
        }
    }
    
    return jsonify(sanitized_config), 200


@app.route('/api/admin/auth/config', methods=['POST'])
@admin_required
@validate_json_content
def update_auth_config():
    """
    Update authentication configuration (admin only)
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: auth_config
        required: true
        schema:
          type: object
          properties:
            enabled:
              type: boolean
            method:
              type: string
              enum: [local, azure_ad]
            session:
              type: object
              properties:
                timeout:
                  type: integer
                refresh_enabled:
                  type: boolean
                refresh_timeout:
                  type: integer
            api_keys:
              type: object
              properties:
                enabled:
                  type: boolean
                max_per_user:
                  type: integer
                default_expiry:
                  type: integer
            local:
              type: object
              properties:
                password:
                  type: object
                  properties:
                    min_length:
                      type: integer
                    require_uppercase:
                      type: boolean
                    require_lowercase:
                      type: boolean
                    require_numbers:
                      type: boolean
                    require_special:
                      type: boolean
                security:
                  type: object
                  properties:
                    max_login_attempts:
                      type: integer
                    lockout_duration:
                      type: integer
                    password_reset_expiry:
                      type: integer
    responses:
      200:
        description: Authentication configuration updated
      400:
        description: Invalid configuration
      401:
        description: Not authenticated
      403:
        description: Admin required
    """
    from config.manager import ConfigManager
    
    config_manager = ConfigManager()
    data = request.get_json()
    
    # Validate configuration
    if 'enabled' in data and not isinstance(data['enabled'], bool):
        return jsonify({'error': 'enabled must be a boolean'}), 400
    
    if 'method' in data and data['method'] not in ['local', 'azure_ad']:
        return jsonify({'error': 'method must be "local" or "azure_ad"'}), 400
    
    # Update configuration
    if config_manager.set_config('auth', data):
        return jsonify({'message': 'Authentication configuration updated successfully'}), 200
    else:
        return jsonify({'error': 'Failed to update authentication configuration'}), 400


@app.route('/api/admin/auth/stats', methods=['GET'])
@admin_required
def get_auth_stats():
    """
    Get authentication statistics (admin only)
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: Authentication statistics
      401:
        description: Not authenticated
      403:
        description: Admin required
    """
    from database.models.user import User
    from database.models.session import Session
    from database.models.api_key import ApiKey
    from database.models.audit_log import AuditLog
    from sqlalchemy import func
    
    try:
        # User statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        admin_users = User.query.filter_by(is_admin=True, is_active=True).count()
        local_users = User.query.filter_by(auth_provider='local', is_active=True).count()
        
        # Session statistics
        session_stats = Session.get_session_stats()
        
        # API key statistics
        api_key_stats = ApiKey.get_api_key_stats()
        
        # Recent login activity (last 24 hours)
        from datetime import datetime, timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_logins = User.query.filter(
            User.last_login_at >= yesterday,
            User.is_active == True
        ).count()
        
        # Audit log statistics
        total_auth_events = AuditLog.query.filter(
            AuditLog.resource_type == 'authentication'
        ).count()
        
        recent_auth_events = AuditLog.query.filter(
            AuditLog.resource_type == 'authentication',
            AuditLog.created_at >= yesterday
        ).count()
        
        stats = {
            'users': {
                'total': total_users,
                'active': active_users,
                'admin': admin_users,
                'local': local_users,
                'recent_logins': recent_logins
            },
            'sessions': session_stats,
            'api_keys': api_key_stats,
            'audit': {
                'total_auth_events': total_auth_events,
                'recent_auth_events': recent_auth_events
            }
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        current_app.logger.error(f"Auth stats error: {str(e)}")
        return jsonify({'error': 'Failed to get authentication statistics'}), 500


# =============================================================================
# SSL Certificate Management Endpoints
# =============================================================================

@app.route('/api/ssl/certificates', methods=['GET'])
@auth_required
@admin_required
def list_ssl_certificates():
    """
    List all SSL certificates
    ---
    tags:
      - SSL Management
    security:
      - BearerAuth: []
    responses:
      200:
        description: List of SSL certificates
        schema:
          type: object
          properties:
            certificates:
              type: array
              items:
                type: object
      403:
        description: Admin access required
    """
    try:
        from ssl_management.manager import SSLManager
        ssl_manager = SSLManager()
        
        certificates = ssl_manager.list_certificates()
        return jsonify({'certificates': certificates}), 200
        
    except Exception as e:
        current_app.logger.error(f"SSL list error: {str(e)}")
        return jsonify({'error': 'Failed to list SSL certificates'}), 500


@app.route('/api/ssl/certificates/<domain>/status', methods=['GET'])
@auth_required
@admin_required
def get_ssl_certificate_status(domain):
    """
    Get SSL certificate status for domain
    ---
    tags:
      - SSL Management
    security:
      - BearerAuth: []
    parameters:
      - name: domain
        in: path
        type: string
        required: true
        description: Domain name
    responses:
      200:
        description: Certificate status
      403:
        description: Admin access required
    """
    try:
        from ssl_management.manager import SSLManager
        ssl_manager = SSLManager()
        
        status = ssl_manager.get_certificate_status(domain)
        return jsonify(status), 200
        
    except Exception as e:
        current_app.logger.error(f"SSL status error: {str(e)}")
        return jsonify({'error': 'Failed to get certificate status'}), 500


@app.route('/api/ssl/csr/generate', methods=['POST'])
@auth_required
@admin_required
def generate_csr():
    """
    Generate CSR for domain
    ---
    tags:
      - SSL Management
    security:
      - BearerAuth: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            domain:
              type: string
              description: Domain name
            organization:
              type: string
              description: Organization name
            country:
              type: string
              description: Country code (2 letters)
            state:
              type: string
              description: State or province
            city:
              type: string
              description: City or locality
            email:
              type: string
              description: Email address
    responses:
      200:
        description: CSR generated successfully
      400:
        description: Invalid request data
      403:
        description: Admin access required
    """
    try:
        data = request.get_json()
        if not data or 'domain' not in data:
            return jsonify({'error': 'Domain is required'}), 400
        
        from ssl_management.manager import SSLManager
        ssl_manager = SSLManager()
        
        result = ssl_manager.generate_csr(
            domain=data['domain'],
            organization=data.get('organization', 'ForgeBoard'),
            country=data.get('country', 'US'),
            state=data.get('state', 'CA'),
            city=data.get('city', 'San Francisco'),
            email=data.get('email')
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        current_app.logger.error(f"CSR generation error: {str(e)}")
        return jsonify({'error': 'Failed to generate CSR'}), 500


@app.route('/api/ssl/certificates/upload', methods=['POST'])
@auth_required
@admin_required
def upload_ssl_certificate():
    """
    Upload SSL certificate
    ---
    tags:
      - SSL Management
    security:
      - BearerAuth: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            domain:
              type: string
              description: Domain name
            certificate_pem:
              type: string
              description: Certificate in PEM format
            chain_pem:
              type: string
              description: Certificate chain in PEM format
    responses:
      200:
        description: Certificate uploaded successfully
      400:
        description: Invalid certificate data
      403:
        description: Admin access required
    """
    try:
        data = request.get_json()
        if not data or 'domain' not in data or 'certificate_pem' not in data:
            return jsonify({'error': 'Domain and certificate_pem are required'}), 400
        
        from ssl_management.manager import SSLManager
        ssl_manager = SSLManager()
        
        result = ssl_manager.upload_certificate(
            domain=data['domain'],
            certificate_pem=data['certificate_pem'],
            chain_pem=data.get('chain_pem')
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        current_app.logger.error(f"Certificate upload error: {str(e)}")
        return jsonify({'error': 'Failed to upload certificate'}), 500


@app.route('/api/ssl/letsencrypt/configure', methods=['POST'])
@auth_required
@admin_required
def configure_letsencrypt():
    """
    Configure Let's Encrypt with Cloudflare
    ---
    tags:
      - SSL Management
    security:
      - BearerAuth: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            domain:
              type: string
              description: Domain name
            cloudflare_api_key:
              type: string
              description: Cloudflare API key
            zone_id:
              type: string
              description: Cloudflare zone ID (optional)
    responses:
      200:
        description: Let's Encrypt configured successfully
      400:
        description: Invalid configuration data
      403:
        description: Admin access required
    """
    try:
        data = request.get_json()
        if not data or 'domain' not in data or 'cloudflare_api_key' not in data:
            return jsonify({'error': 'Domain and cloudflare_api_key are required'}), 400
        
        from ssl_management.manager import SSLManager
        ssl_manager = SSLManager()
        
        result = ssl_manager.configure_letsencrypt(
            domain=data['domain'],
            cloudflare_api_key=data['cloudflare_api_key'],
            zone_id=data.get('zone_id')
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        current_app.logger.error(f"Let's Encrypt configuration error: {str(e)}")
        return jsonify({'error': 'Failed to configure Let\'s Encrypt'}), 500


@app.route('/api/ssl/letsencrypt/request', methods=['POST'])
@auth_required
@admin_required
def request_letsencrypt_certificate():
    """
    Request Let's Encrypt certificate
    ---
    tags:
      - SSL Management
    security:
      - BearerAuth: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            domain:
              type: string
              description: Domain name
    responses:
      200:
        description: Certificate request initiated
      400:
        description: Invalid request data
      403:
        description: Admin access required
    """
    try:
        data = request.get_json()
        if not data or 'domain' not in data:
            return jsonify({'error': 'Domain is required'}), 400
        
        from ssl_management.manager import SSLManager
        ssl_manager = SSLManager()
        
        result = ssl_manager.request_letsencrypt_certificate(data['domain'])
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        current_app.logger.error(f"Let's Encrypt request error: {str(e)}")
        return jsonify({'error': 'Failed to request Let\'s Encrypt certificate'}), 500


@app.route('/api/ssl/certificates/<domain>', methods=['DELETE'])
@auth_required
@admin_required
def delete_ssl_certificate(domain):
    """
    Delete SSL certificate configuration
    ---
    tags:
      - SSL Management
    security:
      - BearerAuth: []
    parameters:
      - name: domain
        in: path
        type: string
        required: true
        description: Domain name
    responses:
      200:
        description: Certificate deleted successfully
      404:
        description: Certificate not found
      403:
        description: Admin access required
    """
    try:
        from ssl_management.manager import SSLManager
        ssl_manager = SSLManager()
        
        result = ssl_manager.delete_certificate(domain)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
        
    except Exception as e:
        current_app.logger.error(f"SSL delete error: {str(e)}")
        return jsonify({'error': 'Failed to delete certificate'}), 500


@app.route('/api/admin/logs', methods=['GET'])
@admin_required
def get_backend_logs():
    """
    Get recent backend logs (admin only)
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    parameters:
      - name: lines
        in: query
        type: integer
        default: 100
        description: Number of log lines to return
    responses:
      200:
        description: Backend logs
      401:
        description: Not authenticated
      403:
        description: Admin required
    """
    try:
        lines = request.args.get('lines', 100, type=int)
        log_records = []
        
        # Determine log file path
        logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
        if app.debug:
            log_file = os.path.join(logs_dir, 'forgeboard-debug.log')
        else:
            log_file = os.path.join(logs_dir, 'forgeboard.log')
        
        # Read log file if it exists
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    log_lines = f.readlines()
                    
                # Parse recent log lines
                for line in log_lines[-lines:]:
                    line = line.strip()
                    if line:
                        # Parse log format: "2024-01-01 12:00:00,000 INFO: message"
                        parts = line.split(' ', 3)
                        if len(parts) >= 3:
                            timestamp_str = f"{parts[0]} {parts[1]}"
                            level = parts[2].rstrip(':')
                            message = parts[3] if len(parts) > 3 else ''
                            
                            # Convert timestamp to ISO format
                            try:
                                dt = datetime.strptime(timestamp_str.split(',')[0], '%Y-%m-%d %H:%M:%S')
                                iso_timestamp = dt.isoformat() + 'Z'
                            except:
                                iso_timestamp = timestamp_str
                            
                            log_records.append({
                                'timestamp': iso_timestamp,
                                'level': level,
                                'message': message
                            })
                        else:
                            # Handle malformed lines
                            log_records.append({
                                'timestamp': datetime.now().isoformat() + 'Z',
                                'level': 'INFO',
                                'message': line
                            })
            except Exception as e:
                app.logger.error(f"Error reading log file: {str(e)}")
                log_records = [{
                    'timestamp': datetime.now().isoformat() + 'Z',
                    'level': 'ERROR',
                    'message': f'Failed to read log file: {str(e)}'
                }]
        else:
            # Log file doesn't exist yet
            log_records = [{
                'timestamp': datetime.now().isoformat() + 'Z',
                'level': 'INFO',
                'message': f'Log file not found at {log_file}. Logs will appear after first backend activity.'
            }]
        
        return jsonify({
            'logs': log_records,
            'total': len(log_records),
            'log_file': log_file
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_backend_logs: {str(e)}")
        return jsonify({'error': f'Failed to get logs: {str(e)}'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'true').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)