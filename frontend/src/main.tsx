import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { withErrorOverlay } from './components/with-error-overlay'
import { ThemeProvider } from './contexts/ThemeContext'

const AppWithErrorOverlay = withErrorOverlay(App)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWithErrorOverlay />
    </ThemeProvider>
  </StrictMode>,
)
