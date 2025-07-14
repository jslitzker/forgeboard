import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppCard from './components/AppCard'
import AppGroupView from './components/AppGroupView'
import LogViewer from './components/LogViewer'
import AppCreationWizard from './components/AppCreationWizard'
import Sidebar from './components/Sidebar'
import SearchFilter from './components/SearchFilter'
import Breadcrumb from './components/Breadcrumb'
import Dashboard from './components/Dashboard'
import LogsView from './components/LogsView'
import SettingsWithAuth from './components/SettingsWithAuth'
import Documentation from './components/Documentation'
import AuthModal from './components/auth/AuthModal'
import UserMenu from './components/auth/UserMenu'
import { Moon, Sun, RefreshCw, Plus, Sparkles, Zap, Activity, Square, Package, Search, LayoutDashboard, FileText, Settings as SettingsIcon, Book, LogIn } from 'lucide-react'
import { Button } from './components/ui/button'

const AuthSection = ({ darkMode, onShowAuthModal }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
    );
  }

  if (isAuthenticated()) {
    return <UserMenu darkMode={darkMode} />;
  }

  return (
    <Button
      onClick={onShowAuthModal}
      variant="outline"
      size="sm"
      className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
    >
      <LogIn className="h-4 w-4 mr-2" />
      Sign In
    </Button>
  );
};

function AppContent() {
  const [apps, setApps] = useState([])
  const [filteredApps, setFilteredApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedApp, setSelectedApp] = useState(null)
  const [showLogs, setShowLogs] = useState(false)
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.substring(1)
    return hash && ['dashboard', 'apps', 'logs', 'settings', 'docs'].includes(hash) ? hash : 'dashboard'
  })
  const [groupBy, setGroupBy] = useState('none')
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const fetchApps = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/apps')
      if (!response.ok) {
        throw new Error('Failed to fetch apps')
      }
      const data = await response.json()
      setApps(data.apps)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
  }, [])

  useEffect(() => {
    setFilteredApps(apps)
  }, [apps])

  const handleSearchChange = (searchTerm) => {
    const filtered = apps.filter(app => 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredApps(filtered)
  }

  const handleFilterChange = ({ types, status }) => {
    let filtered = [...apps]
    
    if (types.length > 0) {
      filtered = filtered.filter(app => types.includes(app.type))
    }
    
    if (status !== 'all') {
      filtered = filtered.filter(app => {
        const isRunning = app.runtime_status?.active || false
        return status === 'running' ? isRunning : !isRunning
      })
    }
    
    setFilteredApps(filtered)
  }

  const handleStart = async (slug) => {
    try {
      const response = await fetch(`/api/apps/${slug}/start`, {
        method: 'POST',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start app')
      }
      await fetchApps()
    } catch (err) {
      alert(`Error starting app: ${err.message}`)
    }
  }

  const handleStop = async (slug) => {
    try {
      const response = await fetch(`/api/apps/${slug}/stop`, {
        method: 'POST',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to stop app')
      }
      await fetchApps()
    } catch (err) {
      alert(`Error stopping app: ${err.message}`)
    }
  }

  const handleViewLogs = (slug) => {
    const app = apps.find(a => a.slug === slug)
    if (app) {
      setSelectedApp(app)
      setShowLogs(true)
    }
  }

  const handleNavigate = (section) => {
    setActiveSection(section)
    // Update URL hash for bookmarkability
    window.location.hash = section
  }

  // Get breadcrumb items based on active section
  const getBreadcrumbItems = () => {
    const breadcrumbMap = {
      dashboard: [{ label: 'Dashboard', href: '#dashboard', icon: LayoutDashboard }],
      apps: [{ label: 'Apps', href: '#apps', icon: Package }],
      logs: [{ label: 'Logs', href: '#logs', icon: FileText }],
      settings: [{ label: 'Settings', href: '#settings', icon: SettingsIcon }],
      docs: [{ label: 'Documentation', href: '#docs', icon: Book }]
    }
    return breadcrumbMap[activeSection] || []
  }

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      if (hash && ['dashboard', 'apps', 'logs', 'settings', 'docs'].includes(hash)) {
        setActiveSection(hash)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeItem={activeSection}
        onNavigate={handleNavigate}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

      {/* Header */}
      <header className={`border-b ${darkMode ? 'border-gray-800 bg-gradient-to-r from-gray-950 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-white to-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <img 
                src={darkMode ? '/src/assets/images/forgeboard_logo_dark.png' : '/src/assets/images/forgeboard_logo.png'}
                alt="ForgeBoard Logo"
                className="h-16 w-16 object-contain"
              />
              <div>
                <h1 className={`text-2xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  ForgeBoard
                </h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  App deployment dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={fetchApps}
                variant="outline"
                size="icon"
                disabled={loading}
                className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                onClick={() => setDarkMode(!darkMode)}
                variant="outline"
                size="icon"
                className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              
              <AuthSection darkMode={darkMode} onShowAuthModal={() => setShowAuthModal(true)} />
            </div>
          </div>
        </div>
      </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <Breadcrumb 
              darkMode={darkMode}
              items={getBreadcrumbItems()}
            />
            
            {/* Conditional Content Rendering */}
            {activeSection === 'dashboard' && (
              <Dashboard 
                apps={apps}
                darkMode={darkMode}
                onNavigateToApps={() => handleNavigate('apps')}
                onCreateApp={() => setShowCreateWizard(true)}
              />
            )}
            
            {activeSection === 'apps' && (
              <>
                {/* Page Title and Actions */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      Applications
                    </h1>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Manage your deployed applications
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowCreateWizard(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New App
                  </Button>
                </div>
                
                {/* Search and Filter */}
                <SearchFilter 
                  darkMode={darkMode}
                  onSearchChange={handleSearchChange}
                  onFilterChange={handleFilterChange}
                  onGroupByChange={setGroupBy}
                  appTypes={['flask', 'fastapi', 'django']}
                  totalApps={apps.length}
                  filteredApps={filteredApps.length}
                  groupBy={groupBy}
                />
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Apps</p>
                <p className="text-2xl font-semibold mt-1">{apps.length}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/20' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}>
                <Zap className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>
          
          <div className={`rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Running</p>
                <p className="text-2xl font-semibold mt-1 text-green-600 dark:text-green-500">
                  {apps.filter(app => app.runtime_status?.active).length}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-green-900/20 to-green-800/20' : 'bg-gradient-to-br from-green-50 to-green-100'}`}>
                <Activity className={`h-5 w-5 ${darkMode ? 'text-green-500' : 'text-green-600'}`} />
              </div>
            </div>
          </div>
          
          <div className={`rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stopped</p>
                <p className="text-2xl font-semibold mt-1">
                  {apps.filter(app => !app.runtime_status?.active).length}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                <Square className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-6 p-4 border rounded-lg ${darkMode ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Error: {error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        )}

        {!loading && !error && apps.length === 0 && (
          <div className="text-center py-12">
            <div className={`inline-flex items-center justify-center h-16 w-16 rounded-lg mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No apps found</p>
            <Button 
              onClick={() => setShowCreateWizard(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First App
            </Button>
          </div>
        )}

                {!loading && !error && filteredApps.length > 0 && (
                  <AppGroupView
                    apps={filteredApps}
                    groupBy={groupBy}
                    darkMode={darkMode}
                    onStart={handleStart}
                    onStop={handleStop}
                    onViewLogs={handleViewLogs}
                  />
                )}
                
                {!loading && !error && apps.length > 0 && filteredApps.length === 0 && (
                  <div className="text-center py-12">
                    <div className={`inline-flex items-center justify-center h-16 w-16 rounded-lg mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      No apps found
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Try adjusting your search or filters
                    </p>
                  </div>
                )}
              </>
            )}
            
            {activeSection === 'logs' && (
              <LogsView 
                apps={apps}
                darkMode={darkMode}
              />
            )}
            
            {activeSection === 'settings' && (
              <SettingsWithAuth 
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            )}
            
            {activeSection === 'docs' && (
              <Documentation 
                darkMode={darkMode}
              />
            )}
          </div>
        </main>
      </div>
      
      {showLogs && selectedApp && (
        <LogViewer
          app={selectedApp}
          onClose={() => {
            setShowLogs(false)
            setSelectedApp(null)
          }}
        />
      )}
      
      {showCreateWizard && (
        <AppCreationWizard
          onClose={() => setShowCreateWizard(false)}
          onSuccess={(data) => {
            fetchApps()
            alert(`App "${data.app.name}" created successfully!`)
          }}
        />
      )}
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        darkMode={darkMode}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App