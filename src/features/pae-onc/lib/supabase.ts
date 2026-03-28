import { createClient } from '@supabase/supabase-js';

// We mock the keys for the dummy client if they aren't provided in the environment.
// Since PAE-Onc expects Supabase for JWTs, we initialize it here.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xxxxxxxx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
