import React from 'react'
import { 
  Zap, 
  Activity, 
  Server, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

const Dashboard = ({ apps, darkMode, onNavigateToApps, onCreateApp }) => {
  // Calculate statistics
  const totalApps = apps.length
  const runningApps = apps.filter(app => app.runtime_status?.active).length
  const stoppedApps = totalApps - runningApps
  
  // Group apps by type
  const appsByType = apps.reduce((acc, app) => {
    acc[app.type] = (acc[app.type] || 0) + 1
    return acc
  }, {})
  
  // Recent activity (mock data for now - could be enhanced with real timestamps)
  const recentActivity = apps
    .filter(app => app.runtime_status?.active)
    .slice(0, 5)
    .map(app => ({
      id: app.slug,
      name: app.name,
      status: 'started',
      time: 'Recently'
    }))

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className={cn(
      "rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow",
      darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium",
            darkMode ? 'text-gray-400' : 'text-gray-600'
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-1 flex items-center gap-1",
              trend > 0 ? 'text-green-600' : 'text-gray-500'
            )}>
              <TrendingUp className="h-3 w-3" />
              {trend > 0 ? `+${trend}` : trend} this week
            </p>
          )}
        </div>
        <div className={cn(
          "h-12 w-12 rounded-lg flex items-center justify-center",
          `bg-gradient-to-br ${color}`
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-3xl font-bold",
          darkMode ? 'text-gray-100' : 'text-gray-900'
        )}>
          Dashboard
        </h1>
        <p className={cn(
          "text-sm mt-1",
          darkMode ? 'text-gray-400' : 'text-gray-600'
        )}>
          System overview and recent activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Apps"
          value={totalApps}
          icon={Package}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Running"
          value={runningApps}
          icon={Activity}
          color="from-green-500 to-green-600"
          trend={2}
        />
        <StatCard
          title="Stopped"
          value={stoppedApps}
          icon={Server}
          color="from-gray-500 to-gray-600"
        />
        <StatCard
          title="System Health"
          value="100%"
          icon={CheckCircle}
          color="from-emerald-500 to-emerald-600"
        />
      </div>

      {/* Quick Actions */}
      <div className={cn(
        "rounded-lg p-6 border",
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <h2 className={cn(
          "text-lg font-semibold mb-4",
          darkMode ? 'text-gray-100' : 'text-gray-900'
        )}>
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={onCreateApp}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Deploy New App
          </Button>
          <Button 
            variant="outline"
            onClick={onNavigateToApps}
            className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
          >
            <Package className="h-4 w-4 mr-2" />
            View All Apps
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Distribution */}
        <div className={cn(
          "rounded-lg p-6 border",
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}>
          <h2 className={cn(
            "text-lg font-semibold mb-4",
            darkMode ? 'text-gray-100' : 'text-gray-900'
          )}>
            Apps by Type
          </h2>
          <div className="space-y-3">
            {Object.entries(appsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    type === 'flask' && "bg-orange-100 dark:bg-orange-900/20",
                    type === 'fastapi' && "bg-green-100 dark:bg-green-900/20",
                    type === 'django' && "bg-purple-100 dark:bg-purple-900/20"
                  )}>
                    <Package className={cn(
                      "h-4 w-4",
                      type === 'flask' && "text-orange-600 dark:text-orange-500",
                      type === 'fastapi' && "text-green-600 dark:text-green-500",
                      type === 'django' && "text-purple-600 dark:text-purple-500"
                    )} />
                  </div>
                  <span className={cn(
                    "font-medium capitalize",
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  )}>
                    {type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-2xl font-semibold",
                    darkMode ? 'text-gray-100' : 'text-gray-900'
                  )}>
                    {count}
                  </span>
                  <span className={cn(
                    "text-sm",
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    apps
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={cn(
          "rounded-lg p-6 border",
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}>
          <h2 className={cn(
            "text-lg font-semibold mb-4",
            darkMode ? 'text-gray-100' : 'text-gray-900'
          )}>
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      "bg-green-100 dark:bg-green-900/20"
                    )}>
                      <Activity className="h-4 w-4 text-green-600 dark:text-green-500" />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        darkMode ? 'text-gray-200' : 'text-gray-700'
                      )}>
                        {activity.name}
                      </p>
                      <p className={cn(
                        "text-xs",
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      )}>
                        App {activity.status}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs",
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={cn(
              "text-center py-8",
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className={cn(
        "rounded-lg p-6 border",
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <h2 className={cn(
          "text-lg font-semibold mb-4",
          darkMode ? 'text-gray-100' : 'text-gray-900'
        )}>
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className={cn(
                "text-sm font-medium",
                darkMode ? 'text-gray-200' : 'text-gray-700'
              )}>
                API Service
              </p>
              <p className={cn(
                "text-xs",
                darkMode ? 'text-gray-500' : 'text-gray-400'
              )}>
                Operational
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className={cn(
                "text-sm font-medium",
                darkMode ? 'text-gray-200' : 'text-gray-700'
              )}>
                NGINX Proxy
              </p>
              <p className={cn(
                "text-xs",
                darkMode ? 'text-gray-500' : 'text-gray-400'
              )}>
                Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className={cn(
                "text-sm font-medium",
                darkMode ? 'text-gray-200' : 'text-gray-700'
              )}>
                System Health
              </p>
              <p className={cn(
                "text-xs",
                darkMode ? 'text-gray-500' : 'text-gray-400'
              )}>
                All systems normal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard