/**
 * Supabase Cloud Database Configuration
 * Client-Safe Configuration (Uses public anon key)
 * 
 * Auto-persisted by Admin Portal & Server.
 * Connect once, permanently active for all visitors and sessions.
 */

window.SUPABASE_CONFIG = {
  // Public project URL (e.g., 'https://xyzproject.supabase.co')
  url: 'https://qqlgfvznmkqiwrbldntl.supabase.co',
  
  // Public anonymous key (starts with eyJhbGciOi...)
  anonKey: 'sb_publishable_0PzdhVVdWUz7pB1W-ygdqQ_I48whEho'
};

// Auto-sync into browser localStorage if not already present
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const cachedUrl = localStorage.getItem('sb_portfolio_url');
    const cachedKey = localStorage.getItem('sb_portfolio_key');
    if (window.SUPABASE_CONFIG.url) {
      localStorage.setItem('sb_portfolio_url', window.SUPABASE_CONFIG.url);
    } else if (cachedUrl) {
      window.SUPABASE_CONFIG.url = cachedUrl;
    }
    if (window.SUPABASE_CONFIG.anonKey) {
      localStorage.setItem('sb_portfolio_key', window.SUPABASE_CONFIG.anonKey);
    } else if (cachedKey) {
      window.SUPABASE_CONFIG.anonKey = cachedKey;
    }
  } catch (e) {
    // localStorage may be disabled or restricted
  }
}
