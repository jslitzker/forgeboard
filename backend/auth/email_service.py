"""
Email notification service for ForgeBoard authentication.

This module provides email functionality with support for both SMTP and OAuth2 (Azure AD/Exchange Online).
"""

import smtplib
import ssl
import json
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from jinja2 import Template
import requests
from flask import current_app

from config.manager import ConfigManager


class EmailProvider:
    """Base class for email providers."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize email provider."""
        self.config = config
    
    def send_email(self, to_email: str, subject: str, body_text: str, body_html: str = None) -> bool:
        """Send email."""
        raise NotImplementedError
    
    def test_connection(self) -> Dict[str, Any]:
        """Test email provider connection."""
        raise NotImplementedError


class SMTPEmailProvider(EmailProvider):
    """SMTP email provider."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize SMTP provider."""
        super().__init__(config)
        self.smtp_host = config.get('smtp_host')
        self.smtp_port = config.get('smtp_port', 587)
        self.smtp_username = config.get('smtp_username')
        self.smtp_password = config.get('smtp_password')
        self.smtp_use_tls = config.get('smtp_use_tls', True)
        self.smtp_use_ssl = config.get('smtp_use_ssl', False)
        self.from_email = config.get('from_email')
        self.from_name = config.get('from_name', 'ForgeBoard')
    
    def send_email(self, to_email: str, subject: str, body_text: str, body_html: str = None) -> bool:
        """Send email via SMTP."""
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.from_name} <{self.from_email}>"
            message['To'] = to_email
            
            # Add text part
            text_part = MIMEText(body_text, 'plain')
            message.attach(text_part)
            
            # Add HTML part if provided
            if body_html:
                html_part = MIMEText(body_html, 'html')
                message.attach(html_part)
            
            # Create SMTP connection
            if self.smtp_use_ssl:
                context = ssl.create_default_context()
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
                if self.smtp_use_tls:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
            
            # Login and send
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            
            server.send_message(message)
            server.quit()
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"SMTP email error: {str(e)}")
            return False
    
    def test_connection(self) -> Dict[str, Any]:
        """Test SMTP connection."""
        try:
            if self.smtp_use_ssl:
                context = ssl.create_default_context()
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
                if self.smtp_use_tls:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
            
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            
            server.quit()
            
            return {'success': True, 'message': 'SMTP connection successful'}
            
        except Exception as e:
            return {'success': False, 'message': f'SMTP connection failed: {str(e)}'}


class OAuth2EmailProvider(EmailProvider):
    """OAuth2 email provider for Azure AD/Exchange Online."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize OAuth2 provider."""
        super().__init__(config)
        self.tenant_id = config.get('tenant_id')
        self.client_id = config.get('client_id')
        self.client_secret = config.get('client_secret')
        self.from_email = config.get('from_email')
        self.from_name = config.get('from_name', 'ForgeBoard')
        self.scope = config.get('scope', 'https://graph.microsoft.com/.default')
        self.graph_api_url = 'https://graph.microsoft.com/v1.0'
        self.token_url = f'https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token'
    
    def _get_access_token(self) -> Optional[str]:
        """Get OAuth2 access token."""
        try:
            data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': self.scope
            }
            
            response = requests.post(self.token_url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            return token_data.get('access_token')
            
        except Exception as e:
            current_app.logger.error(f"OAuth2 token error: {str(e)}")
            return None
    
    def send_email(self, to_email: str, subject: str, body_text: str, body_html: str = None) -> bool:
        """Send email via Microsoft Graph API."""
        try:
            access_token = self._get_access_token()
            if not access_token:
                return False
            
            # Prepare email data
            email_data = {
                'message': {
                    'subject': subject,
                    'body': {
                        'contentType': 'HTML' if body_html else 'Text',
                        'content': body_html or body_text
                    },
                    'toRecipients': [
                        {
                            'emailAddress': {
                                'address': to_email
                            }
                        }
                    ],
                    'from': {
                        'emailAddress': {
                            'address': self.from_email,
                            'name': self.from_name
                        }
                    }
                }
            }
            
            # Send via Graph API
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # For application permissions, we need to send on behalf of a specific user
            # The from_email must be a valid mailbox in the tenant
            url = f'{self.graph_api_url}/users/{self.from_email}/sendMail'
            response = requests.post(url, json=email_data, headers=headers)
            
            # Log the response for debugging
            current_app.logger.info(f"Graph API Response Status: {response.status_code}")
            if response.status_code != 202:  # sendMail returns 202 on success
                current_app.logger.error(f"Graph API Error: {response.text}")
            
            response.raise_for_status()
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"OAuth2 email error: {str(e)}")
            return False
    
    def test_connection(self) -> Dict[str, Any]:
        """Test OAuth2 connection."""
        try:
            access_token = self._get_access_token()
            if not access_token:
                return {'success': False, 'message': 'Failed to get access token'}
            
            # Test by getting user info
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            url = f'{self.graph_api_url}/users/{self.from_email}'
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            return {'success': True, 'message': 'OAuth2 connection successful'}
            
        except Exception as e:
            return {'success': False, 'message': f'OAuth2 connection failed: {str(e)}'}


