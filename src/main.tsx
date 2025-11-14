import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create debug panel
const debugPanel = document.createElement('div');
debugPanel.id = 'debug-panel';
debugPanel.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: black; color: lime; padding: 1rem; font-family: monospace; font-size: 14px; z-index: 9999; max-height: 50vh; overflow: auto;';
document.body.appendChild(debugPanel);

const logs: string[] = [];
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  logs.push(`[${timestamp}] ${message}`);
  debugPanel.innerHTML = logs.join('<br>');
};

addLog('=== GigMate Debug Panel ===');
addLog('Starting initialization...');

// Override console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  addLog('LOG: ' + args.join(' '));
  originalConsoleLog(...args);
};

console.error = (...args) => {
  addLog('ERROR: ' + args.join(' '));
  originalConsoleError(...args);
};

// Add global error handler
window.addEventListener('error', (event) => {
  addLog('RUNTIME ERROR: ' + (event.error?.message || event.message));
  addLog('Stack: ' + (event.error?.stack || 'No stack trace'));
});

window.addEventListener('unhandledrejection', (event) => {
  addLog('PROMISE REJECTION: ' + event.reason);
});

addLog('Checking environment variables...');
addLog('VITE_SUPABASE_URL: ' + (import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING'));
addLog('VITE_SUPABASE_ANON_KEY: ' + (import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'));

try {
  const rootElement = document.getElementById('root');
  addLog('Root element found: ' + (rootElement ? 'YES' : 'NO'));

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  addLog('Creating React root...');
  const root = createRoot(rootElement);

  addLog('Rendering App component...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  addLog('✓ App rendered successfully!');

  // Hide debug panel after 5 seconds if no errors
  setTimeout(() => {
    if (!logs.some(log => log.includes('ERROR'))) {
      debugPanel.style.display = 'none';

      // Add a toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = 'Show Debug';
      toggleBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 8px 16px; background: black; color: lime; border: 1px solid lime; border-radius: 4px; font-family: monospace; cursor: pointer;';
      toggleBtn.onclick = () => {
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
      };
      document.body.appendChild(toggleBtn);
    }
  }, 5000);
} catch (error) {
  addLog('INITIALIZATION ERROR: ' + (error instanceof Error ? error.message : String(error)));
  if (error instanceof Error && error.stack) {
    addLog('Stack: ' + error.stack);
  }
}
