import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/typography.css'
import './styles/components/avatar.css'
import './styles/components/bottom-nav.css'
import './styles/components/button.css'
import './styles/components/card.css'
import './styles/components/input.css'
import './styles/components/modal.css'
import './styles/components/toast.css'
import './sections.css'
import './styles/legacy-shim.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
