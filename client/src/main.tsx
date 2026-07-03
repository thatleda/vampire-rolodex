import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Root } from './Root.tsx'
import './index.css'

async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
    return
  }
  const { worker } = await import('./mocks/browser.ts')
  await worker.start({ onUnhandledRequest: 'error' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  )
})
