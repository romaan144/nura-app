const SUPABASE_URL = 'https://oxmohciswebonoumghhu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_-_N1S0ni6t27kX41oPBw0g_nBlu9jcQ'

export async function searchHelpers(category, keywords = []) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/helpers?select=*&available=eq.true&order=rating.desc&limit=30`
    
    // Only filter by category if it's not 'otro' 
    if (category && category !== 'otro') {
      url += `&category=eq.${encodeURIComponent(category)}`
    }

    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    if (!res.ok) {
      console.warn('Supabase response not ok:', res.status)
      return null
    }

    const data = await res.json()
    return Array.isArray(data) ? data : null
  } catch (e) {
    console.warn('Supabase fetch error:', e)
    return null
  }
}
