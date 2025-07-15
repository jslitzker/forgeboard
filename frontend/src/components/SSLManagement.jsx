import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Shield, Plus, Download, Upload, Key, Globe, Calendar, CheckCircle, AlertTriangle, RefreshCw, Trash2, Settings, HelpCircle, ExternalLink } from 'lucide-react';

const Tooltip = ({ content, children, darkMode }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      {showTooltip && (
        <div className={`absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg max-w-xs bottom-full left-1/2 transform -translate-x-1/2 mb-1 ${
          darkMode 
            ? 'bg-gray-800 text-gray-200 border border-gray-600' 
            : 'bg-gray-900 text-white'
        }`}>
          {content}
          <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
            darkMode ? 'border-t-gray-800' : 'border-t-gray-900'
          }`} />
        </div>
      )}
    </div>
  );
};

const SSLManagement = ({ darkMode }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCSRModal, setShowCSRModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLetsEncryptModal, setShowLetsEncryptModal] = useState(false);
  
  const { makeAuthenticatedRequest, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin()) {
      fetchCertificates();
    }
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/api/ssl/certificates');
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates);
      } else {
        setError('Failed to fetch SSL certificates');
      }
    } catch (err) {
      setError('Error fetching SSL certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificate = async (domain) => {
    if (!confirm(`Are you sure you want to delete the SSL configuration for ${domain}?`)) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(`/api/ssl/certificates/${domain}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchCertificates();
      } else {
        alert('Failed to delete certificate configuration');
      }
    } catch (err) {
      alert('Error deleting certificate configuration');
    }
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <Shield className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Admin Access Required
        </h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          You need administrator privileges to manage SSL certificates.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            SSL Certificates
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage SSL certificates for secure HTTPS access
          </p>
        </div>
        <div className="flex space-x-3">
          <Tooltip 
            content="Generate a Certificate Signing Request (CSR) for getting certificates from a Certificate Authority"
            darkMode={darkMode}
          >
            <Button
              onClick={() => setShowCSRModal(true)}
              variant="outline"
              className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
            >
              <Key className="h-4 w-4 mr-2" />
              Generate CSR
            </Button>
          </Tooltip>
          <Tooltip 
            content="Upload existing SSL certificate files (private key and certificate)"
            darkMode={darkMode}
          >
            <Button
              onClick={() => setShowUploadModal(true)}
              variant="outline"
              className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Certificate
            </Button>
          </Tooltip>
          <Tooltip 
            content="Automatically obtain and manage SSL certificates using Let's Encrypt with Cloudflare DNS"
            darkMode={darkMode}
          >
            <Button
              onClick={() => setShowLetsEncryptModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Shield className="h-4 w-4 mr-2" />
              Let's Encrypt
            </Button>
          </Tooltip>
          <button
            type="button"
            onClick={() => {
              // Navigate to documentation and then to SSL config section
              window.location.hash = 'docs';
              setTimeout(() => {
                const url = new URL(window.location);
                url.searchParams.set('section', 'system-admin');
                url.searchParams.set('content', 'ssl-config');
                window.history.replaceState({}, '', url);
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }, 100);
            }}
            className={`flex items-center space-x-1 text-xs px-3 py-2 rounded border transition-colors ${
              darkMode 
                ? 'border-gray-600 text-gray-400 hover:text-gray-300 hover:border-gray-500' 
                : 'border-gray-300 text-gray-600 hover:text-gray-700 hover:border-gray-400'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>SSL Guide</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg border ${
          darkMode 
            ? 'bg-red-900/20 border-red-800 text-red-400' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Certificates List */}
      <div className="space-y-4">
        {certificates.length === 0 ? (
          <Card className={`p-12 text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Shield className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No SSL Certificates
            </h3>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              You haven't configured any SSL certificates yet.
            </p>
            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => setShowCSRModal(true)}
                variant="outline"
                className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
              >
                <Key className="h-4 w-4 mr-2" />
                Generate CSR
              </Button>
              <Button
                onClick={() => setShowLetsEncryptModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Shield className="h-4 w-4 mr-2" />
                Let's Encrypt
              </Button>
            </div>
          </Card>
        ) : (
          certificates.map((cert) => (
            <Card key={cert.id} className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      cert.is_valid
                        ? (darkMode ? 'bg-green-900/20' : 'bg-green-50')
                        : (darkMode ? 'bg-red-900/20' : 'bg-red-50')
                    }`}>
                      {cert.is_valid ? (
                        <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                      ) : (
                        <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {cert.domain}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Globe className="w-4 h-4 mr-1" />
                          {cert.certificate_type === 'letsencrypt' ? 'Let\'s Encrypt' : 'Manual'}
                        </span>
                        {cert.expires_at && (
                          <span className={`flex items-center ${
                            cert.days_until_expiry < 30 
                              ? 'text-red-500' 
                              : (darkMode ? 'text-gray-400' : 'text-gray-600')
                          }`}>
                            <Calendar className="w-4 h-4 mr-1" />
                            {cert.days_until_expiry > 0 
                              ? `Expires in ${cert.days_until_expiry} days`
                              : 'Expired'
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Certificate Status */}
                  <div className="mt-3 flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      cert.has_certificate
                        ? (darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800')
                        : (darkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                    }`}>
                      {cert.has_certificate ? 'Certificate Installed' : 'No Certificate'}
                    </span>
                    
                    {cert.has_csr && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800'
                      }`}>
                        CSR Generated
                      </span>
                    )}
                    
                    {cert.cloudflare_configured && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        darkMode ? 'bg-orange-900/20 text-orange-400' : 'bg-orange-100 text-orange-800'
                      }`}>
                        Cloudflare Configured
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {cert.certificate_type === 'letsencrypt' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* TODO: Implement renewal */}}
                      className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCertificate(cert.domain)}
                    className={`${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* CSR Generation Modal */}
      {showCSRModal && (
        <CSRModal
          darkMode={darkMode}
          onClose={() => setShowCSRModal(false)}
          onSuccess={fetchCertificates}
          makeAuthenticatedRequest={makeAuthenticatedRequest}
        />
      )}

      {/* Certificate Upload Modal */}
      {showUploadModal && (
        <UploadModal
          darkMode={darkMode}
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchCertificates}
          makeAuthenticatedRequest={makeAuthenticatedRequest}
        />
      )}

      {/* Let's Encrypt Configuration Modal */}
      {showLetsEncryptModal && (
        <LetsEncryptModal
          darkMode={darkMode}
          onClose={() => setShowLetsEncryptModal(false)}
          onSuccess={fetchCertificates}
          makeAuthenticatedRequest={makeAuthenticatedRequest}
        />
      )}
    </div>
  );
};

// CSR Generation Modal Component
const CSRModal = ({ darkMode, onClose, onSuccess, makeAuthenticatedRequest }) => {
  const [formData, setFormData] = useState({
    domain: '',
    organization: 'ForgeBoard',
    country: 'US',
    state: 'CA',
    city: 'San Francisco',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrResult, setCsrResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await makeAuthenticatedRequest('/api/ssl/csr/generate', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setCsrResult(result);
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate CSR');
      }
    } catch (err) {
      setError('Error generating CSR');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSR = () => {
    if (!csrResult) return;
    
    const blob = new Blob([csrResult.csr_pem], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.domain}.csr`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-xl shadow-2xl ${
        darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Generate Certificate Signing Request
          </h2>
          
          {error && (
            <div className={`p-3 rounded-lg mb-4 ${
              darkMode 
                ? 'bg-red-900/20 border border-red-800 text-red-400' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {csrResult ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
              }`}>
                <p className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                  CSR Generated Successfully
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                  Domain: {formData.domain}
                </p>
              </div>
              
              <textarea
                readOnly
                value={csrResult.csr_pem}
                className={`w-full h-40 p-3 rounded-lg border font-mono text-xs ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-300' 
                    : 'bg-gray-50 border-gray-300 text-gray-700'
                }`}
              />
              
              <div className="flex space-x-3">
                <Button
                  onClick={downloadCSR}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSR
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Domain Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.domain}
                  onChange={(e) => setFormData({...formData, domain: e.target.value})}
                  placeholder="example.com"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({...formData, organization: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Country
                  </label>
                  <input
                    type="text"
                    maxLength="2"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value.toUpperCase()})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? 'Generating...' : 'Generate CSR'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Certificate Upload Modal Component
const UploadModal = ({ darkMode, onClose, onSuccess, makeAuthenticatedRequest }) => {
  const [formData, setFormData] = useState({
    domain: '',
    certificate_pem: '',
    chain_pem: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await makeAuthenticatedRequest('/api/ssl/certificates/upload', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload certificate');
      }
    } catch (err) {
      setError('Error uploading certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-xl shadow-2xl ${
        darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Upload SSL Certificate
          </h2>
          
          {error && (
            <div className={`p-3 rounded-lg mb-4 ${
              darkMode 
                ? 'bg-red-900/20 border border-red-800 text-red-400' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Domain Name *
              </label>
              <input
                type="text"
                required
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                placeholder="example.com"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Certificate (PEM Format) *
              </label>
              <textarea
                required
                value={formData.certificate_pem}
                onChange={(e) => setFormData({...formData, certificate_pem: e.target.value})}
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                className={`w-full h-32 px-3 py-2 rounded-lg border font-mono text-xs ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Certificate Chain (PEM Format, Optional)
              </label>
              <textarea
                value={formData.chain_pem}
                onChange={(e) => setFormData({...formData, chain_pem: e.target.value})}
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                className={`w-full h-24 px-3 py-2 rounded-lg border font-mono text-xs ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Uploading...' : 'Upload Certificate'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Let's Encrypt Configuration Modal Component
const LetsEncryptModal = ({ darkMode, onClose, onSuccess, makeAuthenticatedRequest }) => {
  const [formData, setFormData] = useState({
    domain: '',
    cloudflare_api_key: '',
    zone_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(false);

  const handleConfigure = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await makeAuthenticatedRequest('/api/ssl/letsencrypt/configure', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setConfigured(true);
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to configure Let\'s Encrypt');
      }
    } catch (err) {
      setError('Error configuring Let\'s Encrypt');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCertificate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await makeAuthenticatedRequest('/api/ssl/letsencrypt/request', {
        method: 'POST',
        body: JSON.stringify({ domain: formData.domain })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to request certificate');
      }
    } catch (err) {
      setError('Error requesting certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-xl shadow-2xl ${
        darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Let's Encrypt with Cloudflare
          </h2>
          
          {error && (
            <div className={`p-3 rounded-lg mb-4 ${
              darkMode 
                ? 'bg-red-900/20 border border-red-800 text-red-400' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {configured ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
              }`}>
                <p className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                  Cloudflare Configuration Successful
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                  Ready to request Let's Encrypt certificate for {formData.domain}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={handleRequestCertificate}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? 'Requesting...' : 'Request Certificate'}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfigure} className="space-y-4">
              <div>
                <label className={`flex items-center text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Domain Name *
                  <Tooltip
                    content="The domain name for which you want to generate the SSL certificate. Must be managed by Cloudflare."
                    darkMode={darkMode}
                  >
                    <HelpCircle className="w-4 h-4 ml-1 cursor-help opacity-60 hover:opacity-100" />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  required
                  value={formData.domain}
                  onChange={(e) => setFormData({...formData, domain: e.target.value})}
                  placeholder="yourdomain.com"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`flex items-center text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cloudflare API Key *
                  <Tooltip
                    content="Get this from Cloudflare Dashboard → My Profile → API Tokens. Create a custom token with Zone:DNS:Edit and Zone:Zone:Read permissions for your domain."
                    darkMode={darkMode}
                  >
                    <HelpCircle className="w-4 h-4 ml-1 cursor-help opacity-60 hover:opacity-100" />
                  </Tooltip>
                </label>
                <input
                  type="password"
                  required
                  value={formData.cloudflare_api_key}
                  onChange={(e) => setFormData({...formData, cloudflare_api_key: e.target.value})}
                  placeholder="••••••••••••••••••••••••••••••••••••••••"
                  autoComplete="off"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`flex items-center text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Zone ID (Optional)
                  <Tooltip
                    content="Found in Cloudflare Dashboard → Your Domain → Overview → Zone ID. Auto-detected if left empty, but providing it speeds up the process."
                    darkMode={darkMode}
                  >
                    <HelpCircle className="w-4 h-4 ml-1 cursor-help opacity-60 hover:opacity-100" />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  value={formData.zone_id}
                  onChange={(e) => setFormData({...formData, zone_id: e.target.value})}
                  placeholder="1234567890abcdef1234567890abcdef"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start space-x-2">
                  <div className="flex-1">
                    <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      <strong>Setup Instructions:</strong><br />
                      1. Add your domain to Cloudflare<br />
                      2. Update nameservers at your domain registrar<br />
                      3. Create API token with DNS:Edit and Zone:Read permissions<br />
                      4. Enter domain and API token here for automatic SSL
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Navigate to documentation and then to SSL config section
                      window.location.hash = 'docs';
                      setTimeout(() => {
                        const url = new URL(window.location);
                        url.searchParams.set('section', 'system-admin');
                        url.searchParams.set('content', 'ssl-config');
                        window.history.replaceState({}, '', url);
                        window.dispatchEvent(new HashChangeEvent('hashchange'));
                      }, 100);
                    }}
                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors ${
                      darkMode 
                        ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <span>Full Guide</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? 'Configuring...' : 'Configure'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SSLManagement;