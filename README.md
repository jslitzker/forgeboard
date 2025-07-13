<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/forgeboard_logo_dark.png">
    <img alt="Forgeboard Logo" src="assets/forgeboard_logo.png" width="300">
  </picture>
</p>

# Forgeboard

Forgeboard is a self-hosted developer dashboard for managing multiple Python-based micro-apps—such as Flask, FastAPI, and Django—on a single Linux VM. It simplifies app deployment, routing, and lifecycle control using `systemd` and `NGINX`—no Docker, no Kubernetes, no nonsense.

## ✨ Features

- **Modern Dashboard**: Clean, dark-mode UI built with React + Tailwind + ShadCN
- **Smart Routing**: Automatic subdomain/subpath configuration via NGINX
- **Process Management**: Full app lifecycle control via systemd (start, stop, logs)
- **App Scaffolding**: Cookiecutter-powered templates for Flask, FastAPI, and Django
- **Zero Containers**: Lightweight deployment using virtualenvs - no Docker overhead
- **API-First**: RESTful API with Swagger documentation
- **Search & Filter**: Find apps quickly with real-time search and grouping
- **Built-in Docs**: Comprehensive documentation right in the dashboard

## 🧱 Architecture

```
[ Dashboard UI ] ⇄ [ Flask API Manager ] ⇄ [ apps.yml / SQLite ]
                                      ⇣
                              [ systemd / nginx ]
```

## 🚀 Quick Installation

### Prerequisites
- Ubuntu 22.04+ (or similar Linux distro)
- Python 3.11+
- Root/sudo access

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/forgeboard.git
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
# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python main.py  # runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev  # runs on http://localhost:5173
```

## 📁 Repo Structure

```
forgeboard/
├── backend/       # Flask API (metadata, systemctl, nginx integration)
├── frontend/      # React UI (dashboard tiles, dark mode, controls)
├── scaffold/      # Cookiecutter templates (Flask, FastAPI, etc.)
└── apps.yml       # App registry (name, slug, port, status)
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

| Action       | Endpoint                    | Description                |
| ------------ | --------------------------- | -------------------------- |
| List apps    | `GET /api/apps`            | Get all registered apps    |
| Create app   | `POST /api/apps/create`    | Scaffold new app           |
| Start app    | `POST /api/apps/:slug/start` | Start app via systemd    |
| Stop app     | `POST /api/apps/:slug/stop`  | Stop app via systemd     |
| View logs    | `GET /api/apps/:slug/logs`   | Tail app logs            |
| Reload NGINX | `POST /api/nginx/reload`    | Apply NGINX changes       |

API documentation available at `/docs` when ForgeBoard is running.

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
