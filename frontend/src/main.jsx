import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import './index.css'
import './i18n'
import App from './App.jsx'
import { WatchlistProvider } from './context/WatchlistContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
 <QueryClientProvider client={queryClient}>
  <BrowserRouter>
  <AuthProvider>
  <WatchlistProvider>
  <App />
  </WatchlistProvider>
  </AuthProvider>
  </BrowserRouter>
 </QueryClientProvider>
)
