import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Clear any existing content
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Create root
const root = createRoot(rootElement);

// Initial render
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 