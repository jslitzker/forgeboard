#!/usr/bin/env python3
"""
{{ cookiecutter.project_name }}
{{ cookiecutter.project_description }}

Author: {{ cookiecutter.author_name }}
Email: {{ cookiecutter.author_email }}
"""

from flask import Flask, jsonify
import os

app = Flask(__name__)

# Configuration
app.config['DEBUG'] = os.environ.get('DEBUG', 'True').lower() == 'true'
app.config['PORT'] = int(os.environ.get('PORT', {{ cookiecutter.port }}))


@app.route('/')
def index():
    return jsonify({
        'app': '{{ cookiecutter.project_name }}',
        'status': 'running',
        'version': '1.0.0'
    })


@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200


@app.route('/api/info')
def info():
    return jsonify({
        'name': '{{ cookiecutter.project_name }}',
        'description': '{{ cookiecutter.project_description }}',
        'author': '{{ cookiecutter.author_name }}',
        'port': app.config['PORT']
    })


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )