import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  RefreshCw, 
  Download, 
  Search,
  Filter,
  Calendar,
  X,
  AlertCircle,
  Info,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

const LogsView = ({ apps, darkMode }) => {
  const [selectedApp, setSelectedApp] = useState('all')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [logLevel, setLogLevel] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Mock log data - in a real app, this would come from the API
  const mockLogs = [
    { id: 1, app: 'flask-app', level: 'info', message: 'Application started successfully', timestamp: new Date().toISOString() },
    { id: 2, app: 'fastapi-app', level: 'warning', message: 'Deprecated API endpoint accessed', timestamp: new Date().toISOString() },
    { id: 3, app: 'django-app', level: 'error', message: 'Database connection timeout', timestamp: new Date().toISOString() },
    { id: 4, app: 'flask-app', level: 'info', message: 'Request processed: GET /api/users', timestamp: new Date().toISOString() },
    { id: 5, app: 'fastapi-app', level: 'info', message: 'New user registered', timestamp: new Date().toISOString() },
  ]

  const fetchLogs = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLogs(mockLogs)
      setLoading(false)
    }, 500)
  }

  useEffect(() => {
    fetchLogs()
  }, [selectedApp])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const filteredLogs = logs.filter(log => {
    const matchesApp = selectedApp === 'all' || log.app === selectedApp
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = logLevel === 'all' || log.level === logLevel
    return matchesApp && matchesSearch && matchesLevel
  })

  const handleDownload = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.app}] ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString()}.log`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const getLogLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return darkMode ? 'text-red-400' : 'text-red-600'
      case 'warning':
        return darkMode ? 'text-yellow-400' : 'text-yellow-600'
      case 'info':
      default:
        return darkMode ? 'text-blue-400' : 'text-blue-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-3xl font-bold",
          darkMode ? 'text-gray-100' : 'text-gray-900'
        )}>
          Application Logs
        </h1>
        <p className={cn(
          "text-sm mt-1",
          darkMode ? 'text-gray-400' : 'text-gray-600'
        )}>
          View and search logs from all your applications
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {/* App Filter */}
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className={cn(
              "px-4 py-2 rounded-lg border transition-colors",
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900',
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          >
            <option value="all">All Applications</option>
            {apps.map(app => (
              <option key={app.slug} value={app.slug}>{app.name}</option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
              darkMode ? 'text-gray-400' : 'text-gray-500'
            )} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-10 pr-10 py-2 rounded-lg border transition-colors",
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              )}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors",
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
              showFilters && (darkMode ? 'bg-gray-800' : 'bg-gray-100')
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
            className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={handleDownload}
            className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={!autoRefresh && (darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100')}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className={cn(
            "p-4 rounded-lg border",
            darkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          )}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Log Level Filter */}
              <div>
                <label className={cn(
                  "text-sm font-medium mb-2 block",
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Log Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'info', 'warning', 'error'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setLogLevel(level)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                        logLevel === level ? (
                          darkMode
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                            : 'bg-blue-100 text-blue-600 border border-blue-200'
                        ) : (
                          darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                        )
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range (placeholder) */}
              <div>
                <label className={cn(
                  "text-sm font-medium mb-2 block",
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Date Range
                </label>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Last 24 hours
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logs Display */}
      <div className={cn(
        "rounded-lg border overflow-hidden",
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}>
        {/* Logs Header */}
        <div className={cn(
          "px-6 py-3 border-b grid grid-cols-12 gap-4 text-sm font-medium",
          darkMode 
            ? 'bg-gray-800/50 border-gray-700 text-gray-300' 
            : 'bg-gray-50 border-gray-200 text-gray-700'
        )}>
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-1">Level</div>
          <div className="col-span-2">Application</div>
          <div className="col-span-7">Message</div>
        </div>

        {/* Logs Content */}
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className={cn(
                "mt-2 text-sm",
                darkMode ? 'text-gray-500' : 'text-gray-400'
              )}>
                Loading logs...
              </p>
            </div>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "px-6 py-3 grid grid-cols-12 gap-4 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50",
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                )}
              >
                <div className="col-span-2 text-xs font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="col-span-1 flex items-center gap-1">
                  {getLogLevelIcon(log.level)}
                  <span className={cn("text-xs font-medium uppercase", getLogLevelColor(log.level))}>
                    {log.level}
                  </span>
                </div>
                <div className="col-span-2 text-sm font-medium">
                  {log.app}
                </div>
                <div className="col-span-7 text-sm">
                  {log.message}
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700" />
              <p className={cn(
                "mt-2 text-sm",
                darkMode ? 'text-gray-500' : 'text-gray-400'
              )}>
                No logs found matching your filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LogsView