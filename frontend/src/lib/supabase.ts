import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

if (import.meta.env.DEV && !supabaseUrl) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL no está configurada. ' +
      'El frontend no podrá conectarse a Supabase. ' +
      'Configúralo en las variables de entorno.'
  );
}

if (import.meta.env.DEV && !supabasePublishableKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_PUBLISHABLE_KEY no está configurada. ' +
      'El frontend no podrá autenticarse con Supabase. ' +
      'Configúralo en las variables de entorno.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
