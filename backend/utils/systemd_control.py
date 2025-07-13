import os
import subprocess
import tempfile
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from typing import Optional, Tuple, List
from .yaml_loader import App


class SystemdController:
    def __init__(self, template_dir: str = 'templates', 
                 systemd_dir: str = '/etc/systemd/system',
                 user: str = 'www-data',
                 group: str = 'www-data'):
        self.template_dir = template_dir
        self.systemd_dir = systemd_dir
        self.user = user
        self.group = group
        
        # Set up Jinja2 environment
        template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), template_dir)
        self.env = Environment(loader=FileSystemLoader(template_path))
        self.template = self.env.get_template('app.service.j2')

    def get_service_name(self, app: App) -> str:
        return f"forgeboard-{app.slug}.service"

    def generate_service(self, app: App) -> str:
        context = {
            'app': app,
            'user': self.user,
            'group': self.group,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        return self.template.render(context)

    def write_service(self, app: App, dry_run: bool = False) -> Tuple[bool, str]:
        try:
            service_content = self.generate_service(app)
            service_name = self.get_service_name(app)
            service_path = os.path.join(self.systemd_dir, service_name)
            
            if dry_run:
                return True, service_content
            
            # Write service file (requires sudo in production)
            with open(service_path, 'w') as f:
                f.write(service_content)
            
            # Reload systemd daemon
            result = subprocess.run(['systemctl', 'daemon-reload'], 
                                  capture_output=True, text=True)
            
            if result.returncode != 0:
                return False, f"Failed to reload systemd: {result.stderr}"
            
            return True, f"Service file written to {service_path}"
            
        except Exception as e:
            return False, str(e)

    def remove_service(self, app: App) -> Tuple[bool, str]:
        try:
            service_name = self.get_service_name(app)
            service_path = os.path.join(self.systemd_dir, service_name)
            
            # Stop service first if running
            self.stop_service(app)
            
            # Disable service
            subprocess.run(['systemctl', 'disable', service_name], 
                         capture_output=True, text=True)
            
            # Remove service file
            if os.path.exists(service_path):
                os.remove(service_path)
            
            # Reload systemd
            subprocess.run(['systemctl', 'daemon-reload'], 
                         capture_output=True, text=True)
            
            return True, f"Service {service_name} removed"
            
        except Exception as e:
            return False, str(e)

    def start_service(self, app: App) -> Tuple[bool, str]:
        try:
            service_name = self.get_service_name(app)
            
            # Enable service first
            enable_result = subprocess.run(
                ['systemctl', 'enable', service_name],
                capture_output=True, text=True
            )
            
            # Start service
            result = subprocess.run(
                ['systemctl', 'start', service_name],
                capture_output=True, text=True
            )
            
            if result.returncode == 0:
                return True, f"Service {service_name} started"
            else:
                return False, result.stderr
                
        except Exception as e:
            return False, str(e)

    def stop_service(self, app: App) -> Tuple[bool, str]:
        try:
            service_name = self.get_service_name(app)
            
            result = subprocess.run(
                ['systemctl', 'stop', service_name],
                capture_output=True, text=True
            )
            
            if result.returncode == 0:
                return True, f"Service {service_name} stopped"
            else:
                # Service might not exist, which is OK for stop
                if "not loaded" in result.stderr:
                    return True, f"Service {service_name} not found (already stopped)"
                return False, result.stderr
                
        except Exception as e:
            return False, str(e)

    def restart_service(self, app: App) -> Tuple[bool, str]:
        try:
            service_name = self.get_service_name(app)
            
            result = subprocess.run(
                ['systemctl', 'restart', service_name],
                capture_output=True, text=True
            )
            
            if result.returncode == 0:
                return True, f"Service {service_name} restarted"
            else:
                return False, result.stderr
                
        except Exception as e:
            return False, str(e)

    def get_service_status(self, app: App) -> dict:
        try:
            service_name = self.get_service_name(app)
            
            # Check if service exists
            check_result = subprocess.run(
                ['systemctl', 'list-unit-files', service_name],
                capture_output=True, text=True
            )
            
            if service_name not in check_result.stdout:
                return {
                    'exists': False,
                    'active': False,
                    'enabled': False,
                    'status': 'not-found'
                }
            
            # Get detailed status
            status_result = subprocess.run(
                ['systemctl', 'is-active', service_name],
                capture_output=True, text=True
            )
            
            enabled_result = subprocess.run(
                ['systemctl', 'is-enabled', service_name],
                capture_output=True, text=True
            )
            
            # Get full status info
            full_status = subprocess.run(
                ['systemctl', 'status', service_name, '--no-pager'],
                capture_output=True, text=True
            )
            
            return {
                'exists': True,
                'active': status_result.stdout.strip() == 'active',
                'enabled': enabled_result.stdout.strip() == 'enabled',
                'status': status_result.stdout.strip(),
                'details': full_status.stdout
            }
            
        except Exception as e:
            return {
                'exists': False,
                'active': False,
                'enabled': False,
                'status': 'error',
                'error': str(e)
            }

    def get_service_logs(self, app: App, lines: int = 50, follow: bool = False) -> Tuple[bool, str]:
        try:
            service_name = self.get_service_name(app)
            
            cmd = ['journalctl', '-u', service_name, f'-n', str(lines)]
            if not follow:
                cmd.append('--no-pager')
            else:
                cmd.append('-f')
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                return True, result.stdout
            else:
                return False, result.stderr
                
        except Exception as e:
            return False, str(e)

    def check_permissions(self) -> Tuple[bool, str]:
        checks = []
        
        # Check systemd directory
        if not os.path.exists(self.systemd_dir):
            checks.append(f"Systemd directory not found: {self.systemd_dir}")
        elif not os.access(self.systemd_dir, os.W_OK):
            checks.append(f"No write permission for: {self.systemd_dir}")
        
        # Check if we can run systemctl
        try:
            result = subprocess.run(['systemctl', '--version'], 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                checks.append("Cannot execute systemctl")
        except:
            checks.append("systemctl command not found")
        
        if checks:
            return False, "; ".join(checks)
        return True, "All permissions OK"

    def validate_service_file(self, app: App) -> Tuple[bool, List[str]]:
        errors = []
        
        # Check if virtualenv exists
        if not os.path.exists(app.virtualenv):
            errors.append(f"Virtual environment not found: {app.virtualenv}")
        
        # Check if app path exists
        if not os.path.exists(app.path):
            errors.append(f"App path not found: {app.path}")
        
        # Check if entry point exists
        entry_point_path = os.path.join(app.path, app.entry_point)
        if not os.path.exists(entry_point_path):
            errors.append(f"Entry point not found: {entry_point_path}")
        
        # Validate port
        if app.port < 1024 or app.port > 65535:
            errors.append(f"Invalid port: {app.port}")
        
        return len(errors) == 0, errors