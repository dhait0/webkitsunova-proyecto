import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import App from './App';
import { supabase } from './lib/supabase';
import './styles/global.css';

function AuthHandler() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
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

