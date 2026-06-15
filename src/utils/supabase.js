const SUPABASE_URL = 'https://oxmohciswebonoumghhu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_-_N1S0ni6t27kX41oPBw0g_nBlu9jcQ'

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

// Generate consistent color from name
function nameToColor(name) {
  const colors = ['#7B2FFF','#059669','#1A56DB','#D97706','#DC2626','#0891B2','#7C3AED','#DB2777']
  let hash = 0
  for (let i = 0; i < (name||'').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// Map Supabase column names → app field names
function normalize(h) {
  const name = h.name || 'Helper'
  const avatarUrl = h.avatar_url || null
  // Generate DiceBear avatar URL for helpers without photo
  const avatarFallback = `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(name)}`
  
  return {
    id: h.id,
    name,
    specialty: h.speciality || h.specialty || h.category || 'Profesional',
    category: h.category || 'otro',
    bio: h.bio || '',
    zone: h.zone || h.city || 'Barcelona',
    city: h.city || 'Barcelona',
    price: h.price || null,
    rating: parseFloat(h.rating) || 4.5,
    reviews: parseInt(h.reviews) || 0,
    distance: parseFloat(h.distance) || (Math.random() * 4 + 0.5).toFixed(1) * 1,
    responseTime: h.response_time || '< 1 hora',
    completionRate: parseInt(h.completion_rate) || 92,
    services: parseInt(h.services) || 0,
    presential: h.presential ?? true,
    online: h.online ?? false,
    urgent: h.urgent ?? false,
    verified: h.verified ?? true,
    founder: h.founder ?? false,
    dniVerified: h.dni_verified ?? false,
    tags: Array.isArray(h.tags) ? h.tags : (h.tags ? [h.tags] : []),
    skills: Array.isArray(h.skills) ? h.skills : [],
    languages: Array.isArray(h.languages) ? h.languages : [],
    avatarColor: h.avatar_color || nameToColor(name),
    avatarUrl: avatarUrl || avatarFallback,
    avatar: name[0]?.toUpperCase() || '?',
    available: h.available ?? true,
    // Prevent crashes for fields used in profile
    hiddenSkills: [],
    education: [],
    experience: [],
    posts: [],
    qualitativeComments: [],
    evolution: [],
    personality: null,
  }
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
