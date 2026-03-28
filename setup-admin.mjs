/**
 * Creates an admin profile for the existing anonymous user.
 * Run: node setup-admin.mjs <service_role_key> <username>
 * Example: node setup-admin.mjs eyJ... banyan
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://coiyrexiwkmcawjbjcid.supabase.co'
const SERVICE_KEY  = process.argv[2]
const USERNAME     = process.argv[3] || 'admin'
const USER_ID      = '1f15f4e2-ea21-40ff-a976-b099707818c9'

if (!SERVICE_KEY) {
  console.error('Usage: node setup-admin.mjs <service_role_key> [username]')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const profile = {
  id: USER_ID,
  username: USERNAME,
  theme: 'matrix',
  custom_theme: null,
  enabled_modules: ['tasks', 'notes', 'ideas', 'habits', 'pomodoro', 'money', 'smoking'],
  is_admin: true,
  status: 'approved',
}

const { error } = await sb.from('profiles').upsert(profile, { onConflict: 'id' })
if (error) { console.error('✗', error.message); process.exit(1) }
console.log(`✓ Admin profile created for "${USERNAME}" (user_id: ${USER_ID})`)
