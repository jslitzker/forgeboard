import React, { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

const SearchFilter = ({ 
  darkMode, 
  onSearchChange, 
  onFilterChange,
  onGroupByChange,
  appTypes = ['flask', 'fastapi', 'django'],
  totalApps = 0,
  filteredApps = 0,
  groupBy = 'none'
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('all')

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearchChange(value)
  }

  const handleTypeToggle = (type) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]
    
    setSelectedTypes(newTypes)
    onFilterChange({ types: newTypes, status: selectedStatus })
  }

  const handleStatusChange = (status) => {
    setSelectedStatus(status)
    onFilterChange({ types: selectedTypes, status })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTypes([])
    setSelectedStatus('all')
    onSearchChange('')
    onFilterChange({ types: [], status: 'all' })
  }

  const hasActiveFilters = searchTerm || selectedTypes.length > 0 || selectedStatus !== 'all'

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className={cn(
          "flex-1 relative",
          darkMode ? 'text-gray-100' : 'text-gray-900'
        )}>
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
            darkMode ? 'text-gray-400' : 'text-gray-500'
          )} />
          <input
            type="text"
            placeholder="Search apps by name or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={cn(
              "w-full pl-10 pr-10 py-2 rounded-lg border transition-colors",
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500',
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('')
                onSearchChange('')
              }}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors",
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              )}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "gap-2",
            showFilters && (darkMode ? 'bg-gray-800' : 'bg-gray-100'),
            darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {(selectedTypes.length > 0 || selectedStatus !== 'all') && (
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium",
              darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
            )}>
              {selectedTypes.length + (selectedStatus !== 'all' ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className={cn(
          "p-4 rounded-lg border space-y-4",
          darkMode 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        )}>
          {/* Status Filter */}
          <div>
            <label className={cn(
              "text-sm font-medium mb-2 block",
              darkMode ? 'text-gray-300' : 'text-gray-700'
            )}>
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'running', 'stopped'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                    selectedStatus === status ? (
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
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className={cn(
              "text-sm font-medium mb-2 block",
              darkMode ? 'text-gray-300' : 'text-gray-700'
            )}>
              App Type
            </label>
            <div className="flex flex-wrap gap-2">
              {appTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                    selectedTypes.includes(type) ? (
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
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Group By */}
          <div>
            <label className={cn(
              "text-sm font-medium mb-2 block",
              darkMode ? 'text-gray-300' : 'text-gray-700'
            )}>
              Group By
            </label>
            <div className="flex flex-wrap gap-2">
              {['none', 'type', 'status'].map((option) => (
                <button
                  key={option}
                  onClick={() => onGroupByChange && onGroupByChange(option)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                    groupBy === option ? (
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
                  {option === 'none' ? 'No Grouping' : `By ${option}`}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2">
              <span className={cn(
                "text-sm",
                darkMode ? 'text-gray-400' : 'text-gray-500'
              )}>
                Showing {filteredApps} of {totalApps} apps
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className={cn(
                  "gap-1",
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                )}
              >
                <X className="h-3 w-3" />
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchFilter