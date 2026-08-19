/**
 * PLTK Keep-Alive Pinger
 * Pings the Render backend every 14 minutes to prevent it from spinning down.
 * Run with: node keepalive.js
 */

const SERVER_URL = 'https://project-tracker-hbs7.onrender.com/health'
const INTERVAL_MS = 14 * 60 * 1000 // 14 minutes

async function ping() {
  const now = new Date().toLocaleTimeString()
  try {
    const res = await fetch(SERVER_URL)
    const data = await res.json()
    console.log(`[${now}] ✅ Server awake — ${JSON.stringify(data)}`)
  } catch (err) {
    console.error(`[${now}] ❌ Ping failed — ${err.message}`)
  }
}

console.log(`🏓 PLTK Keep-Alive started. Pinging every 14 minutes...`)
console.log(`   Target: ${SERVER_URL}\n`)

// Ping immediately on start
ping()

// Then ping every 14 minutes
setInterval(ping, INTERVAL_MS)
