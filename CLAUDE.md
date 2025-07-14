# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ForgeBoard is a Flask-based app management dashboard for deploying Python micro-apps on a single VM. It provides systemd process management, NGINX routing, and a React UI - avoiding container complexity for solo developers.

## Architecture

**Backend**: Flask API managing apps via YAML config, systemd services, and NGINX routing
**Frontend**: React + Vite + Tailwind CSS + ShadCN UI dashboard
**Database**: SQLite for user authentication and configuration management
**Authentication**: Local + Azure AD authentication with encrypted configuration storage
**Infrastructure**: Ubuntu 22.04, systemd for process management, NGINX for reverse proxy
**No containers** - direct VM deployment by design

## Development Commands

### Backend Development
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Set up environment variables
cp ../.env.example ../.env
# Edit .env and generate secure keys (see .env.example for instructions)

# Initialize database (first time setup)
python -c "from database.connection import init_database; from flask import Flask; app = Flask(__name__); init_database(app)"

python main.py  # runs Flask API on port 5000
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev     # runs React dev server
npm run build   # builds for production
```

### Testing & Development
```bash
# Run backend API
cd backend && source venv/bin/activate && python main.py

# Run frontend dev server
cd frontend && npm run dev

# Test the installation
sudo ./setup.sh

# Check service status
forgeboard-cli status

# View API docs
# Navigate to http://localhost:5000/docs

# Database and configuration management
python backend/database/connection.py --health  # Check database health
python backend/config/manager.py --export      # Export configuration
python backend/config/bootstrap.py --generate-keys  # Generate secure keys
```

## Key API Endpoints

### System & Health
- `GET /api/health` - Health check endpoint
- `GET /api/system/permissions` - Check system permissions

### App Management
- `GET /api/apps` - List all apps from apps.yml
- `GET /api/apps/:slug` - Get specific app details
- `POST /api/apps/create` - Create new app from template
- `PUT /api/apps/:slug` - Update app configuration
- `DELETE /api/apps/:slug` - Remove app from registry
- `POST /api/apps/:slug/start` - Start app via systemd
- `POST /api/apps/:slug/stop` - Stop app via systemd
- `GET /api/apps/:slug/logs` - Fetch app logs (with line count param)

### Infrastructure
- `POST /api/nginx/reload` - Reload all NGINX configurations
- `POST /api/apps/:slug/nginx` - Update single app NGINX config

### Authentication (Future Implementation)
- `GET /api/auth/method` - Get current auth method and configuration
- `POST /api/auth/login` - Unified login endpoint
- `POST /api/auth/logout` - Unified logout
- `GET /api/auth/me` - Get current user info
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create user (admin only)
- `GET /api/me/api-keys` - List current user's API keys
- `POST /api/me/api-keys` - Create new API key

## Important Files

### Configuration
- `backend/apps.yml` - Central app registry (stores app metadata, ports, domains)
- `config/bootstrap.json` - Bootstrap configuration (database path, encryption keys)
- `/opt/forgeboard/data/forgeboard.db` - SQLite database (user data, sessions, config)
- `.env` - Environment variables (copy from .env.example)
- `/etc/nginx/sites-available/forgeboard-*` - Generated NGINX configs for each app
- `/etc/systemd/system/forgeboard-*.service` - Generated systemd service files

### Backend
- `backend/main.py` - Flask API entry point with all routes
- `backend/utils/yaml_loader.py` - YAML registry management
- `backend/utils/nginx_gen.py` - NGINX config generation
- `backend/utils/systemd_control.py` - systemd service management
- `backend/templates/` - Jinja2 templates for config generation

### Authentication & Database
- `backend/config/bootstrap.py` - Bootstrap configuration system
- `backend/config/manager.py` - Database configuration manager with encryption
- `backend/database/connection.py` - Database connection and initialization
- `backend/database/models/` - SQLAlchemy models for all data structures
- `backend/database/migrations/` - Database migration management

### Frontend
- `frontend/src/App.jsx` - Main React component with routing
- `frontend/src/components/Dashboard.jsx` - Dashboard overview
- `frontend/src/components/AppCard.jsx` - Individual app controls
- `frontend/src/components/LogViewer.jsx` - Real-time log display
- `frontend/src/components/Documentation.jsx` - Built-in docs

### Tools
- `forgeboard-cli` - CLI tool for installation and management
- `setup.sh` - Automated installation script
- `scaffold/` - Cookiecutter templates for new apps

## UI Navigation Structure

The React dashboard uses hash-based routing with these main sections:
- `#dashboard` - Overview with stats, quick actions, and recent activity
- `#apps` - App management with search, filter, and grouping
- `#logs` - Centralized log viewer with filtering and export
- `#settings` - User preferences and system configuration
- `#docs` - Built-in documentation with search

### Authentication UI (Future Implementation)
- `#login` - Login page supporting local and Azure AD authentication
- `#users` - User management interface (admin only)
- `#profile` - User profile and API key management
- `#admin` - System configuration and authentication settings

## Design Principles

1. **No overengineering** - Direct systemd/NGINX management instead of containers
2. **Transparency** - Clear file locations, readable configs
3. **Modularity** - Apps are independent with isolated virtualenvs
4. **Developer-first** - CLI tools, API docs, and clear error messages
5. **Production-ready** - Proper logging, error handling, and security
6. **Security-first** - Encrypted configuration storage, secure authentication, audit logging

## Development Workflow

1. Apps are registered in `apps.yml` with metadata
2. Flask API creates systemd services and NGINX configs from templates
3. React UI provides control panel for managing app lifecycle
4. Cookiecutter scaffolds new apps with ForgeBoard-ready structure

## Current Status

ForgeBoard is feature-complete for MVP with all core functionality implemented:
- ✅ Full backend API with systemd/NGINX integration
- ✅ Modern React dashboard with dark mode
- ✅ App scaffolding with cookiecutter templates
- ✅ Real-time log viewer
- ✅ Automated installation tools
- ✅ Comprehensive documentation
- ✅ Authentication system database foundation (Phase 1 complete)

### Authentication Implementation Progress
- ✅ **Phase 1: Database Foundation** - SQLite database with encrypted configuration
- ⏳ **Phase 2: Local Authentication** - Password-based authentication system
- 📅 **Phase 3: Configuration UI** - Web interface for system configuration
- 📅 **Phase 4: Authentication API** - REST API for user management
- 📅 **Phase 5: Frontend Authentication** - Login UI and protected routes
- 📅 **Phase 6: Azure AD Integration** - Enterprise authentication
- 📅 **Phase 7: Security & Testing** - Comprehensive security hardening
- 📅 **Phase 8: CLI Integration** - Command-line authentication tools

Next phase focuses on implementing local authentication, then Azure AD integration and enterprise features.