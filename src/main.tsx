import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket / HMR connection errors in sandboxed runtime environment
if (typeof window !== 'undefined') {
  const isViteWsError = (str: string) => {
    const lower = (str || '').toLowerCase();
    return (
      lower.includes('websocket') ||
      lower.includes('vite') ||
      lower.includes('ws://') ||
      lower.includes('wss://') ||
      lower.includes('closed without opened')
    ) && !lower.includes('smartlink');
  };

  const origError = console.error;
  console.error = (...args: any[]) => {
    const fullMsg = args
      .map((a) => (typeof a === 'string' ? a : a?.message || (a?.stack ? a.stack : String(a || ''))))
      .join(' ');
    if (isViteWsError(fullMsg)) return;
    origError.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    const fullMsg = args
      .map((a) => (typeof a === 'string' ? a : a?.message || String(a || '')))
      .join(' ');
    if (isViteWsError(fullMsg)) return;
    origWarn.apply(console, args);
  };

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event?.reason;
      const message =
        typeof reason === 'string'
          ? reason
          : reason?.message || String(reason || '');
      if (isViteWsError(message)) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation();
        }
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      const message = event?.message || event?.error?.message || '';
      if (isViteWsError(message)) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation();
        }
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

