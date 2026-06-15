// Generate consistent color from name
function nameToColor(name) {
  const colors = ['#1A56DB','#7B2FFF','#059669','#D97706','#DC2626','#0891B2','#7C3AED','#DB2777']
  let hash = 0
  for (let i = 0; i < (name||'').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// Normalize Supabase helper → same structure as local helpers
function normalize(h) {
  const name = h.name || 'Helper'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const color = h.avatar_color || nameToColor(name)
  const avatarUrl = h.avatar_url || `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(name)}`

  return {
    // Core identity
    id: h.id,
    name,
    avatar: initials,
    avatarColor: color,
    avatarUrl,

    // Professional info
    specialty: h.speciality || h.specialty || h.category || 'Profesional',
    category: h.category || 'otro',
    tags: Array.isArray(h.tags) ? h.tags : [],
    bio: h.bio || '',
    price: h.price || null,

    // Location
    zone: h.zone || h.city || 'Barcelona',
    city: h.city || 'Barcelona',
    distance: parseFloat(h.distance) || parseFloat((Math.random() * 4 + 0.3).toFixed(1)),

    // Stats
    rating: parseFloat(h.rating) || 4.5,
    reviews: parseInt(h.reviews) || 0,
    services: parseInt(h.services) || 0,
    completionRate: parseInt(h.completion_rate) || 92,
    responseTime: h.response_time || '< 1 hora',

    // Flags
    verified: h.verified ?? true,
    available: h.available ?? true,
    presential: h.presential ?? true,
    online: h.online ?? false,
    urgent: h.urgent ?? false,
    founder: h.founder ?? false,
    dniVerified: h.dni_verified ?? false,
    criminalRecordClear: false,
    qualificationLevel: h.qualification_level || 'professional',

    // Skills & languages
    skills: Array.isArray(h.skills) ? h.skills : [],
    languages: Array.isArray(h.languages) ? h.languages : [],
    hiddenSkills: [],

    // Rich profile data — empty for Supabase helpers (they don't have it yet)
    education: [],
    experience: [],
    posts: [],
    qualitativeComments: [],
    evolution: [],
    personality: null,
  }
}

const SUPABASE_URL = 'https://oxmohciswebonoumghhu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_-_N1S0ni6t27kX41oPBw0g_nBlu9jcQ'

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}



export async function searchHelpers(category, keywords = []) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/helpers?select=*&limit=100&order=rating.desc`

    // Filter by category if specific
    if (category && !['otro', 'general', 'todos'].includes(category)) {
      url += `&category=eq.${encodeURIComponent(category)}`
    }

    const res = await fetch(url, { headers })
    if (!res.ok) {
      console.warn('Supabase error:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    // Filter by keywords client-side
    if (keywords?.length > 0) {
      const filtered = data.filter(h => {
        const searchable = [
          h.name, h.speciality, h.bio, h.zone, h.category,
          ...(h.tags || []), ...(h.skills || [])
        ].join(' ').toLowerCase()
        return keywords.some(k => k && searchable.includes(k.toLowerCase()))
      })
      // If keyword filter kills all results, return all
      return (filtered.length > 0 ? filtered : data).map(normalize)
    }

    return data.map(normalize)
  } catch (e) {
    console.error('Supabase fetch error:', e)
    return null
  }
}

export async function getHelperById(id) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?id=eq.${id}&select=*&limit=1`,
      { headers }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.[0] ? normalize(data[0]) : null
  } catch {
    return null
  }
}

export async function getAllHelpers() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?select=*&limit=1000&order=rating.desc`,
      { headers }
    )
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data.map(normalize) : null
  } catch {
    return null
  }
}
