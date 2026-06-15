const SUPABASE_URL = 'https://oxmohciswebonoumghhu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_-_N1S0ni6t27kX41oPBw0g_nBlu9jcQ'

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

export async function searchHelpers(category, keywords = []) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/helpers?select=*&limit=50`

    if (category && category !== 'otro' && category !== 'general') {
      url += `&category=eq.${encodeURIComponent(category)}`
    }

    const res = await fetch(url, { headers })
    if (!res.ok) return null

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    // Filter by keywords client-side
    if (keywords.length > 0) {
      return data.filter(h => {
        const searchable = `${h.name} ${h.specialty} ${h.bio} ${h.tags?.join(' ')}`.toLowerCase()
        return keywords.some(k => searchable.includes(k.toLowerCase()))
      })
    }

    return data
  } catch (e) {
    console.error('Supabase error:', e)
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
    return data?.[0] || null
  } catch {
    return null
  }
}
