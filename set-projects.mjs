/**
 * Creates projects and assigns tasks to them in Supabase.
 * Run: node set-projects.mjs <service_role_key>
 */
import { createClient } from '@supabase/supabase-js'
import { v4 as uuid } from 'uuid'

const SUPABASE_URL = 'https://coiyrexiwkmcawjbjcid.supabase.co'
const SERVICE_KEY  = process.argv[2]
const USER_ID      = '1f15f4e2-ea21-40ff-a976-b099707818c9'

if (!SERVICE_KEY) {
  console.error('Usage: node set-projects.mjs <service_role_key>')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Projects ────────────────────────────────────────────────────────────────

const projects = [
  { id: uuid(), user_id: USER_ID, name: 'Bee Log',                created_at: new Date().toISOString() },
  { id: uuid(), user_id: USER_ID, name: 'Productivity-OS',        created_at: new Date().toISOString() },
  { id: uuid(), user_id: USER_ID, name: 'Humidity Pack Business', created_at: new Date().toISOString() },
  { id: uuid(), user_id: USER_ID, name: 'Telegram Translate Bot', created_at: new Date().toISOString() },
  { id: uuid(), user_id: USER_ID, name: 'Travel Coding Server',   created_at: new Date().toISOString() },
]

const P = Object.fromEntries(projects.map(p => [p.name, p.id]))

// ─── Task → project mappings (by Local ID from Notion) ───────────────────────

const taskAssignments = [
  // Humidity Pack Business
  { id: 'fb5434fd-e94a-4111-8240-e3cc33a74dc9', project: 'Humidity Pack Business' }, // Receive Samples
  { id: '6cca3ec5-3b06-4bcc-80b5-7ced3b50c060', project: 'Humidity Pack Business' }, // Test Samples
  { id: 'a5d01552-a380-43b3-bcdb-61ecd58aae5f', project: 'Humidity Pack Business' }, // Receive Samples (2nd)

  // Productivity-OS
  { id: 'bd81ec77-bdef-4733-8daa-6d4570ece289', project: 'Productivity-OS' }, // Sub folders
  { id: '408f615e-7c26-4c74-9044-e9516139f98e', project: 'Productivity-OS' }, // Add text copy box
  { id: 'ec43cb05-8d5e-4d9a-a9b8-2cccf990d5e8', project: 'Productivity-OS' }, // think of cool animations
  { id: '72d36e37-29a1-45d5-9497-c19e918fc95b', project: 'Productivity-OS' }, // Make difficulty one button
  { id: '396fc6b1-c8bc-4ff9-8094-a83a5f9704d4', project: 'Productivity-OS' }, // mobile character text fix
  { id: '7687bdbb-37dd-4d4f-aa57-f298c6c5e9c5', project: 'Productivity-OS' }, // Set up SupaBase
  { id: '1e7ac140-75cd-4d12-a1a5-0e6fe3794687', project: 'Productivity-OS' }, // Next to 3 buttons add 3 main

  // Bee Log
  { id: 'ad31481f-d32c-4ed3-afde-afce7cf634cc', project: 'Bee Log' }, // Deploy Prompt Ctrl + .
  { id: '49389ed0-1cc7-439b-bccd-c20fc928fb61', project: 'Bee Log' }, // Test and Bug Fix
  { id: 'bd519a11-c720-4bd5-b53d-14215b6006b3', project: 'Bee Log' }, // Work on the design

  // Telegram Translate Bot
  { id: 'ccb711b1-65e6-4479-9d53-62b86e48c68f', project: 'Telegram Translate Bot' }, // Brainstorm
  { id: 'bfa05525-bdcc-4c22-851c-fc2d582e1e86', project: 'Telegram Translate Bot' }, // Think of the idea

  // Travel Coding Server
  { id: '8678387a-bc7f-493e-aa7b-0e3e9c4fc9bc', project: 'Travel Coding Server' }, // Change terminal logo
]

// ─── Run ─────────────────────────────────────────────────────────────────────

console.log('\nCreating projects...')
const { error: pe } = await sb.from('projects').upsert(projects, { onConflict: 'id' })
if (pe) { console.error('  ✗ projects:', pe.message); process.exit(1) }
console.log(`  ✓ ${projects.length} projects created`)

console.log('\nAssigning tasks...')
let ok = 0, fail = 0
for (const { id, project } of taskAssignments) {
  const { error } = await sb
    .from('tasks')
    .update({ project_id: P[project] })
    .eq('id', id)
    .eq('user_id', USER_ID)
  if (error) { console.error(`  ✗ ${id}: ${error.message}`); fail++ }
  else { ok++ }
}
console.log(`  ✓ ${ok} tasks assigned${fail ? `, ✗ ${fail} failed` : ''}`)
console.log('\nDone.')
