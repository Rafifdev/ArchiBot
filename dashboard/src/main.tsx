// Suppress Lit dev mode informational banner in browser console
if (typeof window !== 'undefined') {
  ((window as any).litIssuedWarnings ??= new Set()).add('dev-mode');
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './theme/theme.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
