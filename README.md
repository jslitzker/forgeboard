<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/forgeboard_logo_dark.png">
    <img alt="Forgeboard Logo" src="assets/forgeboard_logo.png" width="300">
  </picture>
</p>

# Forgeboard

Forgeboard is a self-hosted developer dashboard for managing multiple Python-based micro-apps—such as Flask, FastAPI, and Django—on a single Linux VM. It simplifies app deployment, routing, and lifecycle control using `systemd` and `NGINX`—no Docker, no Kubernetes, no nonsense.

> **🔐 Authentication System**: Complete multi-user authentication with local password-based login, JWT sessions, API key management, email notifications, and comprehensive security features.

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
- **JWT Sessions**: Secure token-based authentication with automatic refresh
- **API Key Management**: Secure API access with permission-based keys
- **Email Notifications**: SMTP and OAuth2 support for password reset
- **Rate Limiting**: Protection against brute force attacks
- **Password Security**: Bcrypt hashing with complexity requirements
- **Encrypted Configuration**: Sensitive settings stored encrypted in SQLite database
- **Audit Logging**: Comprehensive tracking of all user actions and system events

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
- **JWT Sessions**: Token-based authentication with automatic refresh
- **API Keys**: Permission-based programmatic access
- **Email Service**: SMTP and OAuth2 email notifications
- **Rate Limiting**: In-memory protection against brute force attacks

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
│   ├── auth/         # Authentication system
│   │   ├── providers/    # Authentication providers (local, Azure AD)
│   │   ├── session_manager.py  # JWT session management
│   │   ├── api_key_manager.py  # API key management
│   │   └── email_service.py    # Email notifications
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
│   ├── src/
│   │   ├── contexts/     # React authentication context
│   │   ├── components/   # React components and UI logic
│   │   │   └── auth/     # Authentication components
│   │   └── ...
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

#### App Management
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

#### Authentication
| Action          | Endpoint                        | Description                    |
| --------------- | ------------------------------- | ------------------------------ |
| Login           | `POST /api/auth/login`         | Authenticate user with credentials |
| Logout          | `POST /api/auth/logout`        | Logout and invalidate session |
| Register        | `POST /api/auth/register`      | Create new user account       |
| Current user    | `GET /api/auth/me`             | Get current user information  |
| Forgot password | `POST /api/auth/forgot-password` | Request password reset email |
| Reset password  | `POST /api/auth/reset-password` | Reset password with token    |
| Change password | `POST /api/auth/change-password` | Change user password        |
| List users      | `GET /api/users`               | List all users (admin only)  |
| Create user     | `POST /api/users`              | Create user (admin only)     |
| List API keys   | `GET /api/me/api-keys`         | List current user's API keys |
| Create API key  | `POST /api/me/api-keys`        | Create new API key with permissions |
| Revoke API key  | `DELETE /api/me/api-keys/:id`  | Revoke specific API key      |

Full API documentation with interactive testing available at `/docs` when ForgeBoard is running.

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** - Development and production installation
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment and configuration
- **[Configuration Guide](docs/CONFIGURATION.md)** - Authentication and system configuration
- **[Frontend Guide](docs/FRONTEND.md)** - Frontend development and architecture
- **[Testing Guide](docs/TESTING.md)** - UI testing and validation
- **[Project Roadmap](docs/ROADMAP.md)** - Development roadmap and future plans
- **[Project Status](docs/STATUS.md)** - Current implementation status
- **Built-in Docs** - Access comprehensive documentation in the dashboard

## 🧪 Project Status

- ✅ **Phase 1**: Core backend with YAML registry + NGINX + systemd
- ✅ **Phase 2**: React dashboard with dark mode and modern UI
- ✅ **Phase 3**: App scaffolding with Flask/FastAPI templates
- ✅ **Phase 4**: Real-time logs and auto-reload functionality
- ✅ **Phase 5**: Installation tools and documentation
- ✅ **Phase 6**: Complete authentication system with local login, JWT sessions, API keys, and email notifications
- 🔜 **Next**: Azure AD integration, Git-based deployment, SSL automation

## 🤝 Contributing

ForgeBoard is designed to be simple and maintainable. When contributing:
- Follow the "no overengineering" principle
- Keep dependencies minimal
- Write clear, readable code
- Update documentation as needed

## 🧰 License

MIT © 2025 Joe Slitzker / TTCU Technologies
