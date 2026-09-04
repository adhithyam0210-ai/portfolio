/**
 * Supabase Cloud Database Configuration
 * Client-Safe Configuration (Uses public anon key)
 * 
 * Instructions to connect Supabase:
 * 1. Log in to your Supabase project (https://supabase.com/dashboard)
 * 2. Go to Project Settings -> API
 * 3. Copy your "Project URL" and "anon public" API key
 * 4. Paste them into the admin portal ("Database & Cloud" tab) OR configure below:
 */

window.SUPABASE_CONFIG = {
  // Public project URL (e.g., 'https://xyzproject.supabase.co')
  url: localStorage.getItem('sb_portfolio_url') || '',
  
  // Public anonymous key (starts with eyJhbGciOi...)
  anonKey: localStorage.getItem('sb_portfolio_key') || ''
};
