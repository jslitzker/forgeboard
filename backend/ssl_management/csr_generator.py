"""
Certificate Signing Request (CSR) generator for ForgeBoard.

This module generates CSRs for SSL certificates.
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from database.models.ssl_certificate import SSLCertificate
from database.connection import db

logger = logging.getLogger(__name__)


class CSRGenerator:
    """Certificate Signing Request generator."""
    
    def __init__(self):
        self.key_size = 2048
    
    def generate_csr(self, domain: str, organization: str = "ForgeBoard", 
                    country: str = "US", state: str = "CA", 
                    city: str = "San Francisco", email: str = None) -> Dict[str, Any]:
        """
        Generate a CSR for the given domain.
        
        Args:
            domain: Primary domain name
            organization: Organization name
            country: Country code (2 letters)
            state: State or province
            city: City or locality
            email: Email address
            
        Returns:
            Dictionary with CSR, private key, and metadata
        """
        try:
            # Generate private key
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=self.key_size,
            )
            
            # Build subject name
            subject_components = [
                x509.NameAttribute(NameOID.COMMON_NAME, domain),
                x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization),
                x509.NameAttribute(NameOID.COUNTRY_NAME, country),
                x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, state),
                x509.NameAttribute(NameOID.LOCALITY_NAME, city),
            ]
            
            if email:
                subject_components.append(
                    x509.NameAttribute(NameOID.EMAIL_ADDRESS, email)
                )
            
            subject = x509.Name(subject_components)
            
            # Create CSR
            csr = x509.CertificateSigningRequestBuilder().subject_name(
                subject
            ).add_extension(
                x509.SubjectAlternativeName([
                    x509.DNSName(domain),
                    x509.DNSName(f"*.{domain}"),  # Wildcard
                ]),
                critical=False,
            ).sign(private_key, hashes.SHA256())
            
            # Serialize to PEM
            csr_pem = csr.public_bytes(serialization.Encoding.PEM).decode('utf-8')
            private_key_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ).decode('utf-8')
            
            return {
                'success': True,
                'csr_pem': csr_pem,
                'private_key_pem': private_key_pem,
                'domain': domain,
                'organization': organization,
                'country': country,
                'state': state,
                'city': city,
                'email': email,
                'key_size': self.key_size,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to generate CSR for {domain}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def save_csr(self, domain: str, csr_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save CSR to database.
        
        Args:
            domain: Domain name
            csr_data: CSR data from generate_csr
            
        Returns:
            Result dictionary
        """
        try:
            # Get or create SSL certificate record
            cert = SSLCertificate.get_by_domain(domain)
            if not cert:
                cert = SSLCertificate(domain=domain, certificate_type='manual')
                db.session.add(cert)
            
            # Update CSR data
            cert.csr_pem = csr_data['csr_pem']
            cert.csr_generated_at = datetime.utcnow()
            
            # Store private key (this should be encrypted in production)
            # Note: In a real implementation, you'd encrypt this with the bootstrap cipher
            cert.private_key_pem = csr_data['private_key_pem']
            
            db.session.commit()
            
            logger.info(f"CSR saved for domain {domain}")
            return {
                'success': True,
                'certificate_id': cert.id,
                'domain': domain
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to save CSR for {domain}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_csr(self, domain: str) -> Optional[str]:
        """Get CSR for domain."""
        cert = SSLCertificate.get_by_domain(domain)
        return cert.csr_pem if cert else None
    
    def validate_csr(self, csr_pem: str) -> Dict[str, Any]:
        """
        Validate CSR format and extract information.
        
        Args:
            csr_pem: CSR in PEM format
            
        Returns:
            Validation result with CSR details
        """
        try:
            # Parse CSR
            csr = x509.load_pem_x509_csr(csr_pem.encode('utf-8'))
            
            # Extract subject information
            subject = csr.subject
            subject_dict = {}
            for attribute in subject:
                subject_dict[attribute.oid._name] = attribute.value
            
            # Extract SANs
            sans = []
            try:
                san_extension = csr.extensions.get_extension_for_oid(
                    x509.oid.ExtensionOID.SUBJECT_ALTERNATIVE_NAME
                )
                sans = [name.value for name in san_extension.value]
            except x509.ExtensionNotFound:
                pass
            
            return {
                'valid': True,
                'subject': subject_dict,
                'sans': sans,
                'public_key_size': csr.public_key().key_size,
                'signature_algorithm': csr.signature_algorithm_oid._name
            }
            
        except Exception as e:
            return {
                'valid': False,
                'error': str(e)
            }