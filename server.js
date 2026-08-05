import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TaskForge API' })
})

// In-memory presence cache for fast polling fallback
const presenceCache = new Map()

app.post('/api/presence/report', (req, res) => {
  const { projectId, id, name } = req.body
  if (!projectId || !id || !name) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const key = `${projectId}:${id}`
  presenceCache.set(key, { projectId, id, name, lastSeen: Date.now() })
  res.json({ success: true })
})

app.get('/api/presence/:projectId', (req, res) => {
  const { projectId } = req.params
  const now = Date.now()
  const active = []

  for (const [key, val] of presenceCache.entries()) {
    if (val.projectId === projectId) {
      if (now - val.lastSeen < 30000) {
        active.push({ id: val.id, name: val.name })
      } else {
        presenceCache.delete(key)
      }
    }
  }

  res.json(active)
})

app.listen(PORT, () => {
  console.log(`TaskForge Server running on port ${PORT}`)
})
