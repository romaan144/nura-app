const SUPABASE_URL = 'https://oxmohciswebonoumghhu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_-_N1S0ni6t27kX41oPBw0g_nBlu9jcQ'

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

// Map Supabase column names → app field names
function normalize(h) {
  return {
    id: h.id,
    name: h.name,
    specialty: h.speciality, // note: typo in DB
    category: h.category,
    bio: h.bio,
    zone: h.zone,
    city: h.city || 'Barcelona',
    price: h.price,
    rating: parseFloat(h.rating) || 4.5,
    reviews: parseInt(h.reviews) || 0,
    distance: parseFloat(h.distance) || 1.5,
    responseTime: h.response_time || '< 1 hora',
    completionRate: parseInt(h.completion_rate) || 90,
    services: parseInt(h.services) || 0,
    presential: h.presential ?? true,
    online: h.online ?? false,
    urgent: h.urgent ?? false,
    verified: h.verified ?? false,
    founder: h.founder ?? false,
    dniVerified: h.dni_verified ?? false,
    tags: h.tags || [],
    skills: h.skills || [],
    languages: h.languages || [],
    avatarColor: h.avatar_color || '#7B2FFF',
    avatarUrl: h.avatar_url || null,
    available: h.available ?? true,
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
