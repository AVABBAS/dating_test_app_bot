import React from 'react'
import ReactDOM from 'react-dom/client'

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

const root = document.getElementById('root')

const showBootError = (title, detail = '') => {
  if (!root) return
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#0f1115;color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-sizing:border-box">
      <div style="width:min(680px,100%);background:#181b22;border:1px solid #2a2f3a;border-radius:18px;padding:24px;box-sizing:border-box">
        <div style="font-size:20px;font-weight:700;margin-bottom:10px">${title}</div>
        <div style="font-size:14px;line-height:1.7;color:#c8ced8;white-space:pre-wrap;word-break:break-word">${detail || 'خطای نامشخص'}</div>
      </div>
    </div>
  `
}

if (!root) {
  throw new Error('ROOT_ELEMENT_NOT_FOUND')
}

root.innerHTML = `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f1115;color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <div style="text-align:center;padding:24px">
      <div style="font-size:22px;font-weight:700">Vibe</div>
      <div style="margin-top:8px;font-size:14px;color:#aeb5c2">در حال راه‌اندازی برنامه…</div>
    </div>
  </div>
`

window.addEventListener('error', (event) => {
  showBootError('خطای اجرای برنامه', event?.error?.stack || event?.message || 'Unknown runtime error')
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason
  showBootError('خطای اجرای برنامه', reason?.stack || reason?.message || String(reason || 'Unhandled promise rejection'))
})

import('./App.jsx')
  .then(({ default: App }) => {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
  .catch((error) => {
    showBootError('خطا در بارگذاری برنامه', error?.stack || error?.message || String(error))
  })
