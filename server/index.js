require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { Client } = require('@notionhq/client')
const { createClient } = require('@supabase/supabase-js')

const app = express()

// ─── Security headers ──────────────────────────────────────────────────────
app.use(helmet())

// ─── CORS — only allow known origins ───────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean)

if (!allowedOrigins.length) {
  console.warn('WARNING: ALLOWED_ORIGIN is empty — CORS will reject all browser requests')
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true)
    else cb(new Error('CORS: ' + origin + ' not allowed'))
  },
}))

// ─── Body parsing with size limit ──────────────────────────────────────────
app.use(express.json({ limit: '100kb' }))

// ─── Rate limiting ─────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — try again later' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts — try again later' },
})

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin requests — try again later' },
})

app.use('/api', generalLimiter)
app.use('/api/notify-signup', authLimiter)
app.use('/api/admin', adminLimiter)

const notion = new Client({ auth: process.env.NOTION_API_KEY })

// Supabase admin client (service role — bypasses RLS, server-side ONLY)
const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_TABLES = ['tasks', 'ideas', 'transactions', 'weed', 'events', 'habits']

function getDbId(table) {
  if (!VALID_TABLES.includes(table)) return null
  const map = {
    tasks: process.env.NOTION_TASKS_DB,
    ideas: process.env.NOTION_IDEAS_DB,
    transactions: process.env.NOTION_MONEY_DB,
    weed: process.env.NOTION_WEED_DB,
    events: process.env.NOTION_EVENTS_DB,
    habits: process.env.NOTION_HABITS_DB,
  }
  return map[table]
}

function getDsId(table) {
  if (!VALID_TABLES.includes(table)) return null
  const map = {
    tasks: process.env.NOTION_TASKS_DS,
    ideas: process.env.NOTION_IDEAS_DS,
    transactions: process.env.NOTION_MONEY_DS,
    weed: process.env.NOTION_WEED_DS,
    events: process.env.NOTION_EVENTS_DS,
    habits: process.env.NOTION_HABITS_DS,
  }
  return map[table]
}

// Verify auth token and admin status — returns { user, profile } or sends error response
async function verifyAdmin(req, res) {
  if (!supabaseAdmin) { res.status(503).json({ error: 'Service unavailable' }); return null }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return null }

  const token = authHeader.slice(7)
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) { res.status(401).json({ error: 'Unauthorized' }); return null }

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!callerProfile?.is_admin) { res.status(403).json({ error: 'Forbidden' }); return null }

  return { user, profile: callerProfile }
}

// ─── Health check (must be before :table wildcard) ──────────────────────────

app.get('/api/health', async (req, res) => {
  const configured = !!process.env.NOTION_API_KEY
  let canConnect = false
  if (configured) {
    try {
      await notion.dataSources.query({ data_source_id: process.env.NOTION_TASKS_DS, page_size: 1 })
      canConnect = true
    } catch {}
  }
  res.json({ status: 'ok', notion: configured ? (canConnect ? 'connected' : 'configured') : 'missing' })
})

// ─── New user signup notification ────────────────────────────────────────────

app.post('/api/notify-signup', async (req, res) => {
  const { username } = req.body
  if (!username || typeof username !== 'string') return res.status(400).json({ error: 'username required' })

  const sanitized = username.replace(/[<>&"'/]/g, '').slice(0, 50)

  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  if (!apiKey || !adminEmail) return res.json({ skipped: true })

  try {
    const { Resend } = require('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'ProductivityOS <onboarding@resend.dev>',
      to: adminEmail,
      subject: `New signup: ${sanitized}`,
      html: `
        <div style="font-family:monospace;background:#0a130a;color:#a8d5a2;padding:24px;border:1px solid #1a3d1a">
          <h2 style="color:#00ff41;margin:0 0 16px">&gt; NEW USER REGISTERED</h2>
          <p>Username: <strong style="color:#00ff41">${sanitized}</strong></p>
          <p>Status: <span style="color:#c8a84b">PENDING APPROVAL</span></p>
          <br/>
          <a href="https://app.chrome24.store/app/admin"
             style="display:inline-block;padding:10px 24px;background:#1a3d1a;color:#00ff41;text-decoration:none;border:1px solid #00ff41;font-family:monospace">
            [ OPEN ADMIN PANEL ]
          </a>
        </div>
      `,
    })
    res.json({ sent: true })
  } catch (err) {
    console.error('notify-signup error:', err.message)
    res.json({ sent: false })
  }
})

// ─── Admin profile update (bypasses RLS via service role) ────────────────────

const ALLOWED_PROFILE_FIELDS = ['status', 'is_admin', 'enabled_modules', 'pg13_mode']

app.post('/api/admin/update-profile', async (req, res) => {
  const admin = await verifyAdmin(req, res)
  if (!admin) return

  const { userId, updates } = req.body
  if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'Invalid userId' })
  if (!updates || typeof updates !== 'object') return res.status(400).json({ error: 'Invalid updates' })

  // Only allow whitelisted fields
  const sanitized = {}
  for (const key of Object.keys(updates)) {
    if (ALLOWED_PROFILE_FIELDS.includes(key)) sanitized[key] = updates[key]
  }
  if (!Object.keys(sanitized).length) return res.status(400).json({ error: 'No valid fields' })

  const { error } = await supabaseAdmin.from('profiles').update(sanitized).eq('id', userId)
  if (error) return res.status(500).json({ error: 'Update failed' })

  console.log(`[ADMIN] ${admin.user.id} updated profile ${userId}:`, Object.keys(sanitized))
  res.json({ ok: true })
})

