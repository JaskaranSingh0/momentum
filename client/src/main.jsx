import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { DateProvider } from './contexts/DateContext.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DateProvider>
          <App />
        </DateProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
