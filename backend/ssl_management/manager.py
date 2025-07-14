"""
SSL Manager for ForgeBoard.

This module provides a unified interface for SSL certificate management.
"""

import logging
from typing import Dict, Any, List
from .csr_generator import CSRGenerator
from .letsencrypt_client import LetsEncryptClient
from database.models.ssl_certificate import SSLCertificate

logger = logging.getLogger(__name__)


class SSLManager:
    """SSL certificate manager."""
    
    def __init__(self):
        self.csr_generator = CSRGenerator()
        self.letsencrypt_client = LetsEncryptClient()
    
    def generate_csr(self, domain: str, **kwargs) -> Dict[str, Any]:
        """Generate and save CSR for domain."""
        # Generate CSR
        result = self.csr_generator.generate_csr(domain, **kwargs)
        
        if result['success']:
            # Save to database
            save_result = self.csr_generator.save_csr(domain, result)
            if not save_result['success']:
                return save_result
            
            # Return CSR data (without private key for security)
            return {
                'success': True,
                'csr_pem': result['csr_pem'],
                'domain': domain,
                'generated_at': result['generated_at']
            }
        
        return result
    
    def upload_certificate(self, domain: str, certificate_pem: str, 
                          chain_pem: str = None) -> Dict[str, Any]:
        """Upload certificate for domain."""
        return self.letsencrypt_client.upload_certificate(
            domain, certificate_pem, chain_pem
        )
    
    def configure_letsencrypt(self, domain: str, cloudflare_api_key: str,
                             zone_id: str = None) -> Dict[str, Any]:
        """Configure Let's Encrypt with Cloudflare for domain."""
        return self.letsencrypt_client.configure_cloudflare(
            domain, cloudflare_api_key, zone_id
        )
    
    def request_letsencrypt_certificate(self, domain: str) -> Dict[str, Any]:
        """Request Let's Encrypt certificate for domain."""
        return self.letsencrypt_client.request_certificate(domain)
    
    def get_certificate_status(self, domain: str) -> Dict[str, Any]:
        """Get certificate status for domain."""
        return self.letsencrypt_client.get_certificate_status(domain)
    
    def list_certificates(self) -> List[Dict[str, Any]]:
        """List all certificates."""
        certificates = SSLCertificate.query.all()
        return [cert.to_dict() for cert in certificates]
    
    def get_expiring_certificates(self, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """Get certificates expiring within specified days."""
        certificates = SSLCertificate.get_expiring_certificates(days_ahead)
        return [cert.to_dict() for cert in certificates]
    
    def delete_certificate(self, domain: str) -> Dict[str, Any]:
        """Delete certificate configuration for domain."""
        try:
            cert = SSLCertificate.get_by_domain(domain)
            if not cert:
                return {
                    'success': False,
                    'error': 'Certificate not found'
                }
            
            from database.connection import db
            db.session.delete(cert)
            db.session.commit()
            
            logger.info(f"Certificate configuration deleted for {domain}")
            return {
                'success': True,
                'domain': domain
            }
            
        except Exception as e:
            logger.error(f"Failed to delete certificate for {domain}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def renew_certificate(self, domain: str) -> Dict[str, Any]:
        """Renew certificate for domain."""
        cert = SSLCertificate.get_by_domain(domain)
        if not cert:
            return {
                'success': False,
                'error': 'Certificate not found'
            }
        
        if cert.certificate_type == 'letsencrypt':
            return self.request_letsencrypt_certificate(domain)
        else:
            return {
                'success': False,
                'error': 'Manual renewal required for non-Let\'s Encrypt certificates'
            }