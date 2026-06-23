import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

// Global Error Guard to prevent third-party, browser-extension, or sandboxed cross-origin script issues
if (typeof window !== "undefined") {
  const silenceBenignErrors = (event: ErrorEvent) => {
    const message = event.message || "";
    const filename = event.filename || "";
    
    // "Script error." occurs when cross-origin scripts fail due to CORS in sandboxed iframe environments
    if (message.includes("Script error.") || !filename) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    // Suppress chrome extensions, google service wrappers, contentsquare and other tracking script noises
    if (
      filename.includes("chrome-extension") ||
      filename.includes("google") ||
      filename.includes("googletagmanager") ||
      filename.includes("contentsquare") ||
      filename.includes("hotjar")
    ) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  };

  window.addEventListener("error", silenceBenignErrors, true);

  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason) {
      const reasonStr = String(event.reason);
      if (
        reasonStr.includes("Script error") ||
        reasonStr.includes("Extension") ||
        reasonStr.includes("Google") ||
        reasonStr.includes("googletagmanager")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
