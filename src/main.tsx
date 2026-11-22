import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Full Inter 4 release (not the Google subset), so glyphs like → and ₹ render in Inter as in Figma.
import 'inter-ui/inter-variable.css'
import './styles/index.css'
import App from './App'
import { sprites } from './assets/figma'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Warm the cache for every Figma artwork image so later screens appear instantly.
const preloadArtwork = () => {
  for (const src of new Set(Object.values(sprites).map((crop) => crop.src))) {
    const image = new Image()
    image.decoding = 'async'
    image.src = src
  }
}
if ('requestIdleCallback' in window) window.requestIdleCallback(preloadArtwork)
else setTimeout(preloadArtwork, 500)
