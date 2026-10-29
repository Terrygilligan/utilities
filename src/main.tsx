import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAnalytics } from './lib/firebase.ts'
import { LANG_EVENT } from './utils/i18n.ts'

const root = createRoot(document.getElementById('root')!)
const render = () =>
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
render()

window.addEventListener(LANG_EVENT, render)

initAnalytics()
