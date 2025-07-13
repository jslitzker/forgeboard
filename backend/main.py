#!/usr/bin/env python3
from flask import Flask, jsonify, request
from flask_cors import CORS
from flasgger import Swagger
import os
import sys
import subprocess
import tempfile
import shutil

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.yaml_loader import AppsConfig
from utils.nginx_gen import NginxConfigGenerator
from utils.systemd_control import SystemdController

app = Flask(__name__)
CORS(app)

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
    "schemes": ["http", "https"]
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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'true').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)