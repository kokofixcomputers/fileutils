import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// HashRouter keeps routing anchored at "/" regardless of the subpath the
// site is served from (e.g. GitHub Pages project sites at /repo-name/),
// and needs no server-side rewrite rules for deep links to work.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
