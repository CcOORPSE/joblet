import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabase = null;

try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Supabase not configured - file storage will be limited');
    console.log('   Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env');
  } else {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Supabase client initialized');
    console.log(`   URL: ${supabaseUrl}`);
  }
} catch (error) {
  console.error('❌ Supabase initialization failed:', error.message);
}

export { supabase };
export default supabase;
