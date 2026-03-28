require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Client } = require('@notionhq/client')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const allowedOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
  origin: allowedOrigins.length ? (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true)
    else cb(new Error('CORS: ' + origin + ' not allowed'))
  } : true,
}))
app.use(express.json())

const notion = new Client({ auth: process.env.NOTION_API_KEY })

// Supabase admin client (service role — bypasses RLS)
const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

// ─── Helpers ────────────────────────────────────────────────────────────────

// Database IDs for creating pages (pages.create needs parent.database_id)
function getDbId(table) {
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

// Data source IDs for querying (SDK v5: dataSources.query needs data_source_id)
function getDsId(table) {
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

// ─── Health check (must be before :table wildcard) ──────────────────────────

app.get('/api/health', async (req, res) => {
  const configured = !!process.env.NOTION_API_KEY
  let canConnect = false
  if (configured) {
    try {
      // Use dataSources.query (SDK v5) — databases.retrieve is unreliable in v5
      await notion.dataSources.query({ data_source_id: process.env.NOTION_TASKS_DS, page_size: 1 })
      canConnect = true
    } catch {}
  }
  res.json({ status: 'ok', notion: configured ? (canConnect ? 'connected' : 'configured') : 'missing API key' })
})

// ─── New user signup notification ────────────────────────────────────────────

app.post('/api/notify-signup', async (req, res) => {
  const { username } = req.body
  if (!username) return res.status(400).json({ error: 'username required' })

  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  if (!apiKey || !adminEmail) return res.json({ skipped: true })

  try {
    const { Resend } = require('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'ProductivityOS <onboarding@resend.dev>',
      to: adminEmail,
      subject: `New signup: ${username}`,
      html: `
        <div style="font-family:monospace;background:#0a130a;color:#a8d5a2;padding:24px;border:1px solid #1a3d1a">
          <h2 style="color:#00ff41;margin:0 0 16px">&gt; NEW USER REGISTERED</h2>
          <p>Username: <strong style="color:#00ff41">${username}</strong></p>
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
    res.json({ sent: false, error: err.message })
  }
})

// ─── Admin profile update (bypasses RLS via service role) ────────────────────

app.post('/api/admin/update-profile', async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No auth token' })

  // Verify caller is admin
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' })

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!callerProfile?.is_admin) return res.status(403).json({ error: 'Not admin' })

  // Apply update
  const { userId, updates } = req.body
  if (!userId || !updates) return res.status(400).json({ error: 'userId and updates required' })

  const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', userId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ─── Generic CRUD routes ────────────────────────────────────────────────────

// GET /api/:table — fetch all pages from a Notion database
app.get('/api/:table', async (req, res) => {
  try {
    const dsId = getDsId(req.params.table)
    if (!dsId) return res.status(400).json({ error: `Unknown table: ${req.params.table}` })

    const response = await notion.dataSources.query({ data_source_id: dsId, page_size: 100 })
    res.json({ results: response.results, has_more: response.has_more })
  } catch (err) {
    console.error(`GET /api/${req.params.table}:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/:table — create a page in a Notion database
app.post('/api/:table', async (req, res) => {
  try {
    const dbId = getDbId(req.params.table)
    if (!dbId) return res.status(400).json({ error: `Unknown table: ${req.params.table}` })

    const { properties } = req.body
    const response = await notion.pages.create({
      parent: { database_id: dbId },
      properties,
    })
    res.json(response)
  } catch (err) {
    console.error(`POST /api/${req.params.table}:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/:table/:pageId — update a page
app.patch('/api/:table/:pageId', async (req, res) => {
  try {
    const { properties } = req.body
    const response = await notion.pages.update({
      page_id: req.params.pageId,
      properties,
    })
    res.json(response)
  } catch (err) {
    console.error(`PATCH /api/${req.params.table}/${req.params.pageId}:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/:table/:pageId — archive a page (Notion doesn't truly delete)
app.delete('/api/:table/:pageId', async (req, res) => {
  try {
    const response = await notion.pages.update({
      page_id: req.params.pageId,
      archived: true,
    })
    res.json(response)
  } catch (err) {
    console.error(`DELETE /api/${req.params.table}/${req.params.pageId}:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sync/:table — bulk sync: receives array of local items, upserts to Notion
app.post('/api/sync/:table', async (req, res) => {
  try {
    const dbId = getDbId(req.params.table)
    if (!dbId) return res.status(400).json({ error: `Unknown table: ${req.params.table}` })

    const { items } = req.body
    const results = []

    for (const item of items) {
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
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Notion API: ${process.env.NOTION_API_KEY ? 'configured' : 'NOT configured — add NOTION_API_KEY to .env'}`)
})
