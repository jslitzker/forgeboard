# Forgeboard - Planning Document

## 📘 Project Overview

**Name:** Forgeboard
**Tagline:** "Where dev tools get forged, one tile at a time"
**Purpose:** Single VM hosting and management for multiple Flask/FastAPI/Django micro-apps via modern dashboard UI

**Problem:** Developers need rapid micro-app deployment without Docker/K8s complexity
**Goal:** Deploy, manage, and route multiple microservices on a single Linux VM with clean UI controls
**Target Users:** Solo developers (designed with multi-user expansion in mind)

## 🏗 Architecture

```
[ React Dashboard UI ] <--> [ Flask API Backend ] <-- apps.yml
                                       |
       +-------------------------------+--------------------+
       |                                                    |
[ systemd Services ]                               [ NGINX Reverse Proxy ]
       |                                                    |
       +------------- localhost:9001,9002...  <------------> Subdomains/Subpaths
```

## 🧰 Core Components

### 1. Flask API Backend

- Metadata management (`apps.yml` loader)
- NGINX config generation
- systemd process control endpoints
- App registration and lifecycle management

### 2. React Dashboard UI

- Modern tile-based interface (ShadCN + Tailwind)
- Dark mode support
- App cards with start/stop/logs controls
- App creation wizard

### 3. NGINX Reverse Proxy

- Routes subdomains/subpaths to app ports
- Auto-generated configs in `/etc/nginx/sites-enabled/`
- Graceful reload support

### 4. Process Management

- systemd services for app lifecycle
- Clean background process handling
- Log aggregation via journalctl

### 5. App Scaffolding

- Cookiecutter-based templates (Flask + FastAPI for MVP)
- Auto port assignment
- Project folder creation

## 🛠 Technology Stack

**Backend:**

- Python 3.12+ (Flask API)
- YAML metadata storage (migrate to SQLite post-MVP)
- systemd for process management
- NGINX for reverse proxy

**Frontend:**

- React + Vite
- Tailwind CSS + ShadCN components
- Dark mode toggle

**Infrastructure:**

- Ubuntu 22.04 LTS target
- Max 20-25 concurrent apps (4-core/16GB VM)
- Cookiecutter for scaffolding

**Development:**

- Node 20+
- Python virtualenv
- Optional mkcert for local HTTPS

## 🎯 Design Principles

- **No overengineering:** Avoid Docker/K8s complexity
- **Transparency:** YAML configs are git-able and editable
- **Modularity:** Clean separation between UI, API, and process management
- **Durability:** systemd for reliable process management
- **Modern UX:** Tile-based dashboard with dark mode support

## ✅ Expected Output (MVP Complete)

- Apps reachable via unique subdomains or subpaths
- New Flask/FastAPI apps scaffoldable with few clicks
- Dashboard controls for start/stop/logs management
- Auto NGINX config updates on app registration
- Clean tile-based UI with dark mode
- No Docker dependencies

## 📁 Code Structure

```
forgeboard/
├── backend/
│   ├── main.py (Flask app)
│   ├── utils/
│   ├── templates/ (nginx, systemd)
│   └── apps.yml
├── frontend/
│   ├── src/
│   └── vite.config.js
├── scaffold/
│   ├── cookiecutter-flask/
│   └── cookiecutter-fastapi/
└── docs/
```

## 🔄 Post-MVP Expansion

- Django + static-Jinja templates
- Multi-user authentication system
- Git-backed project initialization
- SQLite metadata backend migration
- Per-app database provisioning
- WebSocket live log streaming
- Subdomain vs subpath routing toggle
