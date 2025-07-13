import React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const Breadcrumb = ({ darkMode, items = [] }) => {
  // Always include home as the first item
  const breadcrumbItems = [
    { label: 'Home', href: '#', icon: Home },
    ...items
  ]

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          const Icon = item.icon

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className={cn(
                  "h-4 w-4 mx-2 flex-shrink-0",
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                )} />
              )}
              
              {isLast ? (
                <span className={cn(
                  "text-sm font-medium flex items-center gap-1",
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href || '#'}
                  className={cn(
                    "text-sm flex items-center gap-1 hover:underline",
                    darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb