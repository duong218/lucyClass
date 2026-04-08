import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { keepAliveBackend } from './utils/keepAlive'
import './i18n.js'
import './index.css'

keepAliveBackend();

window.addEventListener("unhandledrejection", function (event) {
  console.error("UNHANDLED PROMISE ERROR:", event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
