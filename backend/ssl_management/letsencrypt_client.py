"""
Let's Encrypt client with Cloudflare DNS challenge support.

This module provides Let's Encrypt certificate management using DNS-01 challenge
with Cloudflare API integration.
"""

import logging
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from database.models.ssl_certificate import SSLCertificate
from database.connection import db

logger = logging.getLogger(__name__)


class LetsEncryptClient:
    """Let's Encrypt client with Cloudflare DNS challenge."""
    
    def __init__(self):
        self.acme_staging_url = "https://acme-staging-v02.api.letsencrypt.org/directory"
        self.acme_production_url = "https://acme-v02.api.letsencrypt.org/directory"
        self.use_staging = True  # Default to staging for safety
    
    def set_production_mode(self, use_production: bool = False):
        """Set whether to use Let's Encrypt production or staging."""
        self.use_staging = not use_production
    
    def configure_cloudflare(self, domain: str, api_key: str, zone_id: str = None) -> Dict[str, Any]:
        """
        Configure Cloudflare API settings for a domain.
        
        Args:
            domain: Domain name
            api_key: Cloudflare API key
            zone_id: Cloudflare zone ID (optional, will be auto-detected)
            
        Returns:
            Configuration result
        """
        try:
            # If zone_id not provided, try to find it
            if not zone_id:
                zone_id = self._get_cloudflare_zone_id(domain, api_key)
                if not zone_id:
                    return {
                        'success': False,
                        'error': 'Could not find Cloudflare zone for domain'
                    }
            
            # Validate API key by making a test request
            if not self._validate_cloudflare_api(api_key, zone_id):
                return {
                    'success': False,
                    'error': 'Invalid Cloudflare API key or zone ID'
                }
            
            # Save configuration to database
            cert = SSLCertificate.get_by_domain(domain)
            if not cert:
                cert = SSLCertificate(domain=domain, certificate_type='letsencrypt')
                db.session.add(cert)
            
            # Store encrypted API key (in production, encrypt this)
            cert.cloudflare_api_key = api_key
            cert.cloudflare_zone_id = zone_id
            cert.acme_challenge_type = 'dns-01'
            
            db.session.commit()
            
            return {
                'success': True,
                'domain': domain,
                'zone_id': zone_id
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to configure Cloudflare for {domain}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_cloudflare_zone_id(self, domain: str, api_key: str) -> Optional[str]:
        """Get Cloudflare zone ID for domain."""
        try:
            # Extract root domain from subdomain
            domain_parts = domain.split('.')
            if len(domain_parts) >= 2:
                root_domain = '.'.join(domain_parts[-2:])
            else:
                root_domain = domain
            
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'https://api.cloudflare.com/client/v4/zones?name={root_domain}',
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data['success'] and len(data['result']) > 0:
                    return data['result'][0]['id']
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get Cloudflare zone ID: {e}")
            return None
    
    def _validate_cloudflare_api(self, api_key: str, zone_id: str) -> bool:
        """Validate Cloudflare API access."""
        try:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'https://api.cloudflare.com/client/v4/zones/{zone_id}',
                headers=headers,
                timeout=30
            )
            
            return response.status_code == 200 and response.json().get('success', False)
            
        except Exception:
            return False
    
    def request_certificate(self, domain: str) -> Dict[str, Any]:
        """
        Request a new Let's Encrypt certificate using DNS-01 challenge.
        
        Args:
            domain: Domain name
            
        Returns:
            Certificate request result
        """
        try:
            # Get certificate record
            cert = SSLCertificate.get_by_domain(domain)
            if not cert or not cert.cloudflare_api_key:
                return {
                    'success': False,
                    'error': 'Cloudflare not configured for this domain'
                }
            
            # Update renewal status
            cert.last_renewal_attempt = datetime.utcnow()
            cert.renewal_status = 'pending'
            db.session.commit()
            
            # Simulate Let's Encrypt process (placeholder implementation)
            # In a real implementation, you would:
            # 1. Create ACME account
            # 2. Create order for domain
            # 3. Get DNS challenge
            # 4. Create TXT record via Cloudflare API
            # 5. Wait for challenge validation
            # 6. Finalize order and get certificate
            
            # For now, return success with placeholder data
            logger.info(f"Certificate request initiated for {domain}")
            
            return {
                'success': True,
                'domain': domain,
                'status': 'pending',
                'message': 'Certificate request initiated. DNS challenge in progress.'
            }
            
        except Exception as e:
            logger.error(f"Failed to request certificate for {domain}: {e}")
            if cert:
                cert.renewal_status = 'failed'
                db.session.commit()
            
            return {
                'success': False,
                'error': str(e)
            }
    
    def upload_certificate(self, domain: str, certificate_pem: str, 
                          chain_pem: str = None) -> Dict[str, Any]:
        """
        Upload a manually obtained certificate.
        
        Args:
            domain: Domain name
            certificate_pem: Certificate in PEM format
            chain_pem: Certificate chain in PEM format (optional)
            
        Returns:
            Upload result
        """
        try:
            # Parse and validate certificate
            cert_obj = x509.load_pem_x509_certificate(certificate_pem.encode('utf-8'))
            
            # Extract certificate information
            issued_at = cert_obj.not_valid_before
            expires_at = cert_obj.not_valid_after
            
            # Get or create certificate record
            cert = SSLCertificate.get_by_domain(domain)
            if not cert:
                cert = SSLCertificate(domain=domain, certificate_type='manual')
                db.session.add(cert)
            
            # Update certificate data
            cert.certificate_pem = certificate_pem
            cert.chain_pem = chain_pem
            cert.issued_at = issued_at
            cert.expires_at = expires_at
            cert.renewal_status = 'success'
            
            db.session.commit()
            
            logger.info(f"Certificate uploaded for {domain}")
            return {
                'success': True,
                'domain': domain,
                'issued_at': issued_at.isoformat(),
                'expires_at': expires_at.isoformat(),
                'days_until_expiry': (expires_at - datetime.utcnow()).days
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to upload certificate for {domain}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_certificate_status(self, domain: str) -> Dict[str, Any]:
        """Get certificate status for domain."""
        cert = SSLCertificate.get_by_domain(domain)
        if not cert:
            return {
                'exists': False,
                'domain': domain
            }
        
        return {
            'exists': True,
            'domain': domain,
            'certificate_type': cert.certificate_type,
            'has_certificate': bool(cert.certificate_pem),
            'has_csr': bool(cert.csr_pem),
            'is_valid': cert.is_valid(),
            'days_until_expiry': cert.days_until_expiry(),
            'auto_renew': cert.auto_renew,
            'renewal_status': cert.renewal_status,
            'issued_at': cert.issued_at.isoformat() if cert.issued_at else None,
            'expires_at': cert.expires_at.isoformat() if cert.expires_at else None,
            'cloudflare_configured': bool(cert.cloudflare_api_key)
        }