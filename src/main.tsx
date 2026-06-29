import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { VersionProvider } from './contexts/VersionContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <VersionProvider>
      <App />
    </VersionProvider>
  </React.StrictMode>,
)
