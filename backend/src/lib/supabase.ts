import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY ?? '';

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    '[Supabase Admin] Faltan SUPABASE_URL y/o SUPABASE_SECRET_KEY. ' +
      'Este cliente solo debe inicializarse en el backend con variables de entorno de servidor.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
