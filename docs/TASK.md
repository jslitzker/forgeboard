# Forgeboard - Development Tasks

## ✅ Active Tasks (Current Sprint)

### 🔧 Development Environment Setup

- [ ] Install Python 3.12+ and create virtualenv for backend
- [ ] Install Node 20+ and verify npm/yarn availability
- [ ] Install cookiecutter system-wide (`pip install cookiecutter`)
- [ ] Verify nginx and systemd are available locally
- [ ] Optional: Install mkcert for local HTTPS development
- [ ] Create project folder structure: `backend/`, `frontend/`, `scaffold/`
- [ ] Initialize git repository with `.gitignore` for Python/Node
- [ ] Set up backend virtualenv with Flask, PyYAML, requests
- [ ] Initialize React app with Vite in `frontend/`
- [ ] Install Tailwind + ShadCN in React project

### 🏗 Phase 1: Core Backend + Static Routing

- [ ] Create `backend/main.py` Flask application with basic routes
- [ ] Implement `apps.yml` loader utility in `backend/utils/yaml_loader.py`
- [ ] Design initial `apps.yml` schema (name, slug, port, type, status)
- [ ] Create NGINX config template in `backend/templates/nginx.conf.j2`
- [ ] Build NGINX config generator function (`utils/nginx_gen.py`)
- [ ] Implement `/api/apps` endpoint (GET - list all apps)
- [ ] Implement `/api/apps/<slug>` endpoints (GET/POST - individual app control)
- [ ] Create systemd unit template in `backend/templates/app.service.j2`
- [ ] Build systemd control utilities (`utils/systemd_control.py`)
- [ ] Add placeholder project folder scaffolding function
- [ ] Test NGINX config generation with sample apps
- [ ] Verify systemd service creation and control

## 🛣️ Milestones (Upcoming Phases)

### 📱 Phase 2: React Dashboard UI (Tiles + Dark Mode)

- [ ] Set up React routing and basic layout structure
- [ ] Implement ShadCN component library and Tailwind theming
- [ ] Create app card/tile component with status indicators
- [ ] Build app grid layout with responsive design
- [ ] Add dark mode toggle with persistent preference
- [ ] Connect frontend to Flask API (`/api/apps`)
- [ ] Implement start/stop/logs buttons (API calls only, no functionality yet)
- [ ] Add loading states and error handling
- [ ] Style dashboard with modern tile-based design
- [ ] Test UI responsiveness and dark/light mode switching

### 🎯 Phase 3: App Scaffolding (Flask + FastAPI Templates)

- [ ] Create `cookiecutter-flask` template in `scaffold/`
- [ ] Create `cookiecutter-fastapi` template in `scaffold/`
- [ ] Implement auto port assignment logic
- [ ] Build app creation wizard UI component
- [ ] Connect scaffolding to backend API (`/api/apps/create`)
- [ ] Auto-register new apps to `apps.yml`
- [ ] Generate systemd unit files for new apps
- [ ] Update NGINX config automatically on app creation
- [ ] Test end-to-end app creation workflow
- [ ] Add validation for app names and ports

### 🔄 Phase 4: Auto Reload + Log Viewer

- [ ] Implement systemctl log tailing (`journalctl -u app.service`)
- [ ] Create log viewer API endpoint (`/api/apps/<slug>/logs`)
- [ ] Build log viewer UI component (last 50 lines display)
- [ ] Add auto `nginx -s reload` after config updates
- [ ] Implement real-time log fetching (polling or SSE)
- [ ] Add log filtering and search functionality
- [ ] Handle systemd service failures gracefully
- [ ] Test log viewing and auto-reload functionality

### ✨ Phase 5: Polish + Deploy

- [ ] Final dashboard UI polish and animations
- [ ] Implement persistent dark mode preference
- [ ] Create CLI bootstrap tool for initial setup
- [ ] Add app health checking and status monitoring
- [ ] Build deployment documentation
- [ ] Create installation script or `.deb` package
- [ ] Add error handling and user feedback improvements
- [ ] Performance testing with 20+ concurrent apps
- [ ] Final testing and bug fixes

## 📥 Backlog / Ideas (Post-MVP)

### 🔄 Template Expansion

- [ ] Django app template with basic project structure
- [ ] Static-Jinja template for documentation sites
- [ ] Custom template creation workflow

### 👥 Multi-User Support

- [ ] Simple authentication system (file-based or Azure AD)
- [ ] Per-user app isolation and permissions
- [ ] User management UI

### 📊 Advanced Features

- [ ] Git-backed project initialization
- [ ] SQLite metadata backend migration
- [ ] Per-app database provisioning hooks
- [ ] WebSocket live log streaming
- [ ] Subdomain vs subpath routing toggle
- [ ] App dependency management
- [ ] Resource usage monitoring (CPU/Memory per app)
- [ ] Backup and restore functionality

### 🚀 DevOps Integration

- [ ] Git-push deploy workflow
- [ ] Environment variable management per app
- [ ] SSL certificate automation (Let's Encrypt)
- [ ] Health check endpoints and monitoring
- [ ] App auto-restart on failure
- [ ] Deployment rollback functionality
