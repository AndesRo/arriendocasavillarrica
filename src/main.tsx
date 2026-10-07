import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Activa las animaciones de entrada solo si hay JavaScript.
document.documentElement.classList.add('js');

// El panel privado vive en /admin y se carga aparte: los visitantes nunca descargan su código.
const AdminApp = lazy(() => import('./admin/AdminApp'));
const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute ? (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
