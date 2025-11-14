import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  document.body.innerHTML = `
    <div style="min-height: 100vh; background: #fef2f2; display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: system-ui, -apple-system, sans-serif;">
      <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 32rem;">
        <h1 style="font-size: 1.5rem; font-weight: bold; color: #dc2626; margin-bottom: 1rem;">Runtime Error</h1>
        <p style="color: #374151; margin-bottom: 1rem;">The application encountered an error:</p>
        <pre style="font-size: 0.75rem; background: #f3f4f6; padding: 1rem; border-radius: 0.25rem; overflow: auto; margin-bottom: 1rem;">${event.error?.message || event.message}</pre>
        <button onclick="window.location.reload()" style="width: 100%; background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; border: none; cursor: pointer;">Reload</button>
      </div>
    </div>
  `;
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  console.log('Starting GigMate application...');

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  console.log('GigMate application rendered successfully');
} catch (error) {
  console.error('Failed to render application:', error);
  document.body.innerHTML = `
    <div style="min-height: 100vh; background: #fef2f2; display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: system-ui, -apple-system, sans-serif;">
      <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 32rem;">
        <h1 style="font-size: 1.5rem; font-weight: bold; color: #dc2626; margin-bottom: 1rem;">Initialization Error</h1>
        <p style="color: #374151; margin-bottom: 1rem;">Failed to start the application:</p>
        <pre style="font-size: 0.75rem; background: #f3f4f6; padding: 1rem; border-radius: 0.25rem; overflow: auto; margin-bottom: 1rem;">${error instanceof Error ? error.message : String(error)}</pre>
        <button onclick="window.location.reload()" style="width: 100%; background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; border: none; cursor: pointer;">Reload</button>
      </div>
    </div>
  `;
}
