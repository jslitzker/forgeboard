import React, { useState } from 'react'
import { 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Shield,
  Server,
  Code,
  Save,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

const Settings = ({ darkMode, setDarkMode: setGlobalDarkMode }) => {
  // Settings state
  const [settings, setSettings] = useState({
    theme: darkMode ? 'dark' : 'light',
    autoRefreshApps: true,
    autoRefreshInterval: 30,
    notifications: {
      appCrash: true,
      appStart: false,
      appStop: false,
      systemAlerts: true
    },
    defaults: {
      appType: 'flask',
      autoStart: false,
      logRetention: 7
    },
    api: {
      timeout: 30,
      retries: 3
    }
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In a real app, this would save to an API
    localStorage.setItem('forgeboard_settings', JSON.stringify(settings))
    
    // Apply theme change
    if (settings.theme !== (darkMode ? 'dark' : 'light')) {
      setGlobalDarkMode(settings.theme === 'dark')
    }
    
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    const defaultSettings = {
      theme: 'light',
      autoRefreshApps: true,
      autoRefreshInterval: 30,
      notifications: {
        appCrash: true,
        appStart: false,
        appStop: false,
        systemAlerts: true
      },
      defaults: {
        appType: 'flask',
        autoStart: false,
        logRetention: 7
      },
      api: {
        timeout: 30,
        retries: 3
      }
    }
    setSettings(defaultSettings)
  }

  const SettingSection = ({ title, description, children }) => (
    <div className={cn(
      "rounded-lg p-6 border",
      darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    )}>
      <h2 className={cn(
        "text-lg font-semibold mb-1",
        darkMode ? 'text-gray-100' : 'text-gray-900'
      )}>
        {title}
      </h2>
      {description && (
        <p className={cn(
          "text-sm mb-4",
          darkMode ? 'text-gray-400' : 'text-gray-600'
        )}>
          {description}
        </p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )

  const ToggleSwitch = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between cursor-pointer">
      <span className={cn(
        "text-sm",
        darkMode ? 'text-gray-300' : 'text-gray-700'
      )}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked 
            ? 'bg-blue-600' 
            : darkMode ? 'bg-gray-700' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </label>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn(
            "text-3xl font-bold",
            darkMode ? 'text-gray-100' : 'text-gray-900'
          )}>
            Settings
          </h1>
          <p className={cn(
            "text-sm mt-1",
            darkMode ? 'text-gray-400' : 'text-gray-600'
          )}>
            Configure your ForgeBoard preferences
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-400">
            Settings saved successfully!
          </p>
        </div>
      )}

      {/* Appearance */}
      <SettingSection
        title="Appearance"
        description="Customize the look and feel of ForgeBoard"
      >
        <div>
          <label className={cn(
            "text-sm font-medium mb-2 block",
            darkMode ? 'text-gray-300' : 'text-gray-700'
          )}>
            Theme
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setSettings(s => ({ ...s, theme: 'light' }))}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                settings.theme === 'light' ? (
                  darkMode
                    ? 'bg-blue-900/30 text-blue-400 border-blue-800/50'
                    : 'bg-blue-100 text-blue-600 border-blue-200'
                ) : (
                  darkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                )
              )}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => setSettings(s => ({ ...s, theme: 'dark' }))}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                settings.theme === 'dark' ? (
                  darkMode
                    ? 'bg-blue-900/30 text-blue-400 border-blue-800/50'
                    : 'bg-blue-100 text-blue-600 border-blue-200'
                ) : (
                  darkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                )
              )}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
          </div>
        </div>
      </SettingSection>

      {/* General Settings */}
      <SettingSection
        title="General"
        description="General application preferences"
      >
        <ToggleSwitch
          checked={settings.autoRefreshApps}
          onChange={(checked) => setSettings(s => ({ ...s, autoRefreshApps: checked }))}
          label="Auto-refresh app status"
        />
        
        {settings.autoRefreshApps && (
          <div>
            <label className={cn(
              "text-sm font-medium mb-2 block",
              darkMode ? 'text-gray-300' : 'text-gray-700'
            )}>
              Refresh interval (seconds)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={settings.autoRefreshInterval}
              onChange={(e) => setSettings(s => ({ 
                ...s, 
                autoRefreshInterval: parseInt(e.target.value) || 30 
              }))}
              className={cn(
                "w-32 px-3 py-2 rounded-lg border transition-colors",
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900',
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              )}
            />
          </div>
        )}
      </SettingSection>

      {/* Notifications */}
      <SettingSection
        title="Notifications"
        description="Configure when to receive notifications"
      >
        <ToggleSwitch
          checked={settings.notifications.appCrash}
          onChange={(checked) => setSettings(s => ({ 
            ...s, 
            notifications: { ...s.notifications, appCrash: checked }
          }))}
          label="App crash notifications"
        />
        <ToggleSwitch
          checked={settings.notifications.appStart}
          onChange={(checked) => setSettings(s => ({ 
            ...s, 
            notifications: { ...s.notifications, appStart: checked }
          }))}
          label="App start notifications"
        />
        <ToggleSwitch
          checked={settings.notifications.appStop}
          onChange={(checked) => setSettings(s => ({ 
            ...s, 
            notifications: { ...s.notifications, appStop: checked }
          }))}
          label="App stop notifications"
        />
        <ToggleSwitch
          checked={settings.notifications.systemAlerts}
          onChange={(checked) => setSettings(s => ({ 
            ...s, 
            notifications: { ...s.notifications, systemAlerts: checked }
          }))}
          label="System alert notifications"
        />
      </SettingSection>

      {/* Default App Settings */}
      <SettingSection
        title="Default App Settings"
        description="Default settings for new applications"
      >
        <div>
          <label className={cn(
            "text-sm font-medium mb-2 block",
            darkMode ? 'text-gray-300' : 'text-gray-700'
          )}>
            Default app type
          </label>
          <select
            value={settings.defaults.appType}
            onChange={(e) => setSettings(s => ({ 
              ...s, 
              defaults: { ...s.defaults, appType: e.target.value }
            }))}
            className={cn(
              "w-full px-3 py-2 rounded-lg border transition-colors",
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900',
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          >
            <option value="flask">Flask</option>
            <option value="fastapi">FastAPI</option>
            <option value="django">Django</option>
          </select>
        </div>
        
        <ToggleSwitch
          checked={settings.defaults.autoStart}
          onChange={(checked) => setSettings(s => ({ 
            ...s, 
            defaults: { ...s.defaults, autoStart: checked }
          }))}
          label="Auto-start apps after creation"
        />
        
        <div>
          <label className={cn(
            "text-sm font-medium mb-2 block",
            darkMode ? 'text-gray-300' : 'text-gray-700'
          )}>
            Log retention (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={settings.defaults.logRetention}
            onChange={(e) => setSettings(s => ({ 
              ...s, 
              defaults: { ...s.defaults, logRetention: parseInt(e.target.value) || 7 }
            }))}
            className={cn(
              "w-32 px-3 py-2 rounded-lg border transition-colors",
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900',
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
      </SettingSection>

      {/* API Settings */}
      <SettingSection
        title="API Configuration"
        description="Configure API behavior and limits"
      >
        <div>
          <label className={cn(
            "text-sm font-medium mb-2 block",
            darkMode ? 'text-gray-300' : 'text-gray-700'
          )}>
            Request timeout (seconds)
          </label>
          <input
            type="number"
            min="5"
            max="300"
            value={settings.api.timeout}
            onChange={(e) => setSettings(s => ({ 
              ...s, 
              api: { ...s.api, timeout: parseInt(e.target.value) || 30 }
            }))}
            className={cn(
              "w-32 px-3 py-2 rounded-lg border transition-colors",
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900',
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
        
        <div>
          <label className={cn(
            "text-sm font-medium mb-2 block",
            darkMode ? 'text-gray-300' : 'text-gray-700'
          )}>
            Max retries on failure
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={settings.api.retries}
            onChange={(e) => setSettings(s => ({ 
              ...s, 
              api: { ...s.api, retries: parseInt(e.target.value) || 3 }
            }))}
            className={cn(
              "w-32 px-3 py-2 rounded-lg border transition-colors",
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900',
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
      </SettingSection>
    </div>
  )
}

export default Settings