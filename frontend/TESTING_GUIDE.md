# ForgeBoard Navigation Testing Guide

## Testing URL
Open your browser to: http://localhost:5174/

## Navigation Sections to Test

### 1. Dashboard (http://localhost:5174/#dashboard)
- ✅ Should show total apps, running, and stopped counts
- ✅ Quick actions section with "Deploy New App" and "View All Apps" buttons
- ✅ Apps by type distribution
- ✅ Recent activity (if apps are running)
- ✅ System status indicators

### 2. Apps (http://localhost:5174/#apps)
- ✅ Search bar with clear button
- ✅ Filter options (by status and type)
- ✅ Group by options (none, type, status)
- ✅ App cards with start/stop/logs buttons
- ✅ "New App" button in header
- ✅ Empty state with "Create Your First App" if no apps

### 3. Logs (http://localhost:5174/#logs)
- ✅ Application dropdown filter
- ✅ Search logs functionality
- ✅ Log level filter (all, info, warning, error)
- ✅ Refresh and auto-refresh toggle
- ✅ Export logs button
- ✅ Log entries table with timestamps

### 4. Settings (http://localhost:5174/#settings)
- ✅ Theme selection (light/dark)
- ✅ Auto-refresh settings
- ✅ Notification preferences
- ✅ Default app settings
- ✅ API configuration
- ✅ Save and Reset buttons

### 5. Documentation (http://localhost:5174/#docs)
- ✅ Searchable sidebar navigation
- ✅ Multiple documentation sections
- ✅ Code examples with syntax highlighting
- ✅ External resource links
- ✅ Previous/Next navigation

## Common Features to Test

### Sidebar
- ✅ Click each navigation item
- ✅ Active state highlighting
- ✅ Collapse/expand functionality
- ✅ Icons and labels display correctly

### Dark Mode
- ✅ Toggle works on all pages
- ✅ Persists after page refresh
- ✅ All components adapt to theme

### Breadcrumbs
- ✅ Update based on current section
- ✅ Show correct icons and labels

### Responsive Design
- ✅ Test on different screen sizes
- ✅ Mobile menu behavior (if implemented)

## Known Issues to Check
1. Initial load should default to Dashboard
2. Direct URL navigation (with hash) should work
3. Back/forward browser buttons should work with hash navigation
4. No console errors in any section