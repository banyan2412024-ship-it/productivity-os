/**
 * One-time migration: Notion → Supabase
 * Run: node migrate-to-supabase.js <service_role_key> <user_id>
 *
 * service_role_key: Supabase Dashboard → Settings → API → service_role
 * user_id: Supabase Dashboard → Authentication → Users → your anonymous user → User UID
 */

import { createClient } from '@supabase/supabase-js'
import data from './notion-data.json' assert { type: 'json' }

const SUPABASE_URL = 'https://coiyrexiwkmcawjbjcid.supabase.co'
const SERVICE_KEY  = process.argv[2]
const USER_ID      = process.argv[3]

if (!SERVICE_KEY || !USER_ID) {
  console.error('Usage: node migrate-to-supabase.js <service_role_key> <user_id>')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Notion property helpers ──────────────────────────────────────────────────

const title   = (p, k = 'Name') => p[k]?.title?.[0]?.text?.content ?? ''
const text    = (p, k) => p[k]?.rich_text?.[0]?.text?.content ?? ''
const sel     = (p, k) => p[k]?.select?.name ?? ''
const chk     = (p, k) => !!p[k]?.checkbox
const num     = (p, k) => p[k]?.number ?? 0
const date    = (p, k) => p[k]?.date?.start ?? null

// ─── Build rows ───────────────────────────────────────────────────────────────

const uid = USER_ID

const tasks = data.tasks.map(pg => {
  const p = pg.properties
  return {
    id:             text(p, 'Local ID') || pg.id,
    user_id:        uid,
    title:          title(p),
    notes:          text(p, 'Notes'),
    status:         sel(p, 'Status')   || 'inbox',
    priority:       sel(p, 'Priority') || 'medium',
    is_mit:         chk(p, 'Is MIT'),
    is_frog:        chk(p, 'Is Frog'),
    is_quick_win:   chk(p, 'Quick Win'),
    due_date:       date(p, 'Due Date'),
    scheduled_date: null,
    category:       sel(p, 'Category') || 'Other',
    tags:           [],
    project_id:     null,
    created_at:     pg.created_time,
    completed_at:   null,
  }
})

const ideas = data.ideas.map(pg => {
  const p = pg.properties
  return {
    id:            text(p, 'Local ID') || pg.id,
    user_id:       uid,
    title:         title(p),
    description:   text(p, 'Description'),
    category:      sel(p, 'Category') || 'Other',
    reminder_date: date(p, 'Reminder Date'),
    status:        sel(p, 'Status') || 'active',
    created_at:    pg.created_time,
  }
})

const transactions = data.transactions.map(pg => {
  const p = pg.properties
  return {
    id:          text(p, 'Local ID') || pg.id,
    user_id:     uid,
    description: title(p),
    amount:      num(p, 'Amount'),
    type:        sel(p, 'Type') || 'expense',
    category:    sel(p, 'Category') || 'Other',
    date:        date(p, 'Date') || pg.created_time.split('T')[0],
    created_at:  pg.created_time,
  }
})

const smoking_logs = data.weed.map(pg => {
  const p = pg.properties
  return {
    id:         text(p, 'Local ID') || pg.id,
    user_id:    uid,
    grams:      num(p, 'Grams'),
    date:       date(p, 'Date') || pg.created_time.split('T')[0],
    time:       text(p, 'Time'),
    created_at: pg.created_time,
  }
})

const calendar_events = data.events.map(pg => {
  const p = pg.properties
  return {
    id:          text(p, 'Local ID') || pg.id,
    user_id:     uid,
    title:       title(p),
    date:        date(p, 'Date') || pg.created_time.split('T')[0],
    start_time:  text(p, 'Start Time') || '09:00',
    end_time:    text(p, 'End Time')   || '10:00',
    type:        'event',
    color:       '#6366f1',
    description: '',
    idea_id:     null,
    created_at:  pg.created_time,
  }
})

const habits = data.habits.map(pg => {
  const p = pg.properties
  return {
    id:                 text(p, 'Local ID') || pg.id,
    user_id:            uid,
    name:               title(p),
    description:        '',
    frequency:          sel(p, 'Frequency')    || 'daily',
    custom_days:        [],
    time_of_day:        sel(p, 'Time of Day')  || 'anytime',
    stacked_after:      null,
    intention_time:     null,
    intention_location: null,
    color:              text(p, 'Color') || '#00ff41',
    icon:               'circle',
    completions:        [],
    current_streak:     num(p, 'Current Streak'),
    longest_streak:     num(p, 'Longest Streak'),
    created_at:         pg.created_time,
  }
})

// ─── Insert ───────────────────────────────────────────────────────────────────

async function insert(table, rows) {
  if (!rows.length) { console.log(`  ${table}: 0 rows, skipping`); return }
  const { error } = await sb.from(table).upsert(rows, { onConflict: 'id' })
  if (error) console.error(`  ✗ ${table}:`, error.message)
  else       console.log(`  ✓ ${table}: ${rows.length} rows`)
}

console.log('\nMigrating to Supabase...\n')
await insert('tasks',           tasks)
await insert('ideas',           ideas)
await insert('transactions',    transactions)
await insert('smoking_logs',    smoking_logs)
await insert('calendar_events', calendar_events)
await insert('habits',          habits)
console.log('\nDone.')
