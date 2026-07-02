import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Creamos un cliente "mock" o vacío temporalmente si no hay variables de entorno,
// para que la app no crashee mientras configuras tus keys.
const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'TU_SUPABASE_URL_AQUI';

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isConfigured) {
  console.warn("Supabase no está configurado. Por favor, añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.local");
}