// ─── Admin reset user data ───────────────────────────────────────────────────

app.post('/api/admin/reset-user-data', async (req, res) => {
  const admin = await verifyAdmin(req, res)
  if (!admin) return

  const { userId } = req.body
  if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'Invalid userId' })

  // Prevent self-reset
  if (userId === admin.user.id) return res.status(400).json({ error: 'Cannot reset own data' })

  const tables = [
    'tasks', 'projects', 'notes', 'ideas', 'habits',
    'transactions', 'smoking_logs', 'calendar_events',
    'pomodoro_sessions', 'time_blocks', 'user_settings',
  ]

  const errors = []
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId)
    if (error) errors.push(table)
  }

  console.log(`[ADMIN] ${admin.user.id} reset data for ${userId} — errors: ${errors.length}`)

  if (errors.length) return res.status(500).json({ error: 'Partial reset failure' })
  res.json({ ok: true })
})

// ─── Generic CRUD routes ────────────────────────────────────────────────────

app.get('/api/:table', async (req, res) => {
  try {
    const dsId = getDsId(req.params.table)
    if (!dsId) return res.status(400).json({ error: 'Unknown table' })

    const response = await notion.dataSources.query({ data_source_id: dsId, page_size: 100 })
    res.json({ results: response.results, has_more: response.has_more })
  } catch (err) {
    console.error(`GET /api/${req.params.table}:`, err.message)
    res.status(500).json({ error: 'Fetch failed' })
  }
})

app.post('/api/:table', async (req, res) => {
  try {
    const dbId = getDbId(req.params.table)
    if (!dbId) return res.status(400).json({ error: 'Unknown table' })

    const { properties } = req.body
    if (!properties || typeof properties !== 'object') return res.status(400).json({ error: 'Invalid properties' })

    const response = await notion.pages.create({
      parent: { database_id: dbId },
      properties,
    })
    res.json(response)
  } catch (err) {
    console.error(`POST /api/${req.params.table}:`, err.message)
    res.status(500).json({ error: 'Create failed' })
  }
})

app.patch('/api/:table/:pageId', async (req, res) => {
  try {
    if (!VALID_TABLES.includes(req.params.table)) return res.status(400).json({ error: 'Unknown table' })

    const { properties } = req.body
    if (!properties || typeof properties !== 'object') return res.status(400).json({ error: 'Invalid properties' })

    const response = await notion.pages.update({
      page_id: req.params.pageId,
      properties,
    })
    res.json(response)
  } catch (err) {
    console.error(`PATCH /api/${req.params.table}/${req.params.pageId}:`, err.message)
    res.status(500).json({ error: 'Update failed' })
  }
})

app.delete('/api/:table/:pageId', async (req, res) => {
  try {
    if (!VALID_TABLES.includes(req.params.table)) return res.status(400).json({ error: 'Unknown table' })

    const response = await notion.pages.update({
      page_id: req.params.pageId,
      archived: true,
    })
    res.json(response)
  } catch (err) {
    console.error(`DELETE /api/${req.params.table}/${req.params.pageId}:`, err.message)
    res.status(500).json({ error: 'Delete failed' })
  }
})

app.post('/api/sync/:table', async (req, res) => {
  try {
    const dbId = getDbId(req.params.table)
    if (!dbId) return res.status(400).json({ error: 'Unknown table' })

    const { items } = req.body
    if (!Array.isArray(items) || items.length > 100) return res.status(400).json({ error: 'Invalid items (max 100)' })

    const results = []
    for (const item of items) {
      if (!item.properties || typeof item.properties !== 'object') continue

      if (item.notionPageId) {
        const response = await notion.pages.update({
          page_id: item.notionPageId,
          properties: item.properties,
        })
        results.push({ localId: item.id, notionPageId: response.id, action: 'updated' })
      } else {
        const response = await notion.pages.create({
          parent: { database_id: dbId },
          properties: item.properties,
        })
        results.push({ localId: item.id, notionPageId: response.id, action: 'created' })
      }
    }

    res.json({ results })
  } catch (err) {
    console.error(`POST /api/sync/${req.params.table}:`, err.message)
    res.status(500).json({ error: 'Sync failed' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Notion API: ${process.env.NOTION_API_KEY ? 'configured' : 'NOT configured'}`)
  console.log(`Supabase admin: ${supabaseAdmin ? 'configured' : 'NOT configured'}`)
  console.log(`CORS origins: ${allowedOrigins.length ? allowedOrigins.join(', ') : 'NONE (all rejected)'}`)
})
