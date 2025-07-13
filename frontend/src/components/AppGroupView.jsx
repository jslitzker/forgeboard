import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import AppCard from './AppCard'
import { cn } from '@/lib/utils'

const AppGroupView = ({ 
  apps, 
  groupBy = 'type', // 'type', 'status', or 'none'
  darkMode,
  onStart,
  onStop,
  onViewLogs 
}) => {
  const [collapsedGroups, setCollapsedGroups] = React.useState(new Set())

  const toggleGroup = (groupName) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName)
    } else {
      newCollapsed.add(groupName)
    }
    setCollapsedGroups(newCollapsed)
  }

  // Group apps based on the selected criteria
  const groupedApps = React.useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Apps': apps }
    }

    const groups = {}
    
    apps.forEach(app => {
      let groupKey
      
      if (groupBy === 'type') {
        groupKey = app.type.charAt(0).toUpperCase() + app.type.slice(1)
      } else if (groupBy === 'status') {
        groupKey = app.runtime_status?.active ? 'Running' : 'Stopped'
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(app)
    })
    
    return groups
  }, [apps, groupBy])

  const getGroupColor = (groupName) => {
    const colors = {
      // Type colors
      'Flask': { bg: 'from-orange-50 to-orange-100', darkBg: 'from-orange-900/20 to-orange-800/20', text: 'text-orange-600', darkText: 'text-orange-500' },
      'Fastapi': { bg: 'from-green-50 to-green-100', darkBg: 'from-green-900/20 to-green-800/20', text: 'text-green-600', darkText: 'text-green-500' },
      'Django': { bg: 'from-purple-50 to-purple-100', darkBg: 'from-purple-900/20 to-purple-800/20', text: 'text-purple-600', darkText: 'text-purple-500' },
      // Status colors
      'Running': { bg: 'from-green-50 to-green-100', darkBg: 'from-green-900/20 to-green-800/20', text: 'text-green-600', darkText: 'text-green-500' },
      'Stopped': { bg: 'from-gray-50 to-gray-100', darkBg: 'from-gray-800 to-gray-700', text: 'text-gray-600', darkText: 'text-gray-400' },
      // Default
      'All Apps': { bg: 'from-blue-50 to-blue-100', darkBg: 'from-blue-900/20 to-blue-800/20', text: 'text-blue-600', darkText: 'text-blue-500' }
    }
    
    return colors[groupName] || colors['All Apps']
  }

  if (groupBy === 'none') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <AppCard
            key={app.slug}
            app={app}
            onStart={onStart}
            onStop={onStop}
            onViewLogs={onViewLogs}
            darkMode={darkMode}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedApps).map(([groupName, groupApps]) => {
        const isCollapsed = collapsedGroups.has(groupName)
        const groupColor = getGroupColor(groupName)
        
        return (
          <div key={groupName} className="space-y-4">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(groupName)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-lg transition-colors",
                darkMode 
                  ? `bg-gradient-to-r ${groupColor.darkBg} border border-gray-800 hover:border-gray-700`
                  : `bg-gradient-to-r ${groupColor.bg} border border-gray-200 hover:border-gray-300`
              )}
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? (
                  <ChevronRight className={cn("h-5 w-5", darkMode ? groupColor.darkText : groupColor.text)} />
                ) : (
                  <ChevronDown className={cn("h-5 w-5", darkMode ? groupColor.darkText : groupColor.text)} />
                )}
                <h3 className={cn(
                  "text-lg font-semibold",
                  darkMode ? groupColor.darkText : groupColor.text
                )}>
                  {groupName}
                </h3>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  darkMode 
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-white text-gray-600'
                )}>
                  {groupApps.length} app{groupApps.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={cn(
                  "text-sm",
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {groupBy === 'status' && groupName === 'Running' && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                      Active
                    </span>
                  )}
                </div>
              </div>
            </button>
            
            {/* Group Apps */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-4">
                {groupApps.map((app) => (
                  <AppCard
                    key={app.slug}
                    app={app}
                    onStart={onStart}
                    onStop={onStop}
                    onViewLogs={onViewLogs}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default AppGroupView