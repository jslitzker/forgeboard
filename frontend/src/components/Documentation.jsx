import React, { useState } from 'react'
import { 
  Book,
  Code,
  Terminal,
  FileText,
  ExternalLink,
  Search,
  ChevronRight,
  Zap,
  Package,
  Server,
  Shield,
  GitBranch,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

const Documentation = ({ darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSection, setActiveSection] = useState('getting-started')
  const [activeContent, setActiveContent] = useState('quick-start')

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      content: [
        { title: 'Quick Start Guide', id: 'quick-start' },
        { title: 'Installation', id: 'installation' },
        { title: 'First App Deployment', id: 'first-app' },
        { title: 'System Requirements', id: 'requirements' }
      ]
    },
    {
      id: 'app-deployment',
      title: 'App Deployment',
      icon: Package,
      content: [
        { title: 'Flask Applications', id: 'flask-apps' },
        { title: 'FastAPI Applications', id: 'fastapi-apps' },
        { title: 'Django Applications', id: 'django-apps' },
        { title: 'Environment Variables', id: 'env-vars' },
        { title: 'Domain Configuration', id: 'domains' }
      ]
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: Code,
      content: [
        { title: 'Authentication', id: 'auth' },
        { title: 'Apps Endpoints', id: 'apps-api' },
        { title: 'Logs Endpoints', id: 'logs-api' },
        { title: 'System Endpoints', id: 'system-api' }
      ]
    },
    {
      id: 'system-admin',
      title: 'System Administration',
      icon: Server,
      content: [
        { title: 'NGINX Configuration', id: 'nginx' },
        { title: 'Systemd Services', id: 'systemd' },
        { title: 'Email Configuration', id: 'email-config' },
        { title: 'SSL Certificates', id: 'ssl-config' },
        { title: 'Security Best Practices', id: 'security' },
        { title: 'Backup & Recovery', id: 'backup' }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: HelpCircle,
      content: [
        { title: 'Common Issues', id: 'common-issues' },
        { title: 'Debug Mode', id: 'debug' },
        { title: 'Log Analysis', id: 'log-analysis' },
        { title: 'Performance Tuning', id: 'performance' }
      ]
    }
  ]

  const getContent = (sectionId, contentId) => {
    // Documentation content
    const content = {
      'quick-start': {
        title: 'Quick Start Guide',
        body: `
## Welcome to ForgeBoard

ForgeBoard is a Flask-based app management dashboard for deploying Python micro-apps on a single VM.

### Key Features:
- **No Containers**: Direct systemd process management
- **NGINX Integration**: Automatic reverse proxy configuration
- **Multi-Framework**: Support for Flask, FastAPI, and Django
- **Simple UI**: Clean React dashboard for app management

### Basic Workflow:
1. Create a new app using the dashboard
2. Configure your app settings (port, domain)
3. Deploy your code
4. ForgeBoard handles the rest!

\`\`\`bash
# Example: Deploy a Flask app
cd /path/to/your/app
forgeboard deploy --name myapp --type flask --port 5001
\`\`\`
        `
      },
      'flask-apps': {
        title: 'Deploying Flask Applications',
        body: `
## Flask Application Deployment

### Project Structure
\`\`\`
myapp/
├── app.py          # Main Flask application
├── requirements.txt # Python dependencies
├── .env            # Environment variables
└── static/         # Static files (optional)
\`\`\`

### Basic Flask App Example
\`\`\`python
# app.py
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello from ForgeBoard!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
\`\`\`

### Deployment Steps:
1. Click "New App" in the dashboard
2. Select "Flask" as the app type
3. Configure port and domain
4. Upload or link your repository
5. ForgeBoard creates systemd service and NGINX config automatically
        `
      },
      'installation': {
        title: 'Installation Guide',
        body: `
## Installation Guide

### Prerequisites
- Ubuntu 22.04 LTS or similar Linux distribution
- Python 3.8 or higher
- systemd for process management
- NGINX for reverse proxy
- Git for version control

### System Setup

1. **Update system packages**
\`\`\`bash
sudo apt update && sudo apt upgrade -y
\`\`\`

2. **Install required dependencies**
\`\`\`bash
sudo apt install -y python3 python3-pip python3-venv nginx git
\`\`\`

3. **Clone ForgeBoard repository**
\`\`\`bash
git clone https://github.com/forgeboard/forgeboard.git
cd forgeboard
\`\`\`

4. **Set up Python environment**
\`\`\`bash
# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
\`\`\`

5. **Configure NGINX**
\`\`\`bash
sudo cp nginx/forgeboard.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/forgeboard.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
\`\`\`

6. **Create systemd service**
\`\`\`bash
sudo cp systemd/forgeboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable forgeboard
sudo systemctl start forgeboard
\`\`\`

### Frontend Setup

1. **Install Node.js and npm**
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
\`\`\`

2. **Build frontend**
\`\`\`bash
cd frontend
npm install
npm run build
\`\`\`

### Verify Installation

1. Check service status:
\`\`\`bash
sudo systemctl status forgeboard
\`\`\`

2. Access the dashboard:
- Open browser to http://your-server-ip:5000
- Default login: admin/admin (change immediately!)
        `
      },
      'first-app': {
        title: 'Deploying Your First App',
        body: `
## Deploying Your First App

### Step 1: Create a New App

1. Navigate to the ForgeBoard dashboard
2. Click the "New App" button
3. Fill in the app details:
   - **Name**: Your app name (e.g., "my-flask-app")
   - **Type**: Select framework (Flask, FastAPI, or Django)
   - **Port**: Choose an available port (e.g., 5001)
   - **Domain**: Your app domain (e.g., "myapp.example.com")

### Step 2: Prepare Your Application

#### Flask Example
\`\`\`python
# app.py
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "Hello from ForgeBoard!"})

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
\`\`\`

#### Requirements File
\`\`\`txt
# requirements.txt
flask==2.3.0
gunicorn==20.1.0
\`\`\`

### Step 3: Deploy Your App

1. **Upload your code**:
   - Use the file upload in the dashboard
   - Or specify a Git repository URL

2. **Configure environment variables**:
   \`\`\`bash
   DATABASE_URL=postgresql://user:pass@localhost/db
   SECRET_KEY=your-secret-key
   DEBUG=False
   \`\`\`

3. **Click "Deploy"** and ForgeBoard will:
   - Create a virtual environment
   - Install dependencies
   - Configure systemd service
   - Set up NGINX routing
   - Start your application

### Step 4: Monitor Your App

- View real-time logs in the Logs section
- Check app status in the dashboard
- Use the start/stop controls as needed

### Troubleshooting First Deploy

- **Port conflicts**: Ensure chosen port is available
- **Domain setup**: Add DNS A record pointing to your server
- **Dependencies**: Check requirements.txt is complete
- **Permissions**: Ensure app directory has correct permissions
        `
      },
      'requirements': {
        title: 'System Requirements',
        body: `
## System Requirements

### Minimum Hardware Requirements

- **CPU**: 2 vCPUs (2.4 GHz or higher)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 20 GB SSD minimum
- **Network**: 100 Mbps connection

### Recommended Hardware

- **CPU**: 4 vCPUs (3.0 GHz or higher)
- **RAM**: 16 GB or more
- **Storage**: 100 GB SSD with high IOPS
- **Network**: 1 Gbps connection

### Software Requirements

#### Operating System
- Ubuntu 22.04 LTS (recommended)
- Ubuntu 20.04 LTS
- Debian 11 or 12
- CentOS 8 or Rocky Linux 8

#### Core Dependencies
\`\`\`
Python 3.8+
Node.js 16+ and npm 8+
NGINX 1.18+
systemd 245+
Git 2.25+
\`\`\`

#### Python Packages
\`\`\`
Flask 2.3+
Flask-CORS
PyYAML
requests
psutil
\`\`\`

### Network Requirements

- **Ports**:
  - 80 (HTTP)
  - 443 (HTTPS)
  - 5000 (ForgeBoard API)
  - App ports (5001-5999 recommended range)

- **Firewall Rules**:
  \`\`\`bash
  # Allow HTTP/HTTPS
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  
  # Allow ForgeBoard API
  sudo ufw allow 5000/tcp
  
  # Allow app port range
  sudo ufw allow 5001:5999/tcp
  \`\`\`

### Scaling Considerations

#### Small Deployment (1-10 apps)
- Single VM setup
- 4 GB RAM minimum
- Basic monitoring

#### Medium Deployment (10-50 apps)
- 8-16 GB RAM
- SSD storage mandatory
- Consider load balancing

#### Large Deployment (50+ apps)
- Multiple VMs
- 16+ GB RAM per node
- External database
- Centralized logging
- Load balancer required

### Security Requirements

- SSL/TLS certificates (Let's Encrypt recommended)
- Firewall properly configured
- SELinux or AppArmor enabled
- Regular security updates
- Strong authentication configured
        `
      },
      'apps-api': {
        title: 'Apps API Reference',
        body: `
## Apps API Endpoints

### List All Apps
\`GET /api/apps\`

**Response:**
\`\`\`json
{
  "apps": [
    {
      "slug": "myapp",
      "name": "My App",
      "type": "flask",
      "port": 5001,
      "domain": "myapp.example.com",
      "runtime_status": {
        "active": true,
        "status": "running"
      }
    }
  ]
}
\`\`\`

### Start App
\`POST /api/apps/{slug}/start\`

### Stop App
\`POST /api/apps/{slug}/stop\`

### Get App Logs
\`GET /api/apps/{slug}/logs?lines=100\`

### Create New App
\`POST /api/apps\`

**Request Body:**
\`\`\`json
{
  "name": "My New App",
  "type": "flask",
  "port": 5002,
  "domain": "mynewapp.example.com"
}
\`\`\`
        `
      },
      'fastapi-apps': {
        title: 'FastAPI Applications',
        body: `
## FastAPI Application Deployment

### FastAPI App Structure
\`\`\`
fastapi-app/
├── main.py         # Main FastAPI application
├── requirements.txt
├── .env
├── routers/        # API route modules
├── models/         # Data models
└── static/         # Static files
\`\`\`

### Basic FastAPI Example
\`\`\`python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="My FastAPI App")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from ForgeBoard FastAPI!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "fastapi"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
\`\`\`

### Running with Uvicorn
\`\`\`python
# Add to main.py
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)
\`\`\`

### Requirements
\`\`\`txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
\`\`\`

### Advanced Features

#### Background Tasks
\`\`\`python
from fastapi import BackgroundTasks

def write_log(message: str):
    with open("log.txt", "a") as log:
        log.write(message)

@app.post("/send-notification/")
async def send_notification(
    email: str, 
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(write_log, f"Notification sent to {email}")
    return {"message": "Notification sent"}
\`\`\`

#### WebSocket Support
\`\`\`python
from fastapi import WebSocket

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message: {data}")
\`\`\`
        `
      },
      'django-apps': {
        title: 'Django Applications',
        body: `
## Django Application Deployment

### Django Project Structure
\`\`\`
django-app/
├── manage.py
├── requirements.txt
├── myproject/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   └── myapp/
├── static/
├── media/
└── templates/
\`\`\`

### Creating a Django App

1. **Start new project**
\`\`\`bash
django-admin startproject myproject
cd myproject
python manage.py startapp myapp
\`\`\`

2. **Configure settings.py**
\`\`\`python
# settings.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ForgeBoard specific settings
ALLOWED_HOSTS = ['myapp.example.com', 'localhost']

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Database (use environment variables)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'myapp'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
\`\`\`

3. **Create views**
\`\`\`python
# views.py
from django.http import JsonResponse
from django.shortcuts import render

def home(request):
    return JsonResponse({
        'message': 'Hello from ForgeBoard Django!',
        'status': 'active'
    })

def health(request):
    return JsonResponse({'status': 'healthy'})
\`\`\`

### Requirements
\`\`\`txt
Django==4.2.7
gunicorn==21.2.0
psycopg2-binary==2.9.9
django-cors-headers==4.3.0
python-decouple==3.8
whitenoise==6.6.0
\`\`\`

### Production Setup

1. **Collect static files**
\`\`\`bash
python manage.py collectstatic --noinput
\`\`\`

2. **Run migrations**
\`\`\`bash
python manage.py migrate
\`\`\`

3. **Create superuser**
\`\`\`bash
python manage.py createsuperuser
\`\`\`

### Gunicorn Configuration
\`\`\`python
# gunicorn_config.py
bind = "0.0.0.0:5003"
workers = 4
worker_class = "sync"
worker_connections = 1000
keepalive = 5
\`\`\`
        `
      },
      'env-vars': {
        title: 'Environment Variables',
        body: `
## Environment Variables Configuration

### Setting Environment Variables

Environment variables can be configured in ForgeBoard through:
1. The app creation wizard
2. App settings page
3. Direct file upload (.env file)
4. API endpoints

### Common Environment Variables

#### Database Configuration
\`\`\`bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secretpassword

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=myapp
MYSQL_USER=root
MYSQL_PASSWORD=secretpassword

# MongoDB
MONGODB_URI=mongodb://localhost:27017/myapp
\`\`\`

#### Application Settings
\`\`\`bash
# General
APP_ENV=production
DEBUG=False
SECRET_KEY=your-secret-key-here
API_KEY=your-api-key

# Flask specific
FLASK_APP=app.py
FLASK_ENV=production

# Django specific
DJANGO_SETTINGS_MODULE=myproject.settings
DJANGO_SECRET_KEY=your-django-secret

# FastAPI specific
UVICORN_HOST=0.0.0.0
UVICORN_PORT=5002
UVICORN_WORKERS=4
\`\`\`

#### External Services
\`\`\`bash
# Redis
REDIS_URL=redis://localhost:6379/0

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
\`\`\`

### Best Practices

1. **Never commit secrets**
   - Use .gitignore for .env files
   - Store secrets in ForgeBoard's secure storage

2. **Use descriptive names**
   - BAD: KEY=abc123
   - GOOD: STRIPE_API_KEY=abc123

3. **Provide defaults**
   \`\`\`python
   import os
   
   DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
   PORT = int(os.environ.get('PORT', 5000))
   \`\`\`

4. **Validate required variables**
   \`\`\`python
   required_vars = ['DATABASE_URL', 'SECRET_KEY']
   missing = [var for var in required_vars if not os.getenv(var)]
   
   if missing:
       raise EnvironmentError(f"Missing required env vars: {missing}")
   \`\`\`

### Loading Environment Variables

#### Python (python-dotenv)
\`\`\`python
from dotenv import load_dotenv
import os

load_dotenv()

database_url = os.getenv('DATABASE_URL')
\`\`\`

#### Using ForgeBoard's Auto-injection
ForgeBoard automatically injects configured environment variables into your app's process, so you can access them directly via os.environ.
        `
      },
      'domains': {
        title: 'Domain Configuration',
        body: `
## Domain Configuration

### Setting Up Domains

ForgeBoard supports multiple domain configuration methods:

1. **Subdomain routing**: app1.yourdomain.com
2. **Path-based routing**: yourdomain.com/app1
3. **Port-based access**: yourdomain.com:5001
4. **Custom domains**: customer-app.com

### DNS Configuration

#### A Record Setup
Point your domain to your server's IP:
\`\`\`
Type: A
Name: @ (or subdomain)
Value: 192.168.1.100 (your server IP)
TTL: 3600
\`\`\`

#### CNAME Setup (for subdomains)
\`\`\`
Type: CNAME
Name: app1
Value: yourdomain.com
TTL: 3600
\`\`\`

### NGINX Configuration

ForgeBoard automatically generates NGINX configs:

\`\`\`nginx
# /etc/nginx/sites-available/app-myapp
server {
    listen 80;
    server_name myapp.example.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
\`\`\`

### SSL/TLS Configuration

#### Using Let's Encrypt (Recommended)
\`\`\`bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d myapp.example.com

# Auto-renewal is configured automatically
\`\`\`

#### Manual SSL Certificate
\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name myapp.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:5001;
        # ... proxy headers
    }
}
\`\`\`

### Advanced Routing

#### Path-based Routing
\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /app1/ {
        proxy_pass http://localhost:5001/;
        proxy_set_header SCRIPT_NAME /app1;
    }

    location /app2/ {
        proxy_pass http://localhost:5002/;
        proxy_set_header SCRIPT_NAME /app2;
    }
}
\`\`\`

#### Load Balancing
\`\`\`nginx
upstream myapp_backend {
    server localhost:5001;
    server localhost:5002;
    server localhost:5003;
}

server {
    location / {
        proxy_pass http://myapp_backend;
    }
}
\`\`\`

### Troubleshooting

1. **Domain not resolving**
   - Check DNS propagation: \`nslookup myapp.example.com\`
   - Verify A/CNAME records

2. **502 Bad Gateway**
   - Check if app is running: \`systemctl status app-myapp\`
   - Verify port configuration

3. **SSL errors**
   - Check certificate validity: \`sudo certbot certificates\`
   - Ensure firewall allows port 443
        `
      },
      'auth': {
        title: 'Authentication',
        body: `
## API Authentication

### Authentication Methods

ForgeBoard supports multiple authentication methods:

1. **API Key Authentication** (Default)
2. **JWT Token Authentication**
3. **OAuth2 Integration**
4. **Basic Authentication**

### API Key Authentication

#### Generating API Keys
\`\`\`bash
# Via CLI
forgeboard api-key generate --name "Production Key"

# Via Dashboard
Settings > API Keys > Generate New Key
\`\`\`

#### Using API Keys
\`\`\`bash
# Header-based
curl -H "X-API-Key: your-api-key" http://localhost:5000/api/apps

# Query parameter
curl http://localhost:5000/api/apps?api_key=your-api-key
\`\`\`

#### Python Example
\`\`\`python
import requests

headers = {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
}

response = requests.get(
    'http://localhost:5000/api/apps',
    headers=headers
)
\`\`\`

### JWT Authentication

#### Login Endpoint
\`\`\`bash
POST /api/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "password"
}

# Response
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "expires_in": 3600
}
\`\`\`

#### Using JWT Tokens
\`\`\`python
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'http://localhost:5000/api/apps',
    headers=headers
)
\`\`\`

### OAuth2 Setup

#### Configure OAuth Provider
\`\`\`python
# config.py
OAUTH_PROVIDERS = {
    'github': {
        'client_id': 'your-client-id',
        'client_secret': 'your-client-secret',
        'authorize_url': 'https://github.com/login/oauth/authorize',
        'token_url': 'https://github.com/login/oauth/access_token',
        'scopes': ['user:email', 'read:user']
    }
}
\`\`\`

### Role-Based Access Control

#### User Roles
- **Admin**: Full access to all resources
- **Developer**: Create/manage own apps
- **Viewer**: Read-only access

#### Permission Decorators
\`\`\`python
from forgeboard.auth import require_role

@app.route('/api/admin/users')
@require_role('admin')
def list_users():
    return get_all_users()

@app.route('/api/apps/<app_id>')
@require_role(['developer', 'admin'])
def manage_app(app_id):
    return update_app(app_id)
\`\`\`

### Security Best Practices

1. **Rotate API Keys Regularly**
   - Set expiration dates
   - Monitor usage patterns
   - Revoke compromised keys immediately

2. **Use HTTPS Always**
   - Encrypt all API traffic
   - Implement HSTS headers

3. **Rate Limiting**
   \`\`\`python
   from flask_limiter import Limiter
   
   limiter = Limiter(
       app,
       key_func=lambda: get_api_key(),
       default_limits=["1000 per hour"]
   )
   
   @app.route('/api/apps')
   @limiter.limit("100 per minute")
   def list_apps():
       return get_apps()
   \`\`\`

4. **Audit Logging**
   - Log all authentication attempts
   - Track API key usage
   - Monitor for suspicious patterns
        `
      },
      'logs-api': {
        title: 'Logs API',
        body: `
## Logs API Reference

### Get App Logs

\`\`\`bash
GET /api/apps/{app_slug}/logs
\`\`\`

#### Query Parameters
- \`lines\`: Number of lines to return (default: 100)
- \`since\`: Timestamp to get logs since (ISO 8601)
- \`until\`: Timestamp to get logs until (ISO 8601)
- \`level\`: Filter by log level (info, warning, error)
- \`search\`: Search term to filter logs

#### Example Request
\`\`\`bash
curl -H "X-API-Key: your-key" \\
  "http://localhost:5000/api/apps/myapp/logs?lines=50&level=error"
\`\`\`

#### Response
\`\`\`json
{
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:45.123Z",
      "level": "error",
      "message": "Database connection failed",
      "app": "myapp",
      "source": "app.py:45"
    }
  ],
  "total_lines": 50,
  "has_more": true
}
\`\`\`

### Stream Logs (WebSocket)

\`\`\`javascript
const ws = new WebSocket('ws://localhost:5000/api/apps/myapp/logs/stream');

ws.onmessage = (event) => {
  const log = JSON.parse(event.data);
  console.log(\`[\${log.timestamp}] \${log.level}: \${log.message}\`);
};

// Send filters
ws.send(JSON.stringify({
  action: 'filter',
  level: 'error'
}));
\`\`\`

### Download Logs

\`\`\`bash
GET /api/apps/{app_slug}/logs/download
\`\`\`

#### Query Parameters
- \`format\`: Output format (txt, json, csv)
- \`compress\`: Compress output (gzip, zip)

### Clear Logs

\`\`\`bash
DELETE /api/apps/{app_slug}/logs
\`\`\`

#### Request Body
\`\`\`json
{
  "before": "2024-01-01T00:00:00Z",
  "keep_last": 1000
}
\`\`\`

### Log Aggregation

\`\`\`bash
GET /api/logs/aggregate
\`\`\`

#### Query Parameters
- \`apps\`: Comma-separated list of app slugs
- \`group_by\`: Grouping field (app, level, hour)
- \`metrics\`: Comma-separated metrics (count, errors_per_minute)

#### Response
\`\`\`json
{
  "aggregations": {
    "by_level": {
      "info": 1234,
      "warning": 56,
      "error": 12
    },
    "by_app": {
      "app1": 567,
      "app2": 890
    }
  }
}
\`\`\`

### Python Client Example

\`\`\`python
import requests
from datetime import datetime, timedelta

class ForgeboardLogsClient:
    def __init__(self, api_key, base_url="http://localhost:5000"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {'X-API-Key': api_key}
    
    def get_logs(self, app_slug, **params):
        url = f"{self.base_url}/api/apps/{app_slug}/logs"
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()
    
    def get_recent_errors(self, app_slug, hours=1):
        since = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
        return self.get_logs(app_slug, level='error', since=since)
    
    def search_logs(self, app_slug, search_term):
        return self.get_logs(app_slug, search=search_term)

# Usage
client = ForgeboardLogsClient('your-api-key')
errors = client.get_recent_errors('myapp', hours=24)
\`\`\`
        `
      },
      'system-api': {
        title: 'System API',
        body: `
## System API Reference

### System Health Check

\`\`\`bash
GET /api/system/health
\`\`\`

#### Response
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "services": {
    "api": "operational",
    "nginx": "operational",
    "systemd": "operational",
    "database": "operational"
  },
  "metrics": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 23.5,
    "uptime_seconds": 864000
  }
}
\`\`\`

### System Statistics

\`\`\`bash
GET /api/system/stats
\`\`\`

#### Response
\`\`\`json
{
  "apps": {
    "total": 15,
    "running": 12,
    "stopped": 3,
    "by_type": {
      "flask": 8,
      "fastapi": 5,
      "django": 2
    }
  },
  "resources": {
    "cpu": {
      "cores": 4,
      "usage_percent": 45.2,
      "load_average": [1.2, 1.5, 1.8]
    },
    "memory": {
      "total_gb": 16,
      "used_gb": 10.8,
      "available_gb": 5.2
    },
    "disk": {
      "total_gb": 100,
      "used_gb": 23.5,
      "free_gb": 76.5
    }
  }
}
\`\`\`

### NGINX Management

#### Reload NGINX
\`\`\`bash
POST /api/system/nginx/reload
\`\`\`

#### Test NGINX Config
\`\`\`bash
POST /api/system/nginx/test
\`\`\`

#### Get NGINX Status
\`\`\`bash
GET /api/system/nginx/status
\`\`\`

### Systemd Management

#### List All Services
\`\`\`bash
GET /api/system/services
\`\`\`

#### Service Control
\`\`\`bash
POST /api/system/services/{service_name}/start
POST /api/system/services/{service_name}/stop
POST /api/system/services/{service_name}/restart
GET /api/system/services/{service_name}/status
\`\`\`

### Backup and Restore

#### Create Backup
\`\`\`bash
POST /api/system/backup

{
  "include_apps": true,
  "include_configs": true,
  "include_logs": false,
  "compress": true
}
\`\`\`

#### List Backups
\`\`\`bash
GET /api/system/backups
\`\`\`

#### Restore Backup
\`\`\`bash
POST /api/system/restore

{
  "backup_id": "backup-2024-01-15-1030",
  "restore_apps": true,
  "restore_configs": true
}
\`\`\`

### System Configuration

#### Get Config
\`\`\`bash
GET /api/system/config
\`\`\`

#### Update Config
\`\`\`bash
PATCH /api/system/config

{
  "app_port_range": [5001, 5999],
  "max_apps_per_user": 10,
  "default_app_memory": "512M",
  "log_retention_days": 30
}
\`\`\`

### Monitoring Webhooks

#### Register Webhook
\`\`\`bash
POST /api/system/webhooks

{
  "url": "https://your-monitoring.com/webhook",
  "events": ["app_crash", "high_cpu", "disk_full"],
  "secret": "webhook-secret"
}
\`\`\`

### Python Admin Client

\`\`\`python
class ForgeboardAdmin:
    def __init__(self, api_key, base_url="http://localhost:5000"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {'X-API-Key': api_key}
    
    def get_system_health(self):
        response = requests.get(
            f"{self.base_url}/api/system/health",
            headers=self.headers
        )
        return response.json()
    
    def reload_nginx(self):
        response = requests.post(
            f"{self.base_url}/api/system/nginx/reload",
            headers=self.headers
        )
        return response.json()
    
    def create_backup(self, include_logs=False):
        response = requests.post(
            f"{self.base_url}/api/system/backup",
            headers=self.headers,
            json={
                "include_apps": True,
                "include_configs": True,
                "include_logs": include_logs,
                "compress": True
            }
        )
        return response.json()

# Usage
admin = ForgeboardAdmin('admin-api-key')
health = admin.get_system_health()
print(f"System status: {health['status']}")
\`\`\`
        `
      },
      'nginx': {
        title: 'NGINX Configuration',
        body: `
## NGINX Configuration Guide

### ForgeBoard NGINX Architecture

ForgeBoard automatically manages NGINX configurations for each deployed app:

\`\`\`
/etc/nginx/
├── nginx.conf              # Main config
├── sites-available/
│   ├── forgeboard         # ForgeBoard API
│   ├── app-myapp1         # App configs
│   └── app-myapp2
└── sites-enabled/         # Symlinks to active configs
\`\`\`

### Main NGINX Configuration

\`\`\`nginx
# /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript;

    # Include configs
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
\`\`\`

### App Configuration Template

\`\`\`nginx
# /etc/nginx/sites-available/app-{app_name}
upstream {app_name}_backend {
    server localhost:{port} fail_timeout=0;
}

server {
    listen 80;
    server_name {domain};

    # Logging
    access_log /var/log/nginx/{app_name}_access.log;
    error_log /var/log/nginx/{app_name}_error.log;

    # Proxy Settings
    location / {
        proxy_pass http://{app_name}_backend;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
        proxy_redirect off;
        proxy_buffering off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Files (if applicable)
    location /static/ {
        alias /var/www/apps/{app_name}/static/;
        expires 30d;
    }

    # Media Files
    location /media/ {
        alias /var/www/apps/{app_name}/media/;
        expires 30d;
    }
}
\`\`\`

### SSL Configuration

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name {domain};

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/{domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{domain}/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/{domain}/chain.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Rest of configuration...
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name {domain};
    return 301 https://$server_name$request_uri;
}
\`\`\`

### Performance Optimization

#### Caching Configuration
\`\`\`nginx
# Cache static content
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Cache API responses
location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 1m;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    add_header X-Cache-Status $upstream_cache_status;
}
\`\`\`

#### Rate Limiting
\`\`\`nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

server {
    # Apply rate limits
    location /api/ {
        limit_req zone=api burst=20 nodelay;
    }
    
    location /login {
        limit_req zone=login burst=5 nodelay;
    }
}
\`\`\`

### WebSocket Support

\`\`\`nginx
location /ws {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
\`\`\`

### Troubleshooting

#### Common Issues

1. **502 Bad Gateway**
   - Check if app is running: \`systemctl status app-{name}\`
   - Verify upstream port is correct
   - Check NGINX error logs: \`tail -f /var/log/nginx/error.log\`

2. **413 Request Entity Too Large**
   - Increase \`client_max_body_size\`
   - Check in both http and server blocks

3. **504 Gateway Timeout**
   - Increase proxy timeout values
   - Check if app is responding slowly

#### Useful Commands

\`\`\`bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo nginx -s reload

# View error logs
sudo tail -f /var/log/nginx/error.log

# Monitor connections
sudo nginx -V 2>&1 | grep -o with-http_stub_status_module
\`\`\`
        `
      },
      'systemd': {
        title: 'Systemd Services',
        body: `
## Systemd Service Management

### Service File Structure

ForgeBoard creates a systemd service for each app:

\`\`\`ini
# /etc/systemd/system/forgeboard-app-{app_name}.service
[Unit]
Description=ForgeBoard App - {app_name}
After=network.target nginx.service
Wants=nginx.service

[Service]
Type=exec
User=forgeboard
Group=forgeboard
WorkingDirectory=/var/www/apps/{app_name}

# Environment
Environment="PATH=/var/www/apps/{app_name}/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="PYTHONPATH=/var/www/apps/{app_name}"
EnvironmentFile=/var/www/apps/{app_name}/.env

# Start command
ExecStart=/var/www/apps/{app_name}/venv/bin/python app.py

# Restart policy
Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

# Process management
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/apps/{app_name}

# Resource limits
LimitNOFILE=65535
LimitNPROC=4096
MemoryMax=512M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
\`\`\`

### Common Service Commands

\`\`\`bash
# Start/stop/restart service
sudo systemctl start forgeboard-app-myapp
sudo systemctl stop forgeboard-app-myapp
sudo systemctl restart forgeboard-app-myapp

# Enable/disable auto-start
sudo systemctl enable forgeboard-app-myapp
sudo systemctl disable forgeboard-app-myapp

# Check status
sudo systemctl status forgeboard-app-myapp

# View logs
sudo journalctl -u forgeboard-app-myapp -f
sudo journalctl -u forgeboard-app-myapp --since "1 hour ago"

# Reload systemd after config changes
sudo systemctl daemon-reload
\`\`\`

### Advanced Configuration

#### Gunicorn Service
\`\`\`ini
[Service]
ExecStart=/var/www/apps/{app_name}/venv/bin/gunicorn \
    --workers 4 \
    --worker-class gevent \
    --bind 0.0.0.0:{port} \
    --access-logfile - \
    --error-logfile - \
    --timeout 120 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    app:app
\`\`\`

#### Uvicorn Service (FastAPI)
\`\`\`ini
[Service]
ExecStart=/var/www/apps/{app_name}/venv/bin/uvicorn \
    main:app \
    --host 0.0.0.0 \
    --port {port} \
    --workers 4 \
    --loop uvloop \
    --access-log \
    --use-colors
\`\`\`

### Service Dependencies

#### Database Dependency
\`\`\`ini
[Unit]
Description=My App requiring PostgreSQL
After=postgresql.service
Requires=postgresql.service
\`\`\`

#### Redis Dependency
\`\`\`ini
[Unit]
Description=My App requiring Redis
After=redis.service
Wants=redis.service
\`\`\`

### Resource Management

#### Memory Limits
\`\`\`ini
[Service]
# Hard limit
MemoryMax=1G
# Soft limit (warning)
MemoryHigh=768M
# Swap limit
MemorySwapMax=512M
\`\`\`

#### CPU Limits
\`\`\`ini
[Service]
# 50% of one CPU
CPUQuota=50%
# Use specific CPUs
CPUAffinity=0,1
# CPU shares (relative weight)
CPUShares=512
\`\`\`

### Health Checks

\`\`\`ini
[Service]
# Health check script
ExecStartPost=/usr/local/bin/wait-for-port.sh {port}
HealthCheck=/usr/local/bin/check-app-health.sh

# Watchdog
WatchdogSec=30s
\`\`\`

### Logging Configuration

\`\`\`ini
[Service]
# Syslog identifier
SyslogIdentifier={app_name}

# Log level
LogLevelMax=info

# Journal limits
LogRateLimitIntervalSec=30s
LogRateLimitBurst=1000

# Forward to syslog
StandardOutput=syslog
StandardError=syslog
\`\`\`

### Troubleshooting

#### Service Won't Start
\`\`\`bash
# Check status
sudo systemctl status forgeboard-app-myapp

# Check journal for errors
sudo journalctl -u forgeboard-app-myapp -n 50 --no-pager

# Verify service file
sudo systemd-analyze verify forgeboard-app-myapp.service
\`\`\`

#### Permission Issues
\`\`\`bash
# Check file ownership
ls -la /var/www/apps/myapp/

# Fix permissions
sudo chown -R forgeboard:forgeboard /var/www/apps/myapp/
sudo chmod -R 755 /var/www/apps/myapp/
\`\`\`

#### Resource Limit Hit
\`\`\`bash
# Check resource usage
systemctl show forgeboard-app-myapp | grep -E 'Memory|CPU'

# Monitor in real-time
systemd-cgtop
\`\`\`

### Best Practices

1. **Always use absolute paths** in ExecStart
2. **Set working directory** explicitly
3. **Use environment files** for secrets
4. **Enable restart policies** for reliability
5. **Set resource limits** to prevent runaway processes
6. **Use security features** (PrivateTmp, ProtectSystem)
7. **Configure proper logging** with rate limits
        `
      },
      'security': {
        title: 'Security Best Practices',
        body: `
## Security Best Practices

### Application Security

#### 1. Authentication & Authorization
\`\`\`python
# Use strong password hashing
from werkzeug.security import generate_password_hash, check_password_hash

password_hash = generate_password_hash('password', method='pbkdf2:sha256', salt_length=16)

# Implement session security
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)
\`\`\`

#### 2. Input Validation
\`\`\`python
from flask import request, abort
import re

def validate_input(data, pattern):
    if not re.match(pattern, data):
        abort(400, "Invalid input")
    return data

# Validate app names
app_name = validate_input(request.form['app_name'], r'^[a-zA-Z0-9_-]+$')

# SQL injection prevention (use ORM or parameterized queries)
from sqlalchemy import text

query = text("SELECT * FROM apps WHERE name = :name")
result = db.execute(query, name=app_name)
\`\`\`

#### 3. Rate Limiting
\`\`\`python
from flask_limiter import Limiter
from flask import request

limiter = Limiter(
    app,
    key_func=lambda: request.remote_addr,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    # Login logic
    pass
\`\`\`

### Server Security

#### System Hardening
\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Enable firewall
sudo ufw enable
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw allow 5000/tcp # ForgeBoard API

# Disable root SSH
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Install fail2ban
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
\`\`\`

#### File Permissions
\`\`\`bash
# Set proper ownership
sudo chown -R forgeboard:forgeboard /var/www/apps/
sudo chmod -R 755 /var/www/apps/

# Protect sensitive files
sudo chmod 600 /var/www/apps/*/. env
sudo chmod 600 /etc/forgeboard/config.yml

# Set proper umask
echo "umask 027" >> /etc/profile
\`\`\`

### SSL/TLS Configuration

#### Let's Encrypt Setup
\`\`\`bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
sudo systemctl enable certbot.timer
\`\`\`

#### Strong SSL Configuration
\`\`\`nginx
# Modern SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# HSTS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
\`\`\`

### Secret Management

#### Environment Variables
\`\`\`bash
# Never commit .env files
echo ".env" >> .gitignore

# Use strong secrets
openssl rand -hex 32  # Generate secure secret key

# Rotate secrets regularly
FORGEBOARD_SECRET_KEY_V2=new-secret-key
\`\`\`

#### Secure Storage
\`\`\`python
# Encrypt sensitive data
from cryptography.fernet import Fernet

# Generate key
key = Fernet.generate_key()

# Encrypt
cipher = Fernet(key)
encrypted_data = cipher.encrypt(b"sensitive data")

# Decrypt
decrypted_data = cipher.decrypt(encrypted_data)
\`\`\`

### Security Headers

\`\`\`python
from flask import Flask, make_response

@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response
\`\`\`

### Monitoring & Auditing

#### Logging Configuration
\`\`\`python
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
)

# Audit log
audit_logger = logging.getLogger('audit')
handler = RotatingFileHandler('audit.log', maxBytes=10485760, backupCount=10)
audit_logger.addHandler(handler)

# Log security events
audit_logger.info(f"Login attempt: {username} from {request.remote_addr}")
\`\`\`

#### Intrusion Detection
\`\`\`bash
# Install AIDE
sudo apt install aide

# Initialize database
sudo aideinit

# Regular checks
sudo aide --check
\`\`\`

### Incident Response

#### Backup Strategy
\`\`\`bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/backup/forgeboard"
DATE=$(date +%Y%m%d)

# Backup database
pg_dump forgeboard > $BACKUP_DIR/db_$DATE.sql

# Backup apps
tar -czf $BACKUP_DIR/apps_$DATE.tar.gz /var/www/apps/

# Backup configs
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /etc/forgeboard/

# Encrypt backups
gpg --encrypt --recipient backup@example.com $BACKUP_DIR/*_$DATE.*

# Remove old backups
find $BACKUP_DIR -name "*.gpg" -mtime +30 -delete
\`\`\`

### Security Checklist

- [ ] Enable firewall and configure rules
- [ ] Disable root SSH access
- [ ] Use SSH keys instead of passwords
- [ ] Keep system updated
- [ ] Install and configure fail2ban
- [ ] Set up SSL/TLS certificates
- [ ] Configure strong SSL ciphers
- [ ] Implement rate limiting
- [ ] Validate all user input
- [ ] Use parameterized database queries
- [ ] Set secure file permissions
- [ ] Configure security headers
- [ ] Enable audit logging
- [ ] Set up regular backups
- [ ] Create incident response plan
- [ ] Regular security audits
        `
      },
      'backup': {
        title: 'Backup & Recovery',
        body: `
## Backup & Recovery Guide

### Backup Strategy

ForgeBoard uses a comprehensive backup strategy covering:
1. Application code and configurations
2. Database data
3. Environment variables and secrets
4. NGINX configurations
5. System logs

### Automated Backups

#### Setup Automated Backups
\`\`\`bash
# Create backup script
sudo nano /usr/local/bin/forgeboard-backup.sh
\`\`\`

\`\`\`bash
#!/bin/bash
# ForgeBoard Backup Script

# Configuration
BACKUP_ROOT="/backup/forgeboard"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup apps
echo "Backing up applications..."
tar -czf $BACKUP_DIR/apps.tar.gz /var/www/apps/

# Backup ForgeBoard config
echo "Backing up ForgeBoard configuration..."
tar -czf $BACKUP_DIR/forgeboard-config.tar.gz /etc/forgeboard/

# Backup NGINX configs
echo "Backing up NGINX configurations..."
tar -czf $BACKUP_DIR/nginx-configs.tar.gz /etc/nginx/sites-available/app-*

# Backup systemd services
echo "Backing up systemd services..."
tar -czf $BACKUP_DIR/systemd-services.tar.gz /etc/systemd/system/forgeboard-app-*

# Backup database (if using PostgreSQL)
echo "Backing up database..."
sudo -u postgres pg_dump forgeboard > $BACKUP_DIR/database.sql

# Create backup manifest
echo "Creating manifest..."
cat > $BACKUP_DIR/manifest.json <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "version": "1.0",
  "apps_count": $(ls -1 /var/www/apps/ | wc -l),
  "backup_size": "$(du -sh $BACKUP_DIR | cut -f1)"
}
EOF

# Compress entire backup
echo "Compressing backup..."
cd $BACKUP_ROOT
tar -czf $DATE.tar.gz $DATE/
rm -rf $DATE/

# Remove old backups
echo "Cleaning old backups..."
find $BACKUP_ROOT -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_ROOT/$DATE.tar.gz"
\`\`\`

#### Schedule Backups
\`\`\`bash
# Make script executable
sudo chmod +x /usr/local/bin/forgeboard-backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/forgeboard-backup.sh >> /var/log/forgeboard-backup.log 2>&1
\`\`\`

### Manual Backup

#### Full System Backup
\`\`\`bash
# Create backup directory
sudo mkdir -p /backup/manual/$(date +%Y%m%d)
cd /backup/manual/$(date +%Y%m%d)

# Backup all components
sudo forgeboard backup create --full --output ./
\`\`\`

#### Selective Backup
\`\`\`bash
# Backup specific app
sudo forgeboard backup create --app myapp --output ./myapp-backup.tar.gz

# Backup only configs
sudo forgeboard backup create --configs-only --output ./configs-backup.tar.gz

# Backup with encryption
sudo forgeboard backup create --full --encrypt --password yourpassword
\`\`\`

### Recovery Procedures

#### Full System Recovery
\`\`\`bash
# 1. Install ForgeBoard on new system
# Follow installation guide first

# 2. Stop all services
sudo systemctl stop forgeboard
sudo systemctl stop nginx

# 3. Extract backup
cd /
sudo tar -xzf /path/to/backup.tar.gz

# 4. Restore database
sudo -u postgres psql < /backup/database.sql

# 5. Fix permissions
sudo chown -R forgeboard:forgeboard /var/www/apps/
sudo chmod -R 755 /var/www/apps/

# 6. Reload systemd
sudo systemctl daemon-reload

# 7. Start services
sudo systemctl start forgeboard
sudo systemctl start nginx

# 8. Verify apps
sudo forgeboard apps list
\`\`\`

#### Single App Recovery
\`\`\`bash
# Stop the app
sudo systemctl stop forgeboard-app-myapp

# Restore app files
sudo tar -xzf backup.tar.gz -C / var/www/apps/myapp/

# Restore app config
sudo tar -xzf backup.tar.gz -C / etc/nginx/sites-available/app-myapp

# Fix permissions
sudo chown -R forgeboard:forgeboard /var/www/apps/myapp/

# Restart app
sudo systemctl start forgeboard-app-myapp
\`\`\`

### Disaster Recovery Plan

#### 1. Preparation Phase
- Document server configurations
- Maintain off-site backups
- Test recovery procedures quarterly
- Keep recovery scripts updated

#### 2. Detection Phase
- Monitor system health
- Set up alerts for failures
- Log all incidents

#### 3. Recovery Phase
\`\`\`bash
#!/bin/bash
# Disaster Recovery Script

# Check system status
echo "Checking system health..."
forgeboard system health

# Identify failed components
FAILED_APPS=$(forgeboard apps list --status=failed)

# Attempt auto-recovery
for app in $FAILED_APPS; do
    echo "Attempting to recover $app..."
    forgeboard app recover $app
done

# If auto-recovery fails, restore from backup
if [ $? -ne 0 ]; then
    echo "Auto-recovery failed, restoring from backup..."
    /usr/local/bin/forgeboard-restore.sh
fi
\`\`\`

### Backup Storage

#### Local Storage
\`\`\`bash
# Create dedicated backup partition
sudo fdisk /dev/sdb  # Create partition
sudo mkfs.ext4 /dev/sdb1
sudo mkdir /backup
sudo mount /dev/sdb1 /backup

# Add to fstab
echo "/dev/sdb1 /backup ext4 defaults 0 2" | sudo tee -a /etc/fstab
\`\`\`

#### Remote Storage (S3)
\`\`\`bash
# Install AWS CLI
sudo apt install awscli

# Configure credentials
aws configure

# Sync backups to S3
aws s3 sync /backup/forgeboard/ s3://your-bucket/forgeboard-backups/

# Create sync script
cat > /usr/local/bin/sync-backups-s3.sh <<'EOF'
#!/bin/bash
aws s3 sync /backup/forgeboard/ s3://your-bucket/forgeboard-backups/ \
    --exclude "*.log" \
    --delete
EOF
\`\`\`

### Backup Verification

\`\`\`bash
#!/bin/bash
# Backup verification script

BACKUP_FILE=$1
TEMP_DIR=$(mktemp -d)

echo "Verifying backup: $BACKUP_FILE"

# Extract backup
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# Check manifest
if [ -f "$TEMP_DIR/manifest.json" ]; then
    echo "✓ Manifest found"
    cat $TEMP_DIR/manifest.json
else
    echo "✗ Manifest missing"
    exit 1
fi

# Verify components
for component in apps.tar.gz database.sql nginx-configs.tar.gz; do
    if [ -f "$TEMP_DIR/$component" ]; then
        echo "✓ $component found"
    else
        echo "✗ $component missing"
    fi
done

# Cleanup
rm -rf $TEMP_DIR
echo "Verification complete"
\`\`\`

### Best Practices

1. **3-2-1 Rule**
   - 3 copies of data
   - 2 different storage media
   - 1 off-site backup

2. **Regular Testing**
   - Test restores monthly
   - Document recovery times
   - Update procedures

3. **Security**
   - Encrypt sensitive backups
   - Restrict backup access
   - Audit backup operations

4. **Monitoring**
   - Alert on backup failures
   - Track backup sizes
   - Monitor storage usage
        `
      },
      'email-config': {
        title: 'Email Configuration',
        body: `
## Email Configuration Guide

ForgeBoard supports email notifications for password resets and user management through both SMTP and Microsoft 365 OAuth2.

### SMTP Configuration

#### Gmail Setup
1. **Enable 2-Factor Authentication** in your Google Account
2. **Generate App Password**:
   - Go to Google Account settings → Security
   - Select "2-Step Verification"
   - Select "App passwords"
   - Generate password for "Mail"
3. **Configure ForgeBoard**:
   - Host: \`smtp.gmail.com\`
   - Port: \`587\`
   - Username: Your Gmail address
   - Password: Generated app password
   - Enable TLS: ✓

#### Other SMTP Providers

**Outlook/Hotmail**:
\`\`\`
Host: smtp.live.com
Port: 587
TLS: Enabled
\`\`\`

**Yahoo Mail**:
\`\`\`
Host: smtp.mail.yahoo.com
Port: 587 or 465
TLS/SSL: Enabled
\`\`\`

**Custom SMTP**:
\`\`\`
Host: your-smtp-server.com
Port: 587 (TLS) or 465 (SSL)
Username: your-email@domain.com
Password: your-password
\`\`\`

### Microsoft 365 OAuth2 Setup

For enterprise environments using Microsoft 365, OAuth2 provides secure authentication without storing passwords.

#### Step 1: Register Application in Azure AD

1. **Access Azure Portal**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to "Azure Active Directory"

2. **Register New Application**:
   - Go to "App registrations" → "New registration"
   - **Name**: "ForgeBoard Email Service"
   - **Account types**: "Accounts in this organizational directory only"
   - **Redirect URI**: Leave blank (not needed for service-to-service)
   - Click "Register"

3. **Note Application Details**:
   - Copy **Application (client) ID**
   - Copy **Directory (tenant) ID**

#### Step 2: Configure API Permissions

1. **Add Mail Permissions**:
   - Go to "API permissions" → "Add a permission"
   - Select "Microsoft Graph" → "Application permissions"
   - Add: \`Mail.Send\`
   - Click "Grant admin consent"

2. **Verify Permissions**:
   - Ensure \`Mail.Send\` shows "Granted" status
   - Admin consent should be green checkmark

#### Step 3: Create Client Secret

1. **Generate Secret**:
   - Go to "Certificates & secrets" → "New client secret"
   - **Description**: "ForgeBoard Email Secret"
   - **Expires**: Choose appropriate duration (24 months recommended)
   - Click "Add"

2. **Copy Secret Value**:
   - **Important**: Copy the secret value immediately
   - This is the only time you'll see the full secret
   - Store securely - you'll need this for ForgeBoard

#### Step 4: Configure ForgeBoard

1. **Navigate to Email Settings**:
   - ForgeBoard Dashboard → Settings → Email (Admin only)
   - Select "Microsoft 365" provider

2. **Enter Configuration**:
   - **Tenant ID**: Directory (tenant) ID from Step 1
   - **Client ID**: Application (client) ID from Step 1
   - **Client Secret**: Secret value from Step 3
   - **Scope**: \`https://graph.microsoft.com/.default\` (default)

3. **Configure Sender**:
   - **From Email**: Service account email (e.g., \`noreply@yourdomain.com\`)
   - **From Name**: "ForgeBoard" or your organization name

#### Step 5: Test Configuration

1. **Test Email**:
   - Click "Test Email" in ForgeBoard settings
   - Check admin email inbox for test message
   - Verify logs for any errors

#### Troubleshooting OAuth2

**Common Issues**:

1. **"Insufficient privileges" Error**:
   - Ensure \`Mail.Send\` permission is added
   - Verify admin consent is granted
   - Check application permissions in Azure AD

2. **"Invalid client" Error**:
   - Verify Tenant ID and Client ID are correct
   - Ensure application is in correct directory

3. **"Invalid client secret" Error**:
   - Secret may have expired - generate new one
   - Ensure secret value copied correctly (no extra spaces)

4. **"Insufficient scope" Error**:
   - Verify scope is \`https://graph.microsoft.com/.default\`
   - Check API permissions are configured correctly

### Email Templates

ForgeBoard includes built-in email templates:

#### Password Reset Email
- **Subject**: "Password Reset Request - ForgeBoard"
- **Content**: Secure reset link with 60-minute expiration
- **HTML + Text**: Responsive design with ForgeBoard branding

#### Welcome Email
- **Subject**: "Welcome to ForgeBoard"
- **Content**: Account confirmation and getting started info
- **Customizable**: From name and organization details

### Security Considerations

1. **SMTP Security**:
   - Always use TLS/SSL encryption
   - Use app-specific passwords when available
   - Rotate passwords regularly

2. **OAuth2 Security**:
   - Limit client secret expiration (24 months max)
   - Use least-privilege permissions
   - Monitor application access logs

3. **General Best Practices**:
   - Test email configuration regularly
   - Monitor email delivery logs
   - Set up monitoring for failed sends
   - Use dedicated service accounts
        `
      },
      'ssl-config': {
        title: 'SSL Certificates',
        body: `
## SSL Certificate Configuration

ForgeBoard supports multiple SSL certificate management options for securing your applications with HTTPS.

### Local Certificate Signing Request (CSR) Generation

Generate and manage SSL certificates locally for internal or development use.

#### Step 1: Generate Private Key and CSR

\`\`\`bash
# Create directory for certificates
sudo mkdir -p /etc/ssl/forgeboard
cd /etc/ssl/forgeboard

# Generate private key (4096-bit RSA)
sudo openssl genrsa -out domain.key 4096

# Generate Certificate Signing Request (CSR)
sudo openssl req -new -key domain.key -out domain.csr

# You'll be prompted for certificate details:
# Country Name: US
# State: Your State
# City: Your City  
# Organization: Your Organization
# Organizational Unit: IT Department
# Common Name: yourdomain.com (IMPORTANT: Must match your domain)
# Email: admin@yourdomain.com
# Challenge password: (leave blank)
# Optional company name: (leave blank)
\`\`\`

#### Step 2: Self-Signed Certificate (Development)

\`\`\`bash
# Generate self-signed certificate (valid for 365 days)
sudo openssl x509 -req -days 365 -in domain.csr -signkey domain.key -out domain.crt

# Create combined certificate file
sudo cat domain.crt > domain-fullchain.crt

# Set appropriate permissions
sudo chmod 600 domain.key
sudo chmod 644 domain.crt domain-fullchain.crt
sudo chown root:root domain.*
\`\`\`

#### Step 3: Commercial Certificate Authority

1. **Submit CSR to CA**:
   - Purchase SSL certificate from trusted CA (DigiCert, Sectigo, etc.)
   - Submit the \`domain.csr\` file during certificate request
   - Complete domain validation process

2. **Install CA Certificate**:
   \`\`\`bash
   # Download certificate files from CA:
   # - domain.crt (your certificate)
   # - intermediate.crt (intermediate certificate)
   # - root.crt (root certificate - optional)

   # Create full certificate chain
   sudo cat domain.crt intermediate.crt > domain-fullchain.crt
   \`\`\`

#### Step 4: Configure ForgeBoard

1. **Add Certificate to ForgeBoard**:
   - Navigate to Settings → SSL Certificates (Admin only)
   - Upload certificate files:
     - **Private Key**: \`domain.key\`
     - **Certificate**: \`domain-fullchain.crt\`
     - **Domain**: \`yourdomain.com\`

### Let's Encrypt with Cloudflare DNS Challenge

Automate SSL certificate management using Let's Encrypt and Cloudflare DNS validation.

#### Prerequisites

1. **Domain managed by Cloudflare**:
   - Add domain to Cloudflare
   - Update nameservers at domain registrar
   - Verify DNS is working through Cloudflare

2. **Cloudflare API Token**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - Create Token → Custom token
   - **Permissions**:
     - Zone:Zone:Read
     - Zone:DNS:Edit
   - **Zone Resources**: Include → Specific zone → yourdomain.com
   - Copy token securely

#### Step 1: Install Certbot and Cloudflare Plugin

\`\`\`bash
# Install certbot and cloudflare plugin
sudo apt update
sudo apt install -y certbot python3-certbot-dns-cloudflare

# For older Ubuntu versions, use snap:
# sudo snap install certbot --classic
# sudo snap install certbot-dns-cloudflare
\`\`\`

#### Step 2: Configure Cloudflare Credentials

\`\`\`bash
# Create credentials file
sudo mkdir -p /etc/letsencrypt
sudo nano /etc/letsencrypt/cloudflare.ini

# Add your Cloudflare API token:
dns_cloudflare_api_token = your_cloudflare_api_token_here

# Or use Global API Key (less secure):
# dns_cloudflare_email = your-email@domain.com
# dns_cloudflare_api_key = your_global_api_key

# Set secure permissions
sudo chmod 600 /etc/letsencrypt/cloudflare.ini
\`\`\`

#### Step 3: Generate Let's Encrypt Certificate

\`\`\`bash
# Generate certificate using DNS challenge
sudo certbot certonly \\
  --dns-cloudflare \\
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \\
  --dns-cloudflare-propagation-seconds 20 \\
  -d yourdomain.com \\
  -d *.yourdomain.com \\
  --agree-tos \\
  --email admin@yourdomain.com \\
  --non-interactive

# Certificate files will be created at:
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
\`\`\`

#### Step 4: Configure Auto-Renewal

\`\`\`bash
# Test renewal process
sudo certbot renew --dry-run

# Create renewal hook for ForgeBoard
sudo nano /etc/letsencrypt/renewal-hooks/deploy/forgeboard-reload.sh

# Add the following script:
#!/bin/bash
# Reload ForgeBoard SSL configurations after certificate renewal

# Restart NGINX to load new certificates
systemctl reload nginx

# Optional: Notify ForgeBoard of certificate update
curl -X POST http://localhost:5000/api/admin/ssl/reload \\
  -H "Authorization: Bearer \$FORGEBOARD_API_KEY" \\
  -H "Content-Type: application/json"

# Log renewal
echo "$(date): SSL certificates renewed for ForgeBoard" >> /var/log/forgeboard-ssl.log

# Make script executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/forgeboard-reload.sh

# Certbot auto-renewal is typically set up via cron or systemd timer
# Verify with: sudo systemctl status certbot.timer
\`\`\`

#### Step 5: Configure ForgeBoard for Let's Encrypt

1. **Add Certificate Path to ForgeBoard**:
   - Settings → SSL Certificates → Add Certificate
   - **Type**: Let's Encrypt
   - **Domain**: \`yourdomain.com\`
   - **Private Key Path**: \`/etc/letsencrypt/live/yourdomain.com/privkey.pem\`
   - **Certificate Path**: \`/etc/letsencrypt/live/yourdomain.com/fullchain.pem\`
   - **Auto-Renewal**: Enabled

#### Advanced Configuration

**Multiple Domains**:
\`\`\`bash
# Certificate for multiple domains
sudo certbot certonly \\
  --dns-cloudflare \\
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \\
  -d domain1.com -d www.domain1.com \\
  -d domain2.com -d www.domain2.com \\
  -d *.domain1.com
\`\`\`

**Custom Challenge Settings**:
\`\`\`bash
# Longer propagation time for slower DNS
sudo certbot certonly \\
  --dns-cloudflare \\
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \\
  --dns-cloudflare-propagation-seconds 60 \\
  -d yourdomain.com
\`\`\`

### SSL Configuration Best Practices

#### NGINX SSL Configuration

ForgeBoard automatically generates secure NGINX configurations:

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Strong SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    # Application proxy
    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}
\`\`\`

#### Certificate Monitoring

**Set up monitoring**:
\`\`\`bash
# Check certificate expiry
sudo certbot certificates

# Create monitoring script
sudo nano /usr/local/bin/check-ssl-expiry.sh

#!/bin/bash
# Check SSL certificate expiry for ForgeBoard domains

DOMAINS=("yourdomain.com" "api.yourdomain.com")
ALERT_DAYS=30

for domain in "\${DOMAINS[@]}"; do
    expiry=$(echo | openssl s_client -servername \$domain -connect \$domain:443 2>/dev/null | \\
             openssl x509 -noout -enddate | cut -d= -f2)
    expiry_epoch=$(date -d "\$expiry" +%s)
    current_epoch=$(date +%s)
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [ \$days_until_expiry -lt \$ALERT_DAYS ]; then
        echo "WARNING: \$domain certificate expires in \$days_until_expiry days"
        # Send notification (email, webhook, etc.)
    else
        echo "OK: \$domain certificate expires in \$days_until_expiry days"
    fi
done

# Make executable and add to cron
sudo chmod +x /usr/local/bin/check-ssl-expiry.sh
echo "0 6 * * * /usr/local/bin/check-ssl-expiry.sh" | sudo crontab -
\`\`\`

### Troubleshooting SSL Issues

#### Common Problems

1. **Certificate Not Trusted**:
   \`\`\`bash
   # Check certificate chain
   openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
   
   # Verify certificate files
   openssl x509 -in /path/to/certificate.crt -text -noout
   \`\`\`

2. **Let's Encrypt Rate Limits**:
   - Let's Encrypt has rate limits (50 certificates per domain per week)
   - Use staging environment for testing: \`--test-cert\`
   - Check rate limits: [Let's Encrypt Rate Limits](https://letsencrypt.org/docs/rate-limits/)

3. **Cloudflare DNS Issues**:
   \`\`\`bash
   # Test DNS propagation
   dig TXT _acme-challenge.yourdomain.com
   
   # Check Cloudflare API access
   curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \\
        -H "Authorization: Bearer your_api_token"
   \`\`\`

4. **Permission Issues**:
   \`\`\`bash
   # Fix certificate permissions
   sudo chmod 600 /etc/letsencrypt/live/*/privkey.pem
   sudo chmod 644 /etc/letsencrypt/live/*/fullchain.pem
   sudo chown root:root /etc/letsencrypt/live/*/
   \`\`\`

#### SSL Testing Tools

- **SSL Labs Test**: https://www.ssllabs.com/ssltest/
- **Certificate Transparency**: https://crt.sh/
- **Local Testing**:
  \`\`\`bash
  # Test SSL configuration
  openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
  
  # Check certificate chain
  curl -vI https://yourdomain.com
  \`\`\`
        `
      },
      'common-issues': {
        title: 'Common Issues',
        body: `
## Troubleshooting Common Issues

### App Won't Start

#### Issue: App crashes immediately after starting
\`\`\`bash
# Check app status
sudo systemctl status forgeboard-app-myapp

# View recent logs
sudo journalctl -u forgeboard-app-myapp -n 50
\`\`\`

**Common Causes:**
1. **Missing dependencies**
   \`\`\`bash
   cd /var/www/apps/myapp
   source venv/bin/activate
   pip install -r requirements.txt
   \`\`\`

2. **Port already in use**
   \`\`\`bash
   sudo lsof -i :5001
   # Kill the process or change app port
   \`\`\`

3. **Permission issues**
   \`\`\`bash
   sudo chown -R forgeboard:forgeboard /var/www/apps/myapp/
   sudo chmod -R 755 /var/www/apps/myapp/
   \`\`\`

4. **Environment variables missing**
   \`\`\`bash
   # Check .env file
   cat /var/www/apps/myapp/.env
   
   # Add missing variables
   echo "DATABASE_URL=postgresql://..." >> /var/www/apps/myapp/.env
   \`\`\`

### NGINX Errors

#### 502 Bad Gateway
**Meaning:** NGINX can't connect to your app

\`\`\`bash
# Check if app is running
sudo systemctl is-active forgeboard-app-myapp

# Check NGINX error log
sudo tail -f /var/log/nginx/error.log

# Verify upstream configuration
sudo nginx -t
\`\`\`

**Solutions:**
1. Start the app if it's not running
2. Check if app is listening on correct port
3. Verify NGINX upstream configuration

#### 504 Gateway Timeout
**Meaning:** App is too slow to respond

\`\`\`nginx
# Increase timeout in NGINX config
location / {
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}
\`\`\`

### Database Connection Issues

#### PostgreSQL Connection Refused
\`\`\`bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Test connection
psql -h localhost -U postgres -d forgeboard
\`\`\`

**Solutions:**
1. **Start PostgreSQL**
   \`\`\`bash
   sudo systemctl start postgresql
   \`\`\`

2. **Check pg_hba.conf**
   \`\`\`bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   # Add: local all all md5
   sudo systemctl restart postgresql
   \`\`\`

3. **Verify connection string**
   \`\`\`python
   # Correct format
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   \`\`\`

### Memory Issues

#### App Killed Due to OOM
\`\`\`bash
# Check system memory
free -h

# Check app memory usage
sudo systemctl status forgeboard-app-myapp | grep Memory

# View OOM killer logs
sudo dmesg | grep -i "killed process"
\`\`\`

**Solutions:**
1. **Increase memory limit**
   \`\`\`ini
   # Edit service file
   sudo nano /etc/systemd/system/forgeboard-app-myapp.service
   
   [Service]
   MemoryMax=1G
   \`\`\`

2. **Optimize app memory usage**
   - Use connection pooling
   - Implement caching
   - Process data in chunks

### SSL Certificate Issues

#### Certificate Expired
\`\`\`bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Restart NGINX
sudo systemctl restart nginx
\`\`\`

#### Mixed Content Warnings
Ensure all resources use HTTPS:
\`\`\`python
# Flask
@app.before_request
def force_https():
    if not request.is_secure:
        return redirect(request.url.replace('http://', 'https://'))
\`\`\`

### Performance Issues

#### Slow Response Times
1. **Enable caching**
   \`\`\`python
   from flask_caching import Cache
   
   cache = Cache(config={'CACHE_TYPE': 'simple'})
   
   @app.route('/data')
   @cache.cached(timeout=300)
   def get_data():
       return expensive_operation()
   \`\`\`

2. **Add database indexes**
   \`\`\`sql
   CREATE INDEX idx_apps_user_id ON apps(user_id);
   CREATE INDEX idx_logs_timestamp ON logs(timestamp);
   \`\`\`

3. **Use connection pooling**
   \`\`\`python
   from sqlalchemy.pool import QueuePool
   
   engine = create_engine(
       DATABASE_URL,
       poolclass=QueuePool,
       pool_size=20,
       max_overflow=40
   )
   \`\`\`

### File Upload Issues

#### 413 Request Entity Too Large
\`\`\`nginx
# Increase NGINX upload limit
http {
    client_max_body_size 100M;
}

# Also in location block
location / {
    client_max_body_size 100M;
}
\`\`\`

\`\`\`python
# Increase Flask upload limit
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB
\`\`\`

### Permission Denied Errors

#### Cannot Write to Log File
\`\`\`bash
# Check file ownership
ls -la /var/log/forgeboard/

# Fix ownership
sudo chown forgeboard:forgeboard /var/log/forgeboard/
sudo chmod 755 /var/log/forgeboard/

# For systemd logs
sudo usermod -a -G systemd-journal forgeboard
\`\`\`

### Docker/Container Issues

#### Container Can't Connect to Host Services
\`\`\`yaml
# docker-compose.yml
services:
  app:
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      DATABASE_URL: postgresql://user:pass@host.docker.internal:5432/db
\`\`\`

### Quick Diagnostic Commands

\`\`\`bash
# System health check
forgeboard system health

# Check all app statuses
forgeboard apps status

# View recent errors
journalctl -p err -n 50

# Check disk space
df -h

# Check system load
top -n 1 -b | head -20

# Network connections
sudo netstat -tlnp

# Process list
ps aux | grep forgeboard
\`\`\`

### Emergency Recovery

\`\`\`bash
#!/bin/bash
# Emergency recovery script

# Stop all services
sudo systemctl stop forgeboard
sudo systemctl stop nginx

# Clear temp files
sudo rm -rf /tmp/forgeboard-*

# Reset permissions
sudo chown -R forgeboard:forgeboard /var/www/apps/
sudo chmod -R 755 /var/www/apps/

# Restart services
sudo systemctl start forgeboard
sudo systemctl start nginx

# Check status
forgeboard system health
\`\`\`
        `
      },
      'debug': {
        title: 'Debug Mode',
        body: `
## Debug Mode & Troubleshooting

### Enabling Debug Mode

#### Application Level Debug
\`\`\`python
# Flask Debug Mode
import os

app = Flask(__name__)
app.config['DEBUG'] = os.environ.get('DEBUG', 'False').lower() == 'true'

# Enhanced error pages
if app.debug:
    from werkzeug.debug import DebuggedApplication
    app.wsgi_app = DebuggedApplication(app.wsgi_app, True)

# Debug logging
if app.debug:
    app.logger.setLevel(logging.DEBUG)
\`\`\`

#### System Level Debug
\`\`\`bash
# Enable ForgeBoard debug mode
sudo nano /etc/forgeboard/config.yml

debug: true
log_level: DEBUG

# Restart ForgeBoard
sudo systemctl restart forgeboard
\`\`\`

### Debug Logging

#### Configure Detailed Logging
\`\`\`python
import logging
from logging.handlers import RotatingFileHandler
import traceback

# Setup debug logger
def setup_debug_logging(app):
    if app.debug:
        # File handler
        file_handler = RotatingFileHandler(
            'debug.log', 
            maxBytes=10485760, 
            backupCount=10
        )
        file_handler.setLevel(logging.DEBUG)
        
        # Detailed formatter
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s in %(module)s.%(funcName)s (%(pathname)s:%(lineno)d):\\n%(message)s'
        )
        file_handler.setFormatter(formatter)
        
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.DEBUG)
        
        # Log all requests
        @app.before_request
        def log_request():
            app.logger.debug(f'Request: {request.method} {request.url}')
            app.logger.debug(f'Headers: {dict(request.headers)}')
            app.logger.debug(f'Body: {request.get_data()}')
        
        # Log all responses
        @app.after_request
        def log_response(response):
            app.logger.debug(f'Response: {response.status}')
            return response
        
        # Log all exceptions
        @app.errorhandler(Exception)
        def log_exception(error):
            app.logger.error(f'Exception: {error}')
            app.logger.error(traceback.format_exc())
            raise
\`\`\`

### Debug Tools

#### Interactive Debugger
\`\`\`python
# Using pdb
import pdb

@app.route('/debug-endpoint')
def debug_endpoint():
    data = request.get_json()
    pdb.set_trace()  # Breakpoint
    result = process_data(data)
    return jsonify(result)

# Using ipdb (enhanced pdb)
import ipdb

def complex_function():
    ipdb.set_trace()
    # Debug interactively
\`\`\`

#### Remote Debugging
\`\`\`python
# Using debugpy (VS Code)
import debugpy

if app.debug:
    debugpy.listen(("0.0.0.0", 5678))
    print("Waiting for debugger attach...")
    debugpy.wait_for_client()
\`\`\`

### Performance Profiling

#### CPU Profiling
\`\`\`python
import cProfile
import pstats
from functools import wraps

def profile(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        result = func(*args, **kwargs)
        profiler.disable()
        
        # Save stats
        profiler.dump_stats(f'profile_{func.__name__}.prof')
        
        # Print summary
        stats = pstats.Stats(profiler)
        stats.sort_stats('cumulative')
        stats.print_stats(10)
        
        return result
    return wrapper

@app.route('/slow-endpoint')
@profile
def slow_endpoint():
    # Your code here
    pass
\`\`\`

#### Memory Profiling
\`\`\`python
from memory_profiler import profile

@profile
def memory_intensive_function():
    # Your code here
    large_list = [i for i in range(1000000)]
    return sum(large_list)

# Run with: python -m memory_profiler app.py
\`\`\`

### Request Debugging

#### Request Inspection Middleware
\`\`\`python
class DebugMiddleware:
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        # Log request details
        print(f"Method: {environ['REQUEST_METHOD']}")
        print(f"Path: {environ['PATH_INFO']}")
        print(f"Query: {environ.get('QUERY_STRING', '')}")
        
        # Time the request
        import time
        start_time = time.time()
        
        def custom_start_response(status, headers):
            elapsed = time.time() - start_time
            print(f"Response: {status} in {elapsed:.3f}s")
            return start_response(status, headers)
        
        return self.app(environ, custom_start_response)

app.wsgi_app = DebugMiddleware(app.wsgi_app)
\`\`\`

### Database Query Debugging

#### SQL Query Logging
\`\`\`python
# SQLAlchemy query logging
import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Or more detailed
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    print(f"Query: {statement}")
    print(f"Params: {parameters}")
\`\`\`

#### Query Performance Analysis
\`\`\`python
from sqlalchemy import event
import time

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info['query_start_time'].pop(-1)
    if total > 0.1:  # Log slow queries
        print(f"Slow query ({total:.3f}s): {statement[:100]}...")
\`\`\`

### Network Debugging

#### Request/Response Inspection
\`\`\`bash
# Monitor HTTP traffic
sudo tcpdump -i any -A 'tcp port 5000'

# Monitor specific app
sudo tcpdump -i any -A 'tcp port 5001 and host localhost'

# Save to file for analysis
sudo tcpdump -i any -w debug.pcap 'tcp port 5000'
# Analyze with Wireshark
\`\`\`

### Debug Environment Variables

\`\`\`bash
# .env.debug
DEBUG=True
FLASK_ENV=development
LOG_LEVEL=DEBUG
SQLALCHEMY_ECHO=True
EXPLAIN_TEMPLATE_LOADING=True
PROPAGATE_EXCEPTIONS=True
TRAP_HTTP_EXCEPTIONS=True
\`\`\`

### Debug Dashboard

\`\`\`python
# Flask-DebugToolbar
from flask_debugtoolbar import DebugToolbarExtension

app.config['DEBUG_TB_ENABLED'] = app.debug
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
toolbar = DebugToolbarExtension(app)

# Custom debug endpoint
@app.route('/debug-info')
def debug_info():
    if not app.debug:
        abort(404)
    
    return jsonify({
        'config': dict(app.config),
        'routes': [str(rule) for rule in app.url_map.iter_rules()],
        'env': dict(os.environ),
        'python_version': sys.version,
        'app_root': app.root_path,
        'instance_path': app.instance_path
    })
\`\`\`

### Production Debug (Careful!)

\`\`\`python
# Temporary debug logging in production
import functools

def debug_in_production(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        import uuid
        request_id = str(uuid.uuid4())[:8]
        
        app.logger.info(f"[{request_id}] Starting {func.__name__}")
        try:
            result = func(*args, **kwargs)
            app.logger.info(f"[{request_id}] Completed successfully")
            return result
        except Exception as e:
            app.logger.error(f"[{request_id}] Failed with: {e}")
            app.logger.error(traceback.format_exc())
            raise
    
    return wrapper

# Use sparingly!
@app.route('/problematic-endpoint')
@debug_in_production
def problematic_endpoint():
    # Your code
    pass
\`\`\`

### Debug Best Practices

1. **Never enable debug mode in production**
2. **Use environment-specific configurations**
3. **Sanitize debug output (remove secrets)**
4. **Set up proper log rotation**
5. **Use correlation IDs for request tracking**
6. **Monitor debug log file sizes**
7. **Remove debug code before deploying**
        `
      },
      'log-analysis': {
        title: 'Log Analysis',
        body: `
## Log Analysis Guide

### Log Structure

#### ForgeBoard Log Format
\`\`\`
[timestamp] [level] [component] [app_name] message
2024-01-15T10:30:45.123Z INFO api.apps myapp Application started successfully
\`\`\`

### Log Aggregation

#### Centralized Logging Setup
\`\`\`bash
# Install Elasticsearch, Logstash, Kibana (ELK Stack)
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-7.x.list
sudo apt update
sudo apt install elasticsearch logstash kibana

# Configure Logstash
sudo nano /etc/logstash/conf.d/forgeboard.conf
\`\`\`

\`\`\`ruby
input {
  file {
    path => "/var/log/forgeboard/*.log"
    start_position => "beginning"
    codec => multiline {
      pattern => "^\\[%{TIMESTAMP_ISO8601}\\]"
      negate => true
      what => "previous"
    }
  }
}

filter {
  grok {
    match => {
      "message" => "\\[%{TIMESTAMP_ISO8601:timestamp}\\] %{LOGLEVEL:level} %{DATA:component} %{DATA:app_name} %{GREEDYDATA:log_message}"
    }
  }
  
  date {
    match => [ "timestamp", "ISO8601" ]
  }
  
  mutate {
    add_field => { "environment" => "production" }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "forgeboard-%{+YYYY.MM.dd}"
  }
}
\`\`\`

### Log Analysis Tools

#### Using grep and awk
\`\`\`bash
# Find all errors
grep -i error /var/log/forgeboard/*.log

# Count errors by app
grep -i error /var/log/forgeboard/*.log | awk '{print $4}' | sort | uniq -c

# Find errors in time range
grep "2024-01-15T1[0-2]:" /var/log/forgeboard/*.log | grep -i error

# Extract unique error messages
grep -i error /var/log/forgeboard/*.log | awk -F'] ' '{print $NF}' | sort | uniq

# Top 10 most frequent log messages
awk -F'] ' '{print $NF}' /var/log/forgeboard/*.log | sort | uniq -c | sort -rn | head -10
\`\`\`

#### Log Analysis Script
\`\`\`python
#!/usr/bin/env python3
import re
import json
from collections import defaultdict, Counter
from datetime import datetime, timedelta

class LogAnalyzer:
    def __init__(self, log_file):
        self.log_file = log_file
        self.pattern = re.compile(
            r'\\[([^]]+)\\] (\\w+) ([\\w.]+) (\\w+) (.+)'
        )
    
    def parse_logs(self):
        logs = []
        with open(self.log_file, 'r') as f:
            for line in f:
                match = self.pattern.match(line)
                if match:
                    logs.append({
                        'timestamp': datetime.fromisoformat(match.group(1)),
                        'level': match.group(2),
                        'component': match.group(3),
                        'app': match.group(4),
                        'message': match.group(5)
                    })
        return logs
    
    def analyze_errors(self, logs):
        errors = [log for log in logs if log['level'] == 'ERROR']
        
        # Group errors by app
        errors_by_app = defaultdict(list)
        for error in errors:
            errors_by_app[error['app']].append(error)
        
        # Find error patterns
        error_messages = [e['message'] for e in errors]
        error_patterns = Counter(error_messages)
        
        return {
            'total_errors': len(errors),
            'errors_by_app': {app: len(errs) for app, errs in errors_by_app.items()},
            'top_errors': error_patterns.most_common(10),
            'error_timeline': self.create_timeline(errors)
        }
    
    def create_timeline(self, logs, interval_minutes=60):
        timeline = defaultdict(int)
        for log in logs:
            bucket = log['timestamp'].replace(
                minute=log['timestamp'].minute // interval_minutes * interval_minutes,
                second=0, 
                microsecond=0
            )
            timeline[bucket] += 1
        return dict(timeline)
    
    def find_anomalies(self, logs):
        # Detect sudden spikes in error rates
        error_timeline = self.create_timeline(
            [l for l in logs if l['level'] == 'ERROR'], 
            interval_minutes=10
        )
        
        anomalies = []
        times = sorted(error_timeline.keys())
        for i in range(1, len(times)):
            current_count = error_timeline[times[i]]
            prev_count = error_timeline[times[i-1]]
            
            if prev_count > 0 and current_count > prev_count * 3:
                anomalies.append({
                    'time': times[i],
                    'spike': current_count / prev_count,
                    'count': current_count
                })
        
        return anomalies

# Usage
analyzer = LogAnalyzer('/var/log/forgeboard/api.log')
logs = analyzer.parse_logs()
error_analysis = analyzer.analyze_errors(logs)
anomalies = analyzer.find_anomalies(logs)

print(json.dumps(error_analysis, indent=2, default=str))
\`\`\`

### Real-time Log Monitoring

#### Using tail and watch
\`\`\`bash
# Watch logs in real-time
tail -f /var/log/forgeboard/*.log

# Watch for errors only
tail -f /var/log/forgeboard/*.log | grep -i error

# Colorize output
tail -f /var/log/forgeboard/*.log | grep --color=auto -E "ERROR|WARNING|$"

# Monitor multiple apps
multitail /var/log/forgeboard/app1.log /var/log/forgeboard/app2.log
\`\`\`

#### Log Streaming Dashboard
\`\`\`python
from flask import Flask, render_template
from flask_socketio import SocketIO
import tailer

app = Flask(__name__)
socketio = SocketIO(app)

def follow_logs():
    for line in tailer.follow(open('/var/log/forgeboard/api.log')):
        socketio.emit('log_line', {'data': line})

@app.route('/logs/live')
def live_logs():
    return render_template('live_logs.html')

# Start background task
socketio.start_background_task(follow_logs)
\`\`\`

### Pattern Recognition

#### Common Error Patterns
\`\`\`bash
#!/bin/bash
# Find common error patterns

LOG_FILE="/var/log/forgeboard/api.log"

echo "=== Database Connection Errors ==="
grep -i "connection refused\\|connection timeout" $LOG_FILE | tail -5

echo "\\n=== Memory Errors ==="
grep -i "memory\\|oom\\|killed" $LOG_FILE | tail -5

echo "\\n=== Permission Errors ==="
grep -i "permission denied\\|access denied" $LOG_FILE | tail -5

echo "\\n=== Import/Module Errors ==="
grep -i "importerror\\|modulenotfound" $LOG_FILE | tail -5

echo "\\n=== Timeout Errors ==="
grep -i "timeout\\|timed out" $LOG_FILE | tail -5
\`\`\`

### Performance Analysis

#### Response Time Analysis
\`\`\`python
import re
from statistics import mean, median, stdev

# Parse response times from logs
response_times = []
pattern = re.compile(r'Response time: (\\d+)ms')

with open('/var/log/forgeboard/api.log') as f:
    for line in f:
        match = pattern.search(line)
        if match:
            response_times.append(int(match.group(1)))

# Analyze
print(f"Average: {mean(response_times):.2f}ms")
print(f"Median: {median(response_times)}ms")
print(f"Std Dev: {stdev(response_times):.2f}ms")
print(f"95th percentile: {sorted(response_times)[int(len(response_times)*0.95)]}ms")

# Find slow requests
slow_requests = [t for t in response_times if t > 1000]
print(f"Requests over 1s: {len(slow_requests)} ({len(slow_requests)/len(response_times)*100:.1f}%)")
\`\`\`

### Log Rotation Analysis

\`\`\`bash
# Analyze log growth
#!/bin/bash

LOG_DIR="/var/log/forgeboard"
DAYS=7

echo "Log growth analysis for past $DAYS days:"
echo "======================================="

for i in $(seq 0 $DAYS); do
    DATE=$(date -d "$i days ago" +%Y-%m-%d)
    SIZE=$(find $LOG_DIR -name "*$DATE*" -exec du -ch {} + | grep total | awk '{print $1}')
    echo "$DATE: \${SIZE:-0}"
done

# Find large log files
echo "\\nLarge log files (>100MB):"
find $LOG_DIR -size +100M -exec ls -lh {} \\;
\`\`\`

### Alert Rules

\`\`\`python
# log_alerts.py
import re
from datetime import datetime, timedelta

class LogAlertSystem:
    def __init__(self):
        self.alert_rules = [
            {
                'name': 'High Error Rate',
                'pattern': r'ERROR',
                'threshold': 10,
                'window_minutes': 5,
                'severity': 'critical'
            },
            {
                'name': 'Database Connection Issues',
                'pattern': r'connection refused|connection timeout',
                'threshold': 3,
                'window_minutes': 10,
                'severity': 'high'
            },
            {
                'name': 'Memory Issues',
                'pattern': r'MemoryError|OOM',
                'threshold': 1,
                'window_minutes': 60,
                'severity': 'critical'
            }
        ]
    
    def check_alerts(self, log_file):
        alerts = []
        
        for rule in self.alert_rules:
            matches = self.count_matches(
                log_file, 
                rule['pattern'], 
                rule['window_minutes']
            )
            
            if matches >= rule['threshold']:
                alerts.append({
                    'rule': rule['name'],
                    'severity': rule['severity'],
                    'count': matches,
                    'threshold': rule['threshold'],
                    'window': rule['window_minutes']
                })
        
        return alerts
    
    def count_matches(self, log_file, pattern, window_minutes):
        count = 0
        cutoff_time = datetime.now() - timedelta(minutes=window_minutes)
        
        with open(log_file) as f:
            for line in f:
                # Parse timestamp
                try:
                    timestamp_str = line.split(']')[0][1:]
                    timestamp = datetime.fromisoformat(timestamp_str)
                    
                    if timestamp > cutoff_time and re.search(pattern, line, re.I):
                        count += 1
                except:
                    continue
        
        return count

# Usage
alert_system = LogAlertSystem()
alerts = alert_system.check_alerts('/var/log/forgeboard/api.log')

for alert in alerts:
    print(f"ALERT: {alert['rule']} - {alert['count']} occurrences in {alert['window']} minutes")
\`\`\`

### Best Practices

1. **Structured Logging**
   - Use JSON format for complex data
   - Include correlation IDs
   - Add context metadata

2. **Log Levels**
   - DEBUG: Detailed information
   - INFO: General information
   - WARNING: Warning messages
   - ERROR: Error messages
   - CRITICAL: Critical issues

3. **Log Retention**
   - Keep recent logs readily accessible
   - Archive old logs compressed
   - Set up automatic cleanup

4. **Security**
   - Never log sensitive data
   - Sanitize user input
   - Encrypt archived logs
        `
      },
      'performance': {
        title: 'Performance Tuning',
        body: `
## Performance Tuning Guide

### System Performance Optimization

#### CPU Optimization
\`\`\`bash
# Check CPU usage
top -b -n 1 | head -20
htop  # Interactive view

# Identify CPU-intensive processes
ps aux --sort=-%cpu | head -10

# CPU governor settings
# Check current governor
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Set to performance mode
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
\`\`\`

#### Memory Optimization
\`\`\`bash
# Check memory usage
free -h
vmstat 1 5

# Clear page cache
sync && echo 1 | sudo tee /proc/sys/vm/drop_caches

# Adjust swappiness
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
\`\`\`

### Application Performance

#### Python Optimization
\`\`\`python
# Use production WSGI server
# gunicorn_config.py
bind = "0.0.0.0:5000"
workers = (2 * os.cpu_count()) + 1
worker_class = "gevent"
worker_connections = 1000
keepalive = 5
max_requests = 1000
max_requests_jitter = 50
timeout = 30
graceful_timeout = 30
preload_app = True

# Enable response compression
import gzip
from flask import make_response

@app.after_request
def compress_response(response):
    if 'gzip' not in request.headers.get('Accept-Encoding', ''):
        return response
    
    response.direct_passthrough = False
    
    if (response.status_code < 200 or
        response.status_code >= 300 or
        'Content-Encoding' in response.headers):
        return response
    
    response.data = gzip.compress(response.data)
    response.headers['Content-Encoding'] = 'gzip'
    response.headers['Content-Length'] = len(response.data)
    
    return response
\`\`\`

#### Database Optimization
\`\`\`python
# Connection pooling
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Query optimization
from sqlalchemy import Index

# Add indexes
Index('idx_apps_user_status', 'user_id', 'status')
Index('idx_logs_timestamp_app', 'timestamp', 'app_id')

# Use eager loading
from sqlalchemy.orm import joinedload

apps = db.session.query(App).options(
    joinedload(App.logs),
    joinedload(App.configs)
).all()

# Batch operations
def bulk_insert_logs(logs):
    db.session.bulk_insert_mappings(Log, logs)
    db.session.commit()
\`\`\`

### Caching Strategy

#### Redis Caching
\`\`\`python
import redis
import json
from functools import wraps

redis_client = redis.Redis(
    host='localhost', 
    port=6379, 
    decode_responses=True,
    connection_pool_kwargs={
        'max_connections': 50,
        'socket_keepalive': True,
        'socket_keepalive_options': {
            1: 1,  # TCP_KEEPIDLE
            2: 1,  # TCP_KEEPINTVL
            3: 3,  # TCP_KEEPCNT
        }
    }
)

def cache(expiration=3600):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Store in cache
            redis_client.setex(
                cache_key,
                expiration,
                json.dumps(result)
            )
            
            return result
        return wrapper
    return decorator

@app.route('/api/apps')
@cache(expiration=300)
def get_apps():
    return jsonify(App.query.all())
\`\`\`

#### CDN Integration
\`\`\`nginx
# Static file caching
location /static/ {
    alias /var/www/apps/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    
    # Enable gzip
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
}

# Cache API responses
location /api/public/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    proxy_cache_use_stale error timeout invalid_header updating;
    add_header X-Cache-Status $upstream_cache_status;
}
\`\`\`

### Load Balancing

#### NGINX Load Balancer
\`\`\`nginx
upstream forgeboard_backend {
    least_conn;
    
    server 127.0.0.1:5001 weight=3 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5002 weight=2 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5003 weight=1 max_fails=3 fail_timeout=30s;
    
    keepalive 32;
}

server {
    location / {
        proxy_pass http://forgeboard_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Enable caching
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}
\`\`\`

### Async Processing

#### Background Tasks with Celery
\`\`\`python
from celery import Celery

celery = Celery('forgeboard', broker='redis://localhost:6379')

@celery.task(bind=True, max_retries=3)
def process_app_deployment(self, app_id):
    try:
        app = App.query.get(app_id)
        
        # Long running task
        create_virtual_env(app)
        install_dependencies(app)
        configure_nginx(app)
        start_systemd_service(app)
        
        app.status = 'running'
        db.session.commit()
        
    except Exception as exc:
        self.retry(exc=exc, countdown=60)

# Usage
@app.route('/api/apps', methods=['POST'])
def create_app():
    app = App(**request.json)
    db.session.add(app)
    db.session.commit()
    
    # Queue background task
    process_app_deployment.delay(app.id)
    
    return jsonify({'id': app.id, 'status': 'queued'})
\`\`\`

### Monitoring & Profiling

#### Application Performance Monitoring
\`\`\`python
# APM with Prometheus
from prometheus_client import Counter, Histogram, generate_latest
import time

# Metrics
request_count = Counter('app_requests_total', 'Total requests', ['method', 'endpoint'])
request_duration = Histogram('app_request_duration_seconds', 'Request duration', ['method', 'endpoint'])

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    request_duration.labels(
        method=request.method,
        endpoint=request.endpoint or 'unknown'
    ).observe(time.time() - request.start_time)
    
    request_count.labels(
        method=request.method,
        endpoint=request.endpoint or 'unknown'
    ).inc()
    
    return response

@app.route('/metrics')
def metrics():
    return generate_latest()
\`\`\`

### Performance Testing

#### Load Testing with Locust
\`\`\`python
# locustfile.py
from locust import HttpUser, task, between

class ForgeboardUser(HttpUser):
    wait_time = between(1, 5)
    
    @task(3)
    def list_apps(self):
        self.client.get("/api/apps")
    
    @task(1)
    def create_app(self):
        self.client.post("/api/apps", json={
            "name": "test-app",
            "type": "flask",
            "port": 5001
        })
    
    @task(2)
    def view_logs(self):
        self.client.get("/api/apps/test-app/logs")

# Run: locust -f locustfile.py --host=http://localhost:5000
\`\`\`

### Database Query Optimization

\`\`\`sql
-- Analyze slow queries
EXPLAIN ANALYZE 
SELECT * FROM apps 
WHERE user_id = 1 AND status = 'running';

-- Add composite indexes
CREATE INDEX idx_apps_user_status ON apps(user_id, status);

-- Optimize joins
CREATE INDEX idx_logs_app_timestamp ON logs(app_id, timestamp DESC);

-- Partition large tables
CREATE TABLE logs_2024_01 PARTITION OF logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
\`\`\`

### Resource Limits

\`\`\`bash
# System limits
# /etc/security/limits.conf
forgeboard soft nofile 65535
forgeboard hard nofile 65535
forgeboard soft nproc 4096
forgeboard hard nproc 4096

# Kernel parameters
# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.core.netdev_max_backlog = 65535
\`\`\`

### Performance Checklist

- [ ] Enable production WSGI server (Gunicorn/uWSGI)
- [ ] Configure worker processes and threads
- [ ] Enable response compression
- [ ] Implement caching strategy
- [ ] Optimize database queries and indexes
- [ ] Configure connection pooling
- [ ] Set up CDN for static assets
- [ ] Enable HTTP/2 in NGINX
- [ ] Configure load balancing
- [ ] Implement async task processing
- [ ] Set up monitoring and alerting
- [ ] Configure resource limits
- [ ] Regular performance testing
- [ ] Optimize container images (if using Docker)
- [ ] Enable query result caching
        `
      }
    }

    return content[contentId] || content['quick-start']
  }

  const filteredSections = sections.map(section => ({
    ...section,
    content: section.content.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    section.content.length > 0
  )

  const currentContent = getContent(activeSection, activeContent)

  // Create a flat array of all content items for navigation
  const allContentItems = sections.flatMap(section => 
    section.content.map(item => ({
      ...item,
      sectionId: section.id
    }))
  )

  // Find current index
  const currentIndex = allContentItems.findIndex(
    item => item.sectionId === activeSection && item.id === activeContent
  )

  // Navigation handlers
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevItem = allContentItems[currentIndex - 1]
      setActiveSection(prevItem.sectionId)
      setActiveContent(prevItem.id)
    }
  }

  const handleNext = () => {
    if (currentIndex < allContentItems.length - 1) {
      const nextItem = allContentItems[currentIndex + 1]
      setActiveSection(nextItem.sectionId)
      setActiveContent(nextItem.id)
    }
  }

  const CodeBlock = ({ children, language = 'bash' }) => (
    <pre className={cn(
      "p-4 rounded-lg overflow-x-auto text-sm",
      darkMode 
        ? 'bg-gray-800 text-gray-300' 
        : 'bg-gray-100 text-gray-800'
    )}>
      <code>{children}</code>
    </pre>
  )

  const renderMarkdown = (text) => {
    // Simple markdown renderer - in production, use a proper markdown library
    const lines = text.trim().split('\n')
    const elements = []
    let inCodeBlock = false
    let codeContent = []
    let codeLanguage = ''

    lines.forEach((line, index) => {
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <CodeBlock key={index} language={codeLanguage}>{codeContent.join('\n')}</CodeBlock>
          )
          codeContent = []
          codeLanguage = ''
          inCodeBlock = false
        } else {
          inCodeBlock = true
          codeLanguage = line.trim().slice(3).trim() || 'bash'
        }
      } else if (inCodeBlock) {
        codeContent.push(line)
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className={cn(
            "text-xl font-semibold mt-6 mb-3",
            darkMode ? 'text-gray-100' : 'text-gray-900'
          )}>
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className={cn(
            "text-lg font-semibold mt-4 mb-2",
            darkMode ? 'text-gray-100' : 'text-gray-900'
          )}>
            {line.substring(4)}
          </h3>
        )
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={index} className={cn(
            "text-base font-semibold mt-3 mb-2",
            darkMode ? 'text-gray-100' : 'text-gray-900'
          )}>
            {line.substring(5)}
          </h4>
        )
      } else if (line.match(/^(\d+\.\s|-\s)/)) {
        // Process inline markdown for list items
        const processInlineMarkdown = (text) => {
          const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
          return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i}>{part.slice(2, -2)}</strong>
            } else if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code 
                  key={i} 
                  className={cn(
                    "px-1.5 py-0.5 rounded text-sm",
                    darkMode 
                      ? 'bg-gray-800 text-gray-300' 
                      : 'bg-gray-100 text-gray-800'
                  )}
                >
                  {part.slice(1, -1)}
                </code>
              )
            }
            return part
          })
        }
        
        elements.push(
          <li key={index} className={cn(
            "ml-6 list-disc",
            darkMode ? 'text-gray-300' : 'text-gray-700'
          )}>
            {processInlineMarkdown(line.replace(/^(\d+\.\s|-\s)/, ''))}
          </li>
        )
      } else if (line.trim()) {
        // Process inline markdown
        const processInlineMarkdown = (text) => {
          // Handle bold text and inline code
          const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
          return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i}>{part.slice(2, -2)}</strong>
            } else if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code 
                  key={i} 
                  className={cn(
                    "px-1.5 py-0.5 rounded text-sm",
                    darkMode 
                      ? 'bg-gray-800 text-gray-300' 
                      : 'bg-gray-100 text-gray-800'
                  )}
                >
                  {part.slice(1, -1)}
                </code>
              )
            }
            return part
          })
        }
        
        elements.push(
          <p key={index} className={cn(
            "mb-4",
            darkMode ? 'text-gray-300' : 'text-gray-700'
          )}>
            {processInlineMarkdown(line)}
          </p>
        )
      }
    })

    // Handle any remaining code block that wasn't closed
    if (inCodeBlock && codeContent.length > 0) {
      elements.push(
        <CodeBlock key={elements.length} language={codeLanguage}>{codeContent.join('\n')}</CodeBlock>
      )
    }

    return elements
  }

  return (
    <div className="space-y-6">
      {/* Page Title and Search */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className={cn(
            "text-3xl font-bold",
            darkMode ? 'text-gray-100' : 'text-gray-900'
          )}>
            Documentation
          </h1>
          <p className={cn(
            "text-sm mt-1",
            darkMode ? 'text-gray-400' : 'text-gray-600'
          )}>
            Learn how to deploy and manage your applications with ForgeBoard
          </p>
        </div>
        <div className="relative w-72">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
            darkMode ? 'text-gray-400' : 'text-gray-500'
          )} />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2 rounded-lg border transition-colors text-sm",
              darkMode 
                ? 'bg-gray-900 border-gray-800 text-gray-100 placeholder-gray-500 hover:bg-gray-800' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 hover:bg-gray-50',
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
      </div>

      {/* Quick Search Info */}
      {searchTerm && (
        <div className={cn(
          "p-4 rounded-lg mb-6",
          darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-blue-50 border border-blue-200'
        )}>
          <p className={cn(
            "text-sm",
            darkMode ? 'text-gray-300' : 'text-gray-700'
          )}>
            Searching for: <span className="font-medium">{searchTerm}</span>
            {currentContent.body.toLowerCase().includes(searchTerm.toLowerCase()) && (
              <span className={cn(
                "ml-2",
                darkMode ? 'text-green-400' : 'text-green-600'
              )}>
                ✓ Found in current section
              </span>
            )}
          </p>
        </div>
      )}

      {/* Section Tabs */}
      <div className={cn(
        "border-b",
        darkMode ? 'border-gray-800' : 'border-gray-200'
      )}>
        <nav className="-mb-px flex space-x-8">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id)
                  setActiveContent(section.content[0].id)
                }}
                className={cn(
                  "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm",
                  activeSection === section.id
                    ? darkMode
                      ? 'border-blue-500 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : darkMode
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className={cn(
                  "mr-2 h-5 w-5",
                  activeSection === section.id
                    ? darkMode ? 'text-blue-400' : 'text-blue-500'
                    : darkMode ? 'text-gray-500' : 'text-gray-400'
                )} />
                {section.title}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Subsection Navigation */}
      <div className="flex flex-wrap gap-2 pb-6">
        {sections.find(s => s.id === activeSection)?.content.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveContent(item.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeContent === item.id
                ? darkMode
                  ? 'bg-blue-900/20 text-blue-400 border border-blue-800/50'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="prose prose-lg max-w-none">
        <div className="mb-8">
          <h2 className={cn(
            "text-2xl font-bold mb-2",
            darkMode ? 'text-gray-100' : 'text-gray-900'
          )}>
            {currentContent.title}
          </h2>
          <div className={cn(
            "h-px bg-gradient-to-r",
            darkMode 
              ? 'from-gray-800 via-gray-700 to-transparent' 
              : 'from-gray-200 via-gray-100 to-transparent'
          )} />
        </div>
        
        {renderMarkdown(currentContent.body)}

        {/* Navigation Footer */}
        <div className="mt-16 pt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-2",
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            )}
            disabled={currentIndex === 0}
            onClick={handlePrevious}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Previous
          </Button>
          <div className={cn(
            "flex-1 mx-8 h-px",
            darkMode ? 'bg-gray-800' : 'bg-gray-200'
          )} />
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-2",
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            )}
            disabled={currentIndex === allContentItems.length - 1}
            onClick={handleNext}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Documentation