class EmailService:
    """Main email service class."""
    
    def __init__(self, config_manager: ConfigManager):
        """Initialize email service."""
        self.config_manager = config_manager
        self.templates = {
            'password_reset': {
                'subject': 'Password Reset Request - ForgeBoard',
                'text': '''
Hello {{ user.display_name }},

You have requested to reset your password for ForgeBoard.

Please click the following link to reset your password:
{{ reset_url }}

This link will expire in {{ expires_in }} minutes.

If you did not request this password reset, please ignore this email.

Best regards,
ForgeBoard Team
''',
                'html': '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello {{ user.display_name }},</p>
            <p>You have requested to reset your password for ForgeBoard.</p>
            <p>Please click the button below to reset your password:</p>
            <p style="text-align: center;">
                <a href="{{ reset_url }}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in {{ expires_in }} minutes.</p>
            <p>If you did not request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from ForgeBoard. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
'''
            },
            'welcome': {
                'subject': 'Welcome to ForgeBoard',
                'text': '''
Hello {{ user.display_name }},

Welcome to ForgeBoard! Your account has been created successfully.

Username: {{ user.username }}
Email: {{ user.email }}

You can now log in to the ForgeBoard dashboard to start managing your applications.

Best regards,
ForgeBoard Team
''',
                'html': '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to ForgeBoard</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ForgeBoard!</h1>
        </div>
        <div class="content">
            <p>Hello {{ user.display_name }},</p>
            <p>Welcome to ForgeBoard! Your account has been created successfully.</p>
            <p><strong>Username:</strong> {{ user.username }}</p>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p>You can now log in to the ForgeBoard dashboard to start managing your applications.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from ForgeBoard. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
'''
            }
        }
    
    def _get_provider(self) -> Optional[EmailProvider]:
        """Get configured email provider."""
        try:
            email_config = self.config_manager.get_category('email')
            if not email_config or not email_config.get('enabled'):
                return None
            
            provider_type = email_config.get('provider', 'smtp')
            
            if provider_type == 'smtp':
                return SMTPEmailProvider(email_config)
            elif provider_type == 'oauth2':
                return OAuth2EmailProvider(email_config)
            else:
                current_app.logger.error(f"Unknown email provider: {provider_type}")
                return None
                
        except Exception as e:
            current_app.logger.error(f"Email provider configuration error: {str(e)}")
            return None
    
    def send_template_email(self, template_name: str, to_email: str, context: Dict[str, Any]) -> bool:
        """Send templated email."""
        provider = self._get_provider()
        if not provider:
            return False
        
        template_config = self.templates.get(template_name)
        if not template_config:
            current_app.logger.error(f"Unknown email template: {template_name}")
            return False
        
        try:
            # Render templates
            subject = Template(template_config['subject']).render(**context)
            body_text = Template(template_config['text']).render(**context)
            body_html = Template(template_config['html']).render(**context)
            
            return provider.send_email(to_email, subject, body_text, body_html)
            
        except Exception as e:
            current_app.logger.error(f"Email template rendering error: {str(e)}")
            return False
    
    def send_password_reset_email(self, user: Any, reset_token: str, base_url: str) -> bool:
        """Send password reset email."""
        reset_url = f"{base_url}/auth/reset-password?token={reset_token}"
        
        context = {
            'user': user,
            'reset_url': reset_url,
            'reset_token': reset_token,
            'expires_in': 60  # 1 hour
        }
        
        return self.send_template_email('password_reset', user.email, context)
    
    def send_welcome_email(self, user: Any) -> bool:
        """Send welcome email to new user."""
        context = {
            'user': user
        }
        
        return self.send_template_email('welcome', user.email, context)
    
    def test_email_configuration(self) -> Dict[str, Any]:
        """Test email configuration."""
        provider = self._get_provider()
        if not provider:
            return {'success': False, 'message': 'Email provider not configured'}
        
        return provider.test_connection()
    
    def is_enabled(self) -> bool:
        """Check if email is enabled."""
        try:
            email_config = self.config_manager.get_category('email')
            return email_config and email_config.get('enabled', False)
        except:
            return False
    
    def get_configuration(self) -> Dict[str, Any]:
        """Get email configuration (sanitized)."""
        try:
            email_config = self.config_manager.get_category('email')
            if not email_config:
                return {'enabled': False}
            
            # Return sanitized config (no secrets)
            sanitized = {
                'enabled': email_config.get('enabled', False),
                'provider': email_config.get('provider', 'smtp'),
                'from_email': email_config.get('from_email'),
                'from_name': email_config.get('from_name', 'ForgeBoard')
            }
            
            if email_config.get('provider') == 'smtp':
                sanitized.update({
                    'smtp_host': email_config.get('smtp_host'),
                    'smtp_port': email_config.get('smtp_port', 587),
                    'smtp_username': email_config.get('smtp_username'),
                    'smtp_password': 'REDACTED' if email_config.get('smtp_password') else '',
                    'smtp_use_tls': email_config.get('smtp_use_tls', True),
                    'smtp_use_ssl': email_config.get('smtp_use_ssl', False)
                })
            elif email_config.get('provider') == 'oauth2':
                sanitized.update({
                    'tenant_id': email_config.get('tenant_id'),
                    'client_id': email_config.get('client_id'),
                    'client_secret': 'REDACTED' if email_config.get('client_secret') else '',
                    'scope': email_config.get('scope', 'https://graph.microsoft.com/.default'),
                    # Include empty SMTP fields for frontend compatibility
                    'smtp_host': '',
                    'smtp_port': 587,
                    'smtp_username': '',
                    'smtp_password': '',
                    'smtp_use_tls': True,
                    'smtp_use_ssl': False
                })
            
            return sanitized
            
        except Exception as e:
            current_app.logger.error(f"Email configuration error: {str(e)}")
            return {'enabled': False}
    
    def update_configuration(self, config: Dict[str, Any]) -> bool:
        """Update email configuration."""
        try:
            # Get existing configuration to preserve encrypted values
            existing_config = self.config_manager.get_category('email')
            
            # Merge with new config, preserving existing encrypted values for empty/redacted fields
            merged_config = config.copy()
            
            # Preserve existing encrypted values if new value is empty or "REDACTED"
            sensitive_fields = ['smtp_password', 'client_secret', 'tenant_id', 'client_id']
            if existing_config:
                for field in sensitive_fields:
                    new_value = merged_config.get(field, '')
                    if not new_value or new_value == 'REDACTED':
                        existing_value = existing_config.get(field, '')
                        if existing_value:
                            merged_config[field] = existing_value
            
            # Define which keys should be encrypted
            encrypt_keys = ['smtp_password', 'client_secret', 'tenant_id', 'client_id']
            return self.config_manager.set_category('email', merged_config, encrypt_keys)
        except Exception as e:
            current_app.logger.error(f"Email configuration update error: {str(e)}")
            return False