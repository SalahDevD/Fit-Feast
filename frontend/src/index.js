import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';
import { appQueryClient } from './lib/queryClient';
import { initializeThemeMode } from './lib/theme';

// Suppress external script DOM errors (e.g., from browser extensions)
window.addEventListener('error', (e) => {
  if (e.filename && e.filename.includes('contentYt')) {
    e.preventDefault();
    return true;
  }
});

initializeThemeMode();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={appQueryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
            <Toaster position="top-right" />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
