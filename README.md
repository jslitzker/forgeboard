<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/forgeboard_logo_dark.png">
    <img alt="Forgeboard Logo" src="assets/forgeboard_logo.png" width="300">
  </picture>
</p>

# Forgeboard

Forgeboard is a self-hosted developer dashboard for managing multiple Python-based micro-apps—such as Flask, FastAPI, and Django—on a single Linux VM. It simplifies app deployment, routing, and lifecycle control using `systemd` and `NGINX`—no Docker, no Kubernetes, no nonsense.

> **🔐 Authentication System**: Now includes secure multi-user authentication with local and Azure AD support, encrypted configuration storage, and comprehensive audit logging.

## ✨ Features

### Core Functionality
- **App Lifecycle Management**: Start, stop, and monitor Python apps via systemd
- **Smart Routing**: Automatic NGINX configuration for subdomain/subpath routing
- **App Scaffolding**: Create new apps instantly with Flask/FastAPI templates
- **Virtual Environments**: Each app runs in its own isolated Python environment
- **Real-time Logs**: View and search application logs directly from the dashboard
- **YAML Registry**: Simple, transparent app configuration storage

### Developer Experience
- **Modern Dashboard**: Clean, responsive UI with dark mode support
- **RESTful API**: Full-featured API with Swagger/OpenAPI documentation
- **Search & Filter**: Find apps quickly with real-time search and grouping
- **Built-in Documentation**: Comprehensive guides accessible within the dashboard
- **CLI Tool**: Command-line interface for automation and scripting
- **One-line Install**: Production deployment in minutes with `setup.sh`

### Security & Authentication
- **Multi-User Support**: Local authentication with password-based login
- **Azure AD Integration**: Enterprise authentication with group-based roles
- **Encrypted Configuration**: Sensitive settings stored encrypted in SQLite database
- **API Key Management**: Secure API access with user-specific keys
- **Audit Logging**: Comprehensive tracking of all user actions and system events
- **Session Management**: Secure session handling with expiration and refresh

### Technical Benefits
- **Zero Containers**: No Docker/Kubernetes complexity - just Python and systemd
- **Lightweight**: Minimal resource usage compared to container solutions
- **Transparent**: All configuration in readable YAML and standard Linux services
- **Extensible**: Easy to add new app types and deployment patterns

## 🧱 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│   Flask API     │────▶│   apps.yml      │
│  (Dashboard)    │◀────│   (Manager)     │◀────│  (Registry)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
              ┌──────────┐             ┌──────────┐
              │ systemd  │             │  NGINX   │
              │(Process) │             │(Routing) │
              └──────────┘             └──────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
              ┌──────────┐             ┌──────────┐
              │ SQLite   │             │Bootstrap │
              │Database  │             │Config    │
              │(Users/   │             │(JSON)    │
              │ Config)  │             │          │
              └──────────┘             └──────────┘
```

### Authentication Architecture
- **Bootstrap Config**: Minimal JSON configuration for database and encryption keys
- **SQLite Database**: Secure storage for users, sessions, configuration, and audit logs
- **Encrypted Storage**: Sensitive configuration values encrypted at rest
- **Local Auth**: Password-based authentication with bcrypt hashing
- **Azure AD**: Enterprise authentication with MSAL integration
- **Session Management**: JWT-based sessions with refresh token support

## 🚀 Quick Installation

### Prerequisites
- Ubuntu 22.04+ (or similar Linux distro)
- Python 3.11+
- Root/sudo access

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/jslitzker/forgeboard.git
cd forgeboard

# Run the setup script
sudo ./setup.sh
```

The setup script will:
- Install all dependencies (Node.js, NGINX, etc.)
- Set up ForgeBoard in `/opt/forgeboard`
- Configure systemd and NGINX
- Build and deploy the UI
- Start all services

### Option 2: Development Setup

```bash
# Clone and setup environment
git clone https://github.com/jslitzker/forgeboard.git
cd forgeboard

# Set up environment variables
cp .env.example .env
# Edit .env and generate secure keys (see comments in file)

# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Generate secure keys for development
python config/bootstrap.py --generate-keys

# Initialize database
python -c "from database.connection import init_database; from flask import Flask; app = Flask(__name__); init_database(app)"

python main.py  # runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev  # runs on http://localhost:5173
```

### Configuration Management

After installation, you can manage authentication and system configuration:

```bash
# Generate secure keys
python backend/config/bootstrap.py --generate-keys

# View current configuration
python backend/config/manager.py --export

# Configure authentication
python backend/config/manager.py --set auth.enabled true
python backend/config/manager.py --set auth.method local

# Database operations
python backend/database/connection.py --health
python backend/database/connection.py --backup
```

## 📁 Repo Structure

```
forgeboard/
├── backend/           # Flask API server
│   ├── main.py       # API endpoints and app logic
│   ├── config/       # Configuration management
│   │   ├── bootstrap.py  # Bootstrap configuration system
│   │   └── manager.py    # Database configuration manager
│   ├── database/     # Database models and management
│   │   ├── connection.py # Database connection and initialization
│   │   ├── models/       # SQLAlchemy models
│   │   └── migrations/   # Database migration management
│   ├── utils/        # Helper modules (YAML, NGINX, systemd)
│   └── templates/    # Jinja2 templates for config generation
├── frontend/          # React dashboard
│   ├── src/          # React components and UI logic
│   └── public/       # Static assets
├── scaffold/          # Cookiecutter templates
│   ├── cookiecutter-flask/
│   └── cookiecutter-fastapi/
├── config/           # Configuration files
│   └── bootstrap.json   # Bootstrap configuration
├── docs/             # Project documentation
├── forgeboard-cli    # CLI management tool
├── setup.sh          # One-line installation script
├── .env.example      # Environment variables template
└── apps.yml          # App registry (created on first run)
```

## 🛠 CLI & API

### ForgeBoard CLI
```bash
# Check system dependencies
forgeboard-cli check

# View service status
forgeboard-cli status

# Full installation
sudo forgeboard-cli install --domain yourdomain.com
```

### API Endpoints

| Action          | Endpoint                        | Description                    |
| --------------- | ------------------------------- | ------------------------------ |
| Health check    | `GET /api/health`              | API health status              |
| List apps       | `GET /api/apps`                | Get all registered apps        |
| Get app details | `GET /api/apps/:slug`          | Get specific app details       |
| Create app      | `POST /api/apps/create`        | Scaffold new app from template |
| Update app      | `PUT /api/apps/:slug`          | Update app configuration       |
| Delete app      | `DELETE /api/apps/:slug`       | Remove app from registry       |
| Start app       | `POST /api/apps/:slug/start`   | Start app via systemd          |
| Stop app        | `POST /api/apps/:slug/stop`    | Stop app via systemd           |
| View logs       | `GET /api/apps/:slug/logs`     | Tail app logs (last n lines)  |
| Reload NGINX    | `POST /api/nginx/reload`       | Apply all NGINX changes        |
| Update NGINX    | `POST /api/apps/:slug/nginx`   | Update single app NGINX config |
| Check perms     | `GET /api/system/permissions`  | Verify system permissions      |

Full API documentation with interactive testing available at `/docs` when ForgeBoard is running.

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production installation and configuration
- **[Planning Doc](docs/PLANNING.md)** - Architecture decisions and design philosophy  
- **[Task Tracker](docs/TASK.md)** - Development roadmap and progress
- **Built-in Docs** - Access comprehensive documentation in the dashboard

## 🧪 Project Status

- ✅ **Phase 1**: Core backend with YAML registry + NGINX + systemd
- ✅ **Phase 2**: React dashboard with dark mode and modern UI
- ✅ **Phase 3**: App scaffolding with Flask/FastAPI templates
- ✅ **Phase 4**: Real-time logs and auto-reload functionality
- ✅ **Phase 5**: Installation tools and documentation
- 🔜 **Next**: Multi-user support, Git-based deployment, SSL automation

## 🤝 Contributing

ForgeBoard is designed to be simple and maintainable. When contributing:
- Follow the "no overengineering" principle
- Keep dependencies minimal
- Write clear, readable code
- Update documentation as needed

## 🧰 License

MIT © 2025 Joe Slitzker / TTCU Technologies
