import { createClient } from '@supabase/supabase-js'

// Service role client — only used in admin-gated UI, never exposed to non-admins
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_KEY,
)

export { supabaseAdmin }
