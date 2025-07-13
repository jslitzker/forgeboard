#!/bin/bash
#
# ForgeBoard Quick Setup Script
# This script automates the installation of ForgeBoard on Ubuntu 22.04+
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for colored output
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

# Default values
INSTALL_DIR="/opt/forgeboard"
APPS_DIR="/var/www/apps"
USER="www-data"
GROUP="www-data"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

print_header "ForgeBoard Installation Script"
print_info "This script will install ForgeBoard and all its dependencies"
print_info "Installation directory: $INSTALL_DIR"
echo

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Update package list
print_header "Updating System Packages"
apt update
print_success "Package list updated"

# Install system dependencies
print_header "Installing System Dependencies"

# Python and build tools
print_info "Installing Python and build tools..."
apt install -y python3-pip python3-venv python3-dev build-essential
print_success "Python and build tools installed"

# NGINX
if ! command -v nginx &> /dev/null; then
    print_info "Installing NGINX..."
    apt install -y nginx
    print_success "NGINX installed"
else
    print_success "NGINX already installed"
fi

# Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    print_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    print_success "Node.js installed"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js already installed (version $NODE_VERSION)"
fi

# Cookiecutter
print_info "Installing Cookiecutter..."
pip3 install cookiecutter
print_success "Cookiecutter installed"

# Create directory structure
print_header "Creating Directory Structure"
mkdir -p "$INSTALL_DIR"/{backend,frontend,scaffold}
mkdir -p "$APPS_DIR"
mkdir -p /var/log/forgeboard
mkdir -p /etc/forgeboard
print_success "Directory structure created"

# Copy files
print_header "Installing ForgeBoard Files"

# Backend
if [ -d "$SCRIPT_DIR/backend" ]; then
    cp -r "$SCRIPT_DIR/backend/." "$INSTALL_DIR/backend/"
    print_success "Backend files copied"
else
    print_error "Backend directory not found at $SCRIPT_DIR/backend"
    exit 1
fi

# Scaffold templates
if [ -d "$SCRIPT_DIR/scaffold" ]; then
    cp -r "$SCRIPT_DIR/scaffold/." "$INSTALL_DIR/scaffold/"
    print_success "Scaffold templates copied"
else
    print_error "Scaffold directory not found at $SCRIPT_DIR/scaffold"
    exit 1
fi

# Set up Python virtual environment
print_header "Setting Up Python Environment"
cd "$INSTALL_DIR/backend"
python3 -m venv venv
print_success "Virtual environment created"

# Install Python dependencies
print_info "Installing Python dependencies..."
"$INSTALL_DIR/backend/venv/bin/pip" install -r requirements.txt
"$INSTALL_DIR/backend/venv/bin/pip" install gunicorn
print_success "Python dependencies installed"

# Build frontend
print_header "Building Frontend Application"
if [ -d "$SCRIPT_DIR/frontend" ]; then
    cd "$SCRIPT_DIR/frontend"
    print_info "Installing npm dependencies..."
    npm install
    print_info "Building frontend..."
    npm run build
    print_success "Frontend built successfully"
    
    # Copy built files
    cp -r dist/. "$INSTALL_DIR/frontend/"
    print_success "Frontend files installed"
else
    print_error "Frontend directory not found at $SCRIPT_DIR/frontend"
    exit 1
fi

# Create initial apps.yml if it doesn't exist
if [ ! -f "$INSTALL_DIR/backend/apps.yml" ]; then
    echo "apps: []" > "$INSTALL_DIR/backend/apps.yml"
    print_success "Created initial apps.yml"
fi

# Set permissions
print_header "Setting Permissions"
chown -R $USER:$GROUP "$INSTALL_DIR"
chown -R $USER:$GROUP "$APPS_DIR"
chown -R $USER:$GROUP /var/log/forgeboard
chmod 755 "$INSTALL_DIR"
chmod 755 "$APPS_DIR"
chmod 755 /var/log/forgeboard
print_success "Permissions set"

# Create systemd service
print_header "Creating Systemd Service"
cat > /etc/systemd/system/forgeboard.service << EOF
[Unit]
Description=ForgeBoard API Server
After=network.target

[Service]
Type=simple
User=$USER
Group=$GROUP
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=$INSTALL_DIR/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="APPS_CONFIG=$INSTALL_DIR/backend/apps.yml"
ExecStart=$INSTALL_DIR/backend/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 main:app
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
print_success "Systemd service created"

# Configure NGINX
print_header "Configuring NGINX"

# Get domain/hostname
read -p "Enter domain name (default: localhost): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

cat > /etc/nginx/sites-available/forgeboard << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    location / {
        root $INSTALL_DIR/frontend;
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Swagger docs
    location /docs {
        proxy_pass http://127.0.0.1:5000/docs;
        proxy_set_header Host \$host;
    }

    location /flasgger_static {
        proxy_pass http://127.0.0.1:5000/flasgger_static;
    }

    location /apispec.json {
        proxy_pass http://127.0.0.1:5000/apispec.json;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/forgeboard /etc/nginx/sites-enabled/
print_success "NGINX configured"

# Test NGINX configuration
nginx -t
print_success "NGINX configuration valid"

# Start services
print_header "Starting Services"
systemctl daemon-reload
systemctl enable forgeboard
systemctl start forgeboard
print_success "ForgeBoard service started"

systemctl reload nginx
print_success "NGINX reloaded"

# Check status
print_header "Checking Service Status"
sleep 2  # Give services time to start

if systemctl is-active --quiet forgeboard; then
    print_success "ForgeBoard service is running"
else
    print_error "ForgeBoard service failed to start"
    journalctl -u forgeboard -n 20
fi

if systemctl is-active --quiet nginx; then
    print_success "NGINX is running"
else
    print_error "NGINX failed to start"
fi

# Test API
if curl -s http://localhost:5000/api/health > /dev/null; then
    print_success "ForgeBoard API is responding"
else
    print_warning "ForgeBoard API is not responding yet"
fi

# Create CLI symlink
if [ -f "$SCRIPT_DIR/forgeboard-cli" ]; then
    chmod +x "$SCRIPT_DIR/forgeboard-cli"
    ln -sf "$SCRIPT_DIR/forgeboard-cli" /usr/local/bin/forgeboard-cli
    print_success "ForgeBoard CLI installed"
fi

# Final message
print_header "Installation Complete!"
echo
print_success "ForgeBoard has been successfully installed!"
echo
print_info "Access ForgeBoard at: http://$DOMAIN/"
print_info "API documentation at: http://$DOMAIN/docs"
echo
print_info "Useful commands:"
echo "  systemctl status forgeboard    # Check ForgeBoard status"
echo "  journalctl -u forgeboard -f    # View ForgeBoard logs"
echo "  forgeboard-cli status          # Check all services"
echo
print_warning "Remember to configure your firewall if needed!"
print_warning "For HTTPS, run: sudo certbot --nginx -d $DOMAIN"