import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Fallback: Manually trigger loader removal slightly after render command
  setTimeout(() => {
    const loader = document.getElementById('startup-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  }, 500);
  
} catch (e) {
  console.error("Critical Render Error:", e);
  document.body.innerHTML += `<div style="color:red; padding:20px;">CRITICAL APP ERROR: ${e}</div>`;
}