import { Capacitor } from '@capacitor/core'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
createRoot(document.getElementById('root')!).render(<App />)

// Native builds bundle these assets; browser builds cache them after the first visit.
if (import.meta.env.PROD && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register(new URL('./sw.js', document.baseURI)).catch(() => {})
}
