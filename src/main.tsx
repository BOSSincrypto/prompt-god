import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import './styles/index.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root is missing from index.html')

// The boot placeholder lives inside #root so it is replaced by the first
// render rather than needing to be torn down separately.
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
