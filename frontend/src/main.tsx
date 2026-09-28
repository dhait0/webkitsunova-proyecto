import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import App from './App';
import { supabase } from './lib/supabase';
import './styles/global.css';

function AuthHandler() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }

      if (event === 'SIGNED_IN' && session) {
        if (window.location.hash.includes('access_token') || window.location.hash.includes('code')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        navigate('/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthHandler />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
