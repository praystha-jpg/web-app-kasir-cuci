import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for standalone desktop & mobile installation
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("D'CarWash POS update ready.");
  },
  onOfflineReady() {
    console.log("D'CarWash POS offline mode ready.");
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
