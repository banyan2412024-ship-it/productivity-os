require('dotenv').config()
const { Client } = require('@notionhq/client')
const n = new Client({ auth: process.env.NOTION_API_KEY })

const dbs = [
  ['tasks', process.env.NOTION_TASKS_DB],
  ['ideas', process.env.NOTION_IDEAS_DB],
  ['money', process.env.NOTION_MONEY_DB],
  ['weed', process.env.NOTION_WEED_DB],
  ['events', process.env.NOTION_EVENTS_DB],
  ['habits', process.env.NOTION_HABITS_DB],
]

async function main() {
  for (const [name, id] of dbs) {
    try {
      const db = await n.databases.retrieve({ database_id: id })
      const props = Object.entries(db.properties || {}).map(([k, v]) => `${k}(${v.type})`).join(', ')
      console.log(`${name}: ${props || 'no properties'}`)
    } catch (e) {
      console.log(`${name}: ERROR - ${e.message}`)
    }
  }
}
main()
