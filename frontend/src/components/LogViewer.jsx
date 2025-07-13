import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { X, RefreshCw, Download } from 'lucide-react'

const LogViewer = ({ app, onClose }) => {
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(true)
  const [lines, setLines] = useState(100)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/apps/${app.slug}/logs?lines=${lines}`)
      const data = await response.json()
      if (response.ok) {
        setLogs(data.logs || 'No logs available')
      } else {
        setLogs(`Error fetching logs: ${data.error}`)
      }
    } catch (error) {
      setLogs(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [app.slug, lines])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, app.slug, lines])

  const handleDownload = () => {
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${app.slug}-logs-${new Date().toISOString()}.log`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col glass dark:glass-dark border border-gray-200/20 dark:border-gray-700/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Application Logs</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{app.name}</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <select
                value={lines}
                onChange={(e) => setLines(Number(e.target.value))}
                className="px-3 py-1 rounded-md border bg-background"
              >
                <option value={50}>Last 50 lines</option>
                <option value={100}>Last 100 lines</option>
                <option value={200}>Last 200 lines</option>
                <option value={500}>Last 500 lines</option>
              </select>
              
              <Button
                onClick={fetchLogs}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-refresh</span>
              </label>
            </div>
            
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto bg-gray-900 dark:bg-gray-950 rounded-lg p-4">
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
              {loading ? 'Loading logs...' : logs}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LogViewer