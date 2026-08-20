import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket / HMR and iframe database lifecycle errors in sandboxed runtime environment
if (typeof window !== 'undefined') {
  const isIgnorableRuntimeError = (str: string) => {
    const lower = (str || '').toLowerCase();
    return (
      lower.includes('websocket') ||
      lower.includes('vite') ||
      lower.includes('ws://') ||
      lower.includes('wss://') ||
      lower.includes('closed without opened') ||
      lower.includes('database is closing') ||
      lower.includes('database is hidden') ||
      lower.includes('database is closing/hidden') ||
      lower.includes('database connection is closing') ||
      lower.includes('transaction was aborted') ||
      lower.includes('the database is closed')
    ) && !lower.includes('smartlink-critical');
  };

  const origError = console.error;
  console.error = (...args: any[]) => {
    const fullMsg = args
      .map((a) => (typeof a === 'string' ? a : a?.message || (a?.stack ? a.stack : String(a || ''))))
      .join(' ');
    if (isIgnorableRuntimeError(fullMsg)) return;
    origError.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    const fullMsg = args
      .map((a) => (typeof a === 'string' ? a : a?.message || String(a || '')))
      .join(' ');
    if (isIgnorableRuntimeError(fullMsg)) return;
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
      if (isIgnorableRuntimeError(message)) {
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
      if (isIgnorableRuntimeError(message)) {
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

