import React from 'react'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Settings, 
  Book,
  ChevronLeft,
  Menu
} from 'lucide-react'
import { Button } from './ui/button'

const Sidebar = ({ darkMode, collapsed, setCollapsed, activeItem = 'dashboard', onNavigate }) => {
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      href: '#dashboard'
    },
    { 
      id: 'apps', 
      label: 'Apps', 
      icon: Package,
      href: '#apps'
    },
    { 
      id: 'logs', 
      label: 'Logs', 
      icon: FileText,
      href: '#logs'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      href: '#settings'
    },
    { 
      id: 'docs', 
      label: 'Documentation', 
      icon: Book,
      href: '#docs'
    }
  ]

  return (
    <aside className={cn(
      "h-screen sticky top-0 border-r transition-all duration-300",
      darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className={cn(
          "flex items-center justify-between h-20 px-4 border-b",
          darkMode ? 'border-gray-800' : 'border-gray-200'
        )}>
          {!collapsed && (
            <h2 className={cn(
              "font-semibold text-lg",
              darkMode ? 'text-gray-100' : 'text-gray-900'
            )}>
              Navigation
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
          >
            {collapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate && onNavigate(item.id)}
                className={cn(
                  "w-full text-left",
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive ? (
                    darkMode 
                      ? 'bg-blue-900/20 text-blue-400 border border-blue-800/50' 
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  ) : (
                    darkMode
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  ),
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive && !darkMode && 'text-blue-600',
                  isActive && darkMode && 'text-blue-400'
                )} />
                {!collapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={cn(
          "p-4 border-t",
          darkMode ? 'border-gray-800' : 'border-gray-200'
        )}>
          {!collapsed && (
            <div className={cn(
              "text-xs",
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              ForgeBoard v0.1.0
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar