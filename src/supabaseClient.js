import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are missing from environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Please add them to your .env file.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
