const SUPABASE_URL = 'https://oxmohciswebonoumghhu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_-_N1S0ni6t27kX41oPBw0g_nBlu9jcQ'

export async function fetchHelpers(query = '') {
  const url = `${SUPABASE_URL}/rest/v1/helpers?select=*&available=eq.true&order=rating.desc`
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  })
  if (!res.ok) throw new Error('Supabase error')
  return res.json()
}

export async function searchHelpers(category, keywords = []) {
  let url = `${SUPABASE_URL}/rest/v1/helpers?select=*&available=eq.true`
  if (category && category !== 'otro') {
    url += `&category=eq.${category}`
  }
  url += `&order=rating.desc&limit=20`
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  })
  if (!res.ok) throw new Error('Supabase error')
  return res.json()
}
