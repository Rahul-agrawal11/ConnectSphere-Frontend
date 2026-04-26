import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
  </QueryClientProvider>
);