# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ForgeBoard is a Flask-based app management dashboard for deploying Python micro-apps on a single VM. It provides systemd process management, NGINX routing, and a React UI - avoiding container complexity for solo developers.

## Architecture

**Backend**: Flask API managing apps via YAML config, systemd services, and NGINX routing
**Frontend**: React + Vite + Tailwind CSS + ShadCN UI dashboard
**Infrastructure**: Ubuntu 22.04, systemd for process management, NGINX for reverse proxy
**No containers** - direct VM deployment by design

## Development Commands

### Backend Development
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
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
```

## Key API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/apps` - List all apps from apps.yml
- `GET /api/apps/:slug` - Get specific app details
- `POST /api/apps/create` - Create new app from template
- `PUT /api/apps/:slug` - Update app configuration
- `DELETE /api/apps/:slug` - Remove app from registry
- `POST /api/apps/:slug/start` - Start app via systemd
- `POST /api/apps/:slug/stop` - Stop app via systemd
- `GET /api/apps/:slug/logs` - Fetch app logs (with line count param)
- `POST /api/nginx/reload` - Reload all NGINX configurations
- `POST /api/apps/:slug/nginx` - Update single app NGINX config
- `GET /api/system/permissions` - Check system permissions

## Important Files

### Configuration
- `backend/apps.yml` - Central app registry (stores app metadata, ports, domains)
- `/etc/nginx/sites-available/forgeboard-*` - Generated NGINX configs for each app
- `/etc/systemd/system/forgeboard-*.service` - Generated systemd service files

### Backend
- `backend/main.py` - Flask API entry point with all routes
- `backend/utils/yaml_loader.py` - YAML registry management
- `backend/utils/nginx_gen.py` - NGINX config generation
- `backend/utils/systemd_control.py` - systemd service management
- `backend/templates/` - Jinja2 templates for config generation

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

## Design Principles

1. **No overengineering** - Direct systemd/NGINX management instead of containers
2. **Transparency** - Clear file locations, readable configs
3. **Modularity** - Apps are independent with isolated virtualenvs
4. **Developer-first** - CLI tools, API docs, and clear error messages
5. **Production-ready** - Proper logging, error handling, and security

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

Next phase focuses on multi-user support, Git deployment, and enterprise features.