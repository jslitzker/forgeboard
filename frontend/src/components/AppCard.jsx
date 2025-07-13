import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Play, Square, FileText, Globe, Cpu, Activity, Zap, Server, Package, Code } from 'lucide-react'
import { cn } from '@/lib/utils'

const AppCard = ({ app, onStart, onStop, onViewLogs, darkMode }) => {
  const isRunning = app.runtime_status?.active || false
  const status = app.runtime_status?.status || 'unknown'

  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    failed: 'bg-red-500',
    'not-found': 'bg-yellow-500',
    unknown: 'bg-gray-300',
  }

  const typeIcons = {
    flask: { 
      Icon: Server, 
      color: darkMode ? 'bg-gradient-to-br from-orange-900/20 to-orange-800/20' : 'bg-gradient-to-br from-orange-50 to-orange-100',
      iconColor: darkMode ? 'text-orange-500' : 'text-orange-600'
    },
    fastapi: { 
      Icon: Zap, 
      color: darkMode ? 'bg-gradient-to-br from-green-900/20 to-green-800/20' : 'bg-gradient-to-br from-green-50 to-green-100',
      iconColor: darkMode ? 'text-green-500' : 'text-green-600'
    },
    django: { 
      Icon: Code, 
      color: darkMode ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/20' : 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconColor: darkMode ? 'text-purple-500' : 'text-purple-600'
    },
  }

  const typeInfo = typeIcons[app.type] || { 
    Icon: Package, 
    color: darkMode ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/20' : 'bg-gradient-to-br from-blue-50 to-blue-100',
    iconColor: darkMode ? 'text-blue-500' : 'text-blue-600'
  }

  const { Icon: TypeIcon } = typeInfo

  return (
    <Card className={`card-hover shadow-sm hover:shadow-lg transition-all duration-200 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              typeInfo.color
            )}>
              <TypeIcon className={cn("h-5 w-5", typeInfo.iconColor)} />
            </div>
            <div>
              <CardTitle className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{app.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  statusColors[status] || statusColors.unknown
                )} />
                <span className={`text-xs capitalize ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{status}</span>
              </div>
            </div>
          </div>
          
          <div className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium",
            isRunning 
              ? darkMode ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-700"
              : darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
          )}>
            {isRunning ? 'Running' : 'Stopped'}
          </div>
        </div>
        
        <CardDescription className={`text-sm line-clamp-2 mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {app.description || `A ${app.type} application`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <Globe className="h-4 w-4" />
          <span className="font-medium">{app.domain}</span>
        </div>
        
        <div className={`flex items-center justify-between text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span>Port {app.port}</span>
          </div>
          <span className={`capitalize px-2 py-0.5 rounded text-xs font-medium ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-50'}`}>{app.type}</span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-2">
        {isRunning ? (
          <Button
            onClick={() => onStop(app.slug)}
            variant="outline"
            size="sm"
            className={`flex-1 ${darkMode ? 'hover:bg-red-950/20 hover:text-red-400 hover:border-red-800' : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'}`}
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button
            onClick={() => onStart(app.slug)}
            size="sm"
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm hover:shadow-md transition-all"
          >
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
        )}
        
        <Button
          onClick={() => onViewLogs(app.slug)}
          variant="outline"
          size="sm"
          className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
        >
          <FileText className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default AppCard