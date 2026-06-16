import { HELPERS as LOCAL_HELPERS } from '../data/helpers'
import { searchHelpers } from './supabase'

const CATEGORY_KEYWORDS = {
  logopedia: ['logopeda','logopedia','habla','lenguaje','pronunciación','fonema','tartamudez','voz','dislalia','disfagia','hablar','comunicación'],
  tecnico: ['caldera','fontanero','fontanería','electricista','técnico','reparar','avería','instalación','grifo','tubería','luz','calefacción',
    'aire acondicionado','pintor','cerrajero','electrodoméstico','lavadora','nevera','frigorífico','horno','microondas','persiana',
    'puerta','cerradura','ventana','gotera','humedad','desatascar','wc','inodoro','ducha','bañera','radiador','termo',
    'mecánico','coche','carro','automóvil','vehículo','motor','frenos','rueda','neumático','batería','aceite','taller',
    'albañil','yesero','escayola','azulejo','parquet','suelo','techo','pared','carpintero','soldador','pintura'],
  limpieza: ['limpiar','limpieza','fregar','barrer','hogar','casa','ordenar','cristales','planchar','sucio','polvo','mancha'],
  cuidado: ['cuidar','cuidadora','mayor','anciano','abuelo','acompañar','acompañamiento','geriatría','dependencia',
    'niños','bebé','niñera','enfermera','auxiliar','residencia','alzheimer','parkinson','discapacidad',
    'terapéutico','salud mental','canguro'],
  mascotas: ['perro','gato','mascota','animal','pasear','cuidar perro','veterinario','adiestramiento','cachorro','felino','canino','pájaro','conejo'],
  matematicas: ['matemáticas','mates','clases','profesor','refuerzo','estudiar','deberes','física','química','inglés','idioma',
    'piano','música','programación','francés','alemán','italiano','clase particular','academia','tutorías',
    'selectividad','bachillerato','eso','primaria','universidad','oposiciones','guitarra','ballet','ajedrez'],
  entrenador: ['entrenador','gym','gimnasio','deporte','ejercicio','fitness','correr','adelgazar','musculación','yoga','pilates','running',
    'crossfit','natación','ciclismo','spinning','zumba','baile','aeróbic','pesas','cardio'],
  otro: ['psicólogo','psicóloga','psicología','fisioterapeuta','fisioterapia','nutricionista','nutrición','dietista',
    'chef','cocina','cocinar','tatuaje','tatuador','maquilladora','fotógrafo','fotografía','diseñador',
    'abogado','gestor','asesor','traductor','mudanza','transporte','jardinero','jardín','plantas',
    'masaje','quiropráctico','acupuntura','reiki','terapeuta','podólogo','óptico','detective','peluquero',
    'esteticista','barman','dj','animador','carpintero','mecánico','alarma','portero','informático'],
}

const URGENCY_KEYWORDS = ['urgente','urgencia','hoy','ahora','inmediatamente','rápido','no funciona','roto','avería','24h']
const PRESENTIAL_KEYWORDS = ['casa','domicilio','presencial','venir','viene','zona','cerca','barrio']
const ONLINE_KEYWORDS = ['online','videoconferencia','remoto','internet','videollamada']
const QUALIFICATION_MAP = {
  logopedia: 'professional', tecnico: 'professional', cuidado: 'experienced',
  mascotas: 'experienced', limpieza: 'experienced', matematicas: 'student',
  entrenador: 'professional', otro: 'professional',
}

function applyRefinement(helpers, refinementText) {
  const text = refinementText.toLowerCase()
  let filtered = [...helpers]
  if (text.includes('online') || text.includes('videoconferencia')) filtered = filtered.filter(h => h.online)
  if (text.includes('domicilio') || text.includes('casa') || text.includes('venga')) filtered = filtered.filter(h => h.presential)
  if (text.includes('hoy') || text.includes('urgente') || text.includes('ahora')) {
    filtered = filtered.filter(h => h.urgent || h.available)
    filtered.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0))
  }
  const distMatch = text.match(/menos de (\d+)\s*km/)
  if (distMatch) filtered = filtered.filter(h => h.distance <= parseInt(distMatch[1]))
  const priceMatch = text.match(/menos de (\d+)€|máximo (\d+)€|hasta (\d+)€/)
  if (priceMatch) {
    const maxP = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3])
    filtered = filtered.filter(h => parseInt((h.price || '').replace(/[^0-9]/g,'')) <= maxP)
  }
  if (text.includes('mejor valorado') || text.includes('más valorado')) filtered.sort((a, b) => b.rating - a.rating)
  if (text.includes('más cercano') || text.includes('cerca')) filtered.sort((a, b) => a.distance - b.distance)
  return filtered.length > 0 ? filtered : helpers
}

export function analyzeNeed(userText) {
  const text = userText.toLowerCase()
  let categoria = 'otro'
  let maxMatches = 0
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(k => text.includes(k)).length
    if (matches > maxMatches) { maxMatches = matches; categoria = cat }
  }
  const urgente = URGENCY_KEYWORDS.some(k => text.includes(k))
  const hasOnline = ONLINE_KEYWORDS.some(k => text.includes(k))
  const hasPresential = PRESENTIAL_KEYWORDS.some(k => text.includes(k))
  const presencial = hasPresential || (!hasOnline && ['tecnico','cuidado','limpieza','mascotas'].includes(categoria))
  const nivelRequerido = QUALIFICATION_MAP[categoria] || 'experienced'
  const palabrasClave = CATEGORY_KEYWORDS[categoria]?.filter(k => text.includes(k)) || []
  const resumenMap = {
    logopedia: 'Busca un logopeda', tecnico: 'Necesita un técnico o profesional del hogar',
    limpieza: 'Busca servicio de limpieza', cuidado: 'Busca cuidado de personas',
    mascotas: 'Necesita cuidado de mascota', matematicas: 'Busca clases o formación',
    entrenador: 'Busca entrenador personal', otro: 'Busca un profesional',
  }
  return Promise.resolve({
    categoria, presencial, urgente, nivelRequerido,
    resumen: resumenMap[categoria] || 'Busca ayuda',
    palabrasClave,
  })
}

function normalizeHelper(h) {
  if (!h) return null
  return {
    ...h,
    avatarColor: h.avatar_color || h.avatarColor || '#1A56DB',
    avatarUrl: `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent((h.name || '').split(' ')[0])}`,
    avatar: (h.name || 'H').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
    responseTime: h.response_time || h.responseTime || '< 30 min',
    completionRate: h.completion_rate || h.completionRate || 95,
    qualificationLevel: h.qualification_level || h.qualificationLevel || 'experienced',
    dniVerified: h.dni_verified !== undefined ? h.dni_verified : true,
    specialty: h.specialty || (h.tags && h.tags[0]) || '',
    tags: h.tags || [],
    skills: h.skills || [],
    rating: parseFloat(h.rating) || 4.5,
    distance: parseFloat(h.distance) || 1.0,
    reviews: parseInt(h.reviews) || 0,
    services: parseInt(h.services) || 0,
    price: h.price || h.price_per_hour || null,
  }
}

export async function matchHelpers(analysis, limit = 8, refinement = null, previousResults = null) {
  // Refinement mode
  if (refinement && previousResults?.length > 0) {
    return applyRefinement(previousResults, refinement).slice(0, limit)
  }

  const levelOrder = { student: 0, experienced: 1, professional: 2 }
  const required = levelOrder[analysis.nivelRequerido] ?? 1

  let pool = []

  // Try Supabase
  try {
    const remote = await searchHelpers(analysis.categoria, analysis.palabrasClave)
    if (remote && remote.length > 0) {
      pool = remote.map(normalizeHelper).filter(Boolean)
    }
  } catch (e) {
    console.warn('Supabase error, using local:', e)
  }

  // Fallback to local data
  if (pool.length === 0) {
    pool = LOCAL_HELPERS.filter(Boolean).map(normalizeHelper).filter(Boolean)
  }

  // Score
  const scored = pool.map(h => {
    let score = 0
    if (h.category === analysis.categoria) score += 40
    const keywords = analysis.palabrasClave || []
    keywords.forEach(kw => {
      const kl = kw.toLowerCase()
      if ((h.tags || []).some(t => String(t).toLowerCase().includes(kl))) score += 10
      if (String(h.bio || '').toLowerCase().includes(kl)) score += 5
      if (String(h.specialty || '').toLowerCase().includes(kl)) score += 8
      if (String(h.name || '').toLowerCase().includes(kl)) score += 3
    })
    if (analysis.presencial && h.presential) score += 15
    const hLevel = levelOrder[h.qualificationLevel] ?? 1
    if (hLevel >= required) score += 10
    if (hLevel === required) score += 5
    if (analysis.urgente && h.urgent) score += 20
    score += (h.rating || 4.5) * 2
    score -= (h.distance || 1) * 2
    return { ...h, score }
  })

  const sorted = scored.sort((a, b) => b.score - a.score)
  
  // Always return results — never empty
  const top = sorted.filter(h => h.score > 10)
  const withContent = (top.length > 0 ? top : sorted)
    .filter(h => h.bio || h.specialty || h.tags?.length > 0) // skip empty profiles
  return (withContent.length > 0 ? withContent : sorted).slice(0, limit)
}
