import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oxmohciswebonoumghhu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bW9oY2lzd2Vib25vdW1naGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzE4MTUsImV4cCI6MjA2NTIwNzgxNX0.oJQLSV5UEGjV3f6sPnHJT3nOVHXyaQJGzHKVDQkWCHo'

// ── WRITE AI DATA ──────────────────────────────────────────────────────────
// Claude API calls this to update a helper's ai_data field.
// Claude can write ANY keys — no schema migration needed.
//
// Example call:
//   await writeHelperAiData(helperId, {
//     summary: "Logopeda con especial sensibilidad para niños con TEA...",
//     skills: ["Logopedia infantil", "TEA", "Dislalia funcional"],
//     personality: { paciencia: 92, empatia: 88, comunicacion: 95 },
//     ideal_for: ["Niños de 3-8 años", "Casos de TEA", "Dislalia"],
//     nueva_categoria_que_claude_inventa: "..."
//   })

export async function writeHelperAiData(helperId, aiDataUpdates) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  
  // Merge with existing ai_data (don't overwrite everything)
  const { data: existing } = await supabase
    .from('helpers')
    .select('ai_data')
    .eq('id', helperId)
    .single()
  
  const merged = { ...(existing?.ai_data || {}), ...aiDataUpdates }
  
  const { error } = await supabase
    .from('helpers')
    .update({
      ai_data: merged,
      ai_analyzed_at: new Date().toISOString()
    })
    .eq('id', helperId)
  
  if (error) throw error
  return merged
}

// ── WRITE CHAT LOG ─────────────────────────────────────────────────────────
// Append to a helper's chat_log so Claude can analyze conversations.
// Claude reads this to detect skills, personality, red flags, etc.

export async function appendHelperChatLog(helperId, userMsg, helperReply) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  
  const { data: existing } = await supabase
    .from('helpers')
    .select('chat_log')
    .eq('id', helperId)
    .single()
  
  const newEntry = `[${new Date().toISOString()}]\nUsuario: ${userMsg}\nHelper: ${helperReply}\n---\n`
  const updated = (existing?.chat_log || '') + newEntry
  
  await supabase
    .from('helpers')
    .update({ chat_log: updated })
    .eq('id', helperId)
}

// ── READ FOR ANALYSIS ──────────────────────────────────────────────────────
// Claude API calls this to get everything it needs to analyze a helper.

export async function getHelperForAnalysis(helperId) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  
  const { data, error } = await supabase
    .from('helpers')
    .select('*, ai_data, ai_analyzed_at, chat_log')
    .eq('id', helperId)
    .single()
  
  if (error) throw error
  return data
}
