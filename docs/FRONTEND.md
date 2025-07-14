# ForgeBoard Frontend Development Guide

React-based dashboard for ForgeBoard app management system with modern UI components and authentication.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **ShadCN UI** - Component library
- **Lucide Icons** - Icon set

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/         # React components
│   ├── ui/            # Reusable UI components (buttons, cards, etc.)
│   ├── Dashboard.jsx  # Main dashboard view
│   ├── AppCard.jsx    # Individual app display
│   ├── LogViewer.jsx  # Real-time log viewer
│   └── ...
├── lib/               # Utility functions
├── App.jsx           # Main app component with routing
├── main.jsx          # Entry point
└── index.css         # Global styles and Tailwind imports
```

## Key Features

- **Dark Mode**: Toggle between light and dark themes
- **Real-time Updates**: App status refreshes automatically
- **Search & Filter**: Find apps quickly
- **Responsive Design**: Works on mobile and desktop
- **Hash Routing**: Navigation without page refreshes

## Navigation

The app uses hash-based routing for these sections:
- `#dashboard` - Overview and stats
- `#apps` - App management
- `#logs` - Log viewer
- `#settings` - User preferences
- `#docs` - Documentation

## API Integration

The frontend connects to the Flask backend API running on port 5000. In development, Vite proxies `/api` requests to avoid CORS issues.

## Building for Production

```bash
npm run build
```

This creates optimized files in the `dist/` directory, ready to be served by NGINX.