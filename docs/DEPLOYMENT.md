# ForgeBoard Deployment Guide

## Prerequisites

- Ubuntu 22.04 LTS or newer
- Python 3.11 or newer  
- Root/sudo access

The setup script will automatically install other dependencies including:
- Node.js 20+ and npm
- NGINX
- Python build tools
- Cookiecutter

## Quick Installation

### Method 1: Using the Setup Script (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/your-org/forgeboard.git
cd forgeboard
```

2. Run the automated setup script:
```bash
sudo ./setup.sh
```

The setup script will:
- Install all system dependencies
- Set up ForgeBoard in `/opt/forgeboard`
- Create systemd service
- Configure NGINX with your domain
- Build and deploy the frontend
- Start all services
- Install the ForgeBoard CLI tool

### Method 2: Using the CLI Tool

If you have the forgeboard-cli tool:
```bash
sudo forgeboard-cli install --domain yourdomain.com
```

Options:
- `--domain`: Specify your domain (default: localhost)
- `--source-dir`: Custom source directory for ForgeBoard files

## Manual Installation

### 1. Install System Dependencies

```bash
sudo apt update
sudo apt install -y python3-pip python3-venv python3-dev build-essential nginx
sudo pip3 install cookiecutter
```

### 2. Install Node.js (if not already installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Create Required Directories

```bash
sudo mkdir -p /opt/forgeboard
sudo mkdir -p /var/www/apps
sudo mkdir -p /var/log/forgeboard
```

### 4. Backend Setup

```bash
# Copy backend files
sudo cp -r backend /opt/forgeboard/
sudo cp -r scaffold /opt/forgeboard/

# Set up Python environment
cd /opt/forgeboard/backend
sudo python3 -m venv venv
sudo ./venv/bin/pip install -r requirements.txt
sudo ./venv/bin/pip install gunicorn
```

### 5. Frontend Setup

```bash
# Build frontend
cd frontend
npm install
npm run build

# Copy built files
sudo cp -r dist /opt/forgeboard/frontend
```

### 6. Create ForgeBoard Service

Create `/etc/systemd/system/forgeboard.service`:

```ini
[Unit]
Description=ForgeBoard API Server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/forgeboard/backend
Environment="PATH=/opt/forgeboard/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="APPS_CONFIG=/opt/forgeboard/backend/apps.yml"
ExecStart=/opt/forgeboard/backend/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 main:app
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

### 7. Configure NGINX

Create `/etc/nginx/sites-available/forgeboard`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Frontend
    location / {
        root /opt/forgeboard/frontend;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger docs
    location /docs {
        proxy_pass http://127.0.0.1:5000/docs;
        proxy_set_header Host $host;
    }

    location /flasgger_static {
        proxy_pass http://127.0.0.1:5000/flasgger_static;
    }

    location /apispec.json {
        proxy_pass http://127.0.0.1:5000/apispec.json;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/forgeboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Set Permissions

```bash
sudo chown -R www-data:www-data /opt/forgeboard
sudo chown -R www-data:www-data /var/www/apps
sudo chown -R www-data:www-data /var/log/forgeboard
```

### 9. Start Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable forgeboard
sudo systemctl start forgeboard
```

## SSL/HTTPS Setup with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Environment Variables

You can customize ForgeBoard using environment variables in the systemd service file:

- `PORT`: API server port (default: 5000)
- `APPS_CONFIG`: Path to apps.yml (default: apps.yml)
- `DEBUG`: Enable debug mode (default: false)

## Security Considerations

1. **Firewall**: Configure UFW or your firewall to only allow necessary ports
   ```bash
   sudo ufw allow 22/tcp  # SSH
   sudo ufw allow 80/tcp  # HTTP
   sudo ufw allow 443/tcp # HTTPS
   sudo ufw enable
   ```

2. **User Permissions**: ForgeBoard runs as `www-data` user by default. Ensure this user has appropriate permissions.

3. **App Isolation**: Each app runs in its own virtual environment for dependency isolation.

4. **NGINX Security Headers**: Consider adding security headers to your NGINX config:
   ```nginx
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-Frame-Options "DENY" always;
   add_header X-XSS-Protection "1; mode=block" always;
   ```

## Monitoring

### View ForgeBoard Logs
```bash
sudo journalctl -u forgeboard -f
```

### Check Service Status
```bash
sudo systemctl status forgeboard
```

### NGINX Access Logs
```bash
sudo tail -f /var/log/nginx/access.log
```

## Backup

Important files to backup:
- `/opt/forgeboard/backend/apps.yml` - App registry
- `/var/www/apps/` - All deployed apps
- `/etc/nginx/sites-available/forgeboard-*.conf` - Generated NGINX configs

## Troubleshooting

### ForgeBoard won't start
- Check logs: `sudo journalctl -u forgeboard -n 50`
- Verify Python path: `sudo -u www-data /opt/forgeboard/backend/venv/bin/python --version`
- Check permissions on `/opt/forgeboard`

### Apps won't start
- Check systemd service: `sudo systemctl status forgeboard-<app-slug>`
- Verify app virtualenv exists
- Check app logs: `sudo journalctl -u forgeboard-<app-slug> -n 50`

### NGINX errors
- Test config: `sudo nginx -t`
- Check error log: `sudo tail -f /var/log/nginx/error.log`
- Verify upstream is running: `curl http://127.0.0.1:5000/api/health`

## ForgeBoard CLI Tool

The ForgeBoard CLI (`forgeboard-cli`) provides management commands:

### Check System Dependencies
```bash
forgeboard-cli check
```

### Check Service Status
```bash
forgeboard-cli status
```

### Full Installation
```bash
sudo forgeboard-cli install --domain yourdomain.com
```

## Updating ForgeBoard

1. Backup your data
   ```bash
   sudo cp -r /opt/forgeboard/backend/apps.yml /opt/forgeboard/backend/apps.yml.backup
   sudo tar -czf /backup/forgeboard-apps-$(date +%Y%m%d).tar.gz /var/www/apps
   ```

2. Pull latest code
   ```bash
   cd /path/to/forgeboard
   git pull origin main
   ```

3. Update backend dependencies:
   ```bash
   cd /opt/forgeboard/backend
   sudo -u www-data ./venv/bin/pip install -r requirements.txt
   ```

4. Rebuild frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   sudo cp -r dist/* /opt/forgeboard/frontend/
   ```

5. Restart service:
   ```bash
   sudo systemctl restart forgeboard
   sudo systemctl reload nginx
   ```

## Production Best Practices

1. **Regular Backups**: Set up automated backups for:
   - `/opt/forgeboard/backend/apps.yml`
   - `/var/www/apps/` directory
   - NGINX configurations

2. **Monitoring**: Use tools like:
   - `systemctl status forgeboard` for service health
   - `htop` for resource usage
   - `fail2ban` for security

3. **Log Rotation**: Configure logrotate for ForgeBoard logs:
   ```bash
   sudo nano /etc/logrotate.d/forgeboard
   ```
   ```
   /var/log/forgeboard/*.log {
       daily
       missingok
       rotate 14
       compress
       notifempty
       create 0640 www-data www-data
       sharedscripts
       postrotate
           systemctl reload forgeboard >/dev/null 2>&1
       endscript
   }
   ```

4. **Performance Tuning**:
   - Adjust Gunicorn workers based on CPU cores
   - Enable NGINX caching for static assets
   - Use Redis for session storage (future enhancement)