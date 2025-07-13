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

### Testing
```bash
# Backend tests (when implemented)
cd backend && pytest

# Frontend tests (when implemented)
cd frontend && npm test
```

## Key API Endpoints

- `GET /api/apps` - List all apps from apps.yml
- `POST /api/apps/start/:id` - Start app via systemd
- `POST /api/apps/stop/:id` - Stop app via systemd
- `GET /api/apps/logs/:id` - Fetch app logs
- `POST /api/nginx/reload` - Reload NGINX configuration

## Important Files

- `apps.yml` - Central app registry (stores app metadata, ports, domains)
- `backend/main.py` - Flask API entry point
- `frontend/src/App.jsx` - React dashboard main component
- `/etc/nginx/sites-available/` - NGINX configs for each app
- `/etc/systemd/system/` - systemd service files for each app

## Design Principles

1. **No overengineering** - Direct systemd/NGINX management instead of containers
2. **Transparency** - Clear file locations, readable configs
3. **Modularity** - Apps are independent with isolated virtualenvs

## Development Workflow

1. Apps are registered in `apps.yml` with metadata
2. Flask API creates systemd services and NGINX configs from templates
3. React UI provides control panel for managing app lifecycle
4. Cookiecutter scaffolds new apps with ForgeBoard-ready structure

## Current Status

Project is in initial planning phase. See `docs/TASK.md` for development roadmap starting with Phase 1: Core backend implementation.