// ── DYNAMIC FEED GENERATOR ────────────────────────────────────────────────
// Generates contextual "living" content for the feed that changes daily.
// No backend needed — deterministic based on date + helper data.
// When Claude API arrives, this gets replaced by real AI-generated content.

const DAY_MS = 24 * 60 * 60 * 1000

function daysSeed() {
  // Changes every day — makes feed feel fresh
  return Math.floor(Date.now() / DAY_MS)
}

function seededRandom(seed, i) {
  // Deterministic random — same result for same day
  const x = Math.sin(seed * 9301 + i * 49297 + 233720) * 10000
  return x - Math.floor(x)
}

// ── AVAILABILITY POSTS ────────────────────────────────────────────────────
export function generateAvailabilityPost(helper, index) {
  const seed = daysSeed()
  const hasSlots = seededRandom(seed, index) > 0.3
  if (!hasSlots || !helper.available) return null

  const TEXTS = [
    `Tengo huecos libres esta semana. Si llevas tiempo buscando ${helper.specialty?.toLowerCase() || 'un profesional'}, es el momento.`,
    `Acabo de liberar tiempo para nuevos clientes. ¿Hablamos?`,
    `Disponible en ${helper.zone || 'Barcelona'} esta semana. Primera consulta sin compromiso.`,
    `Esta semana tengo disponibilidad. Si necesitas ${helper.specialty?.toLowerCase() || 'ayuda'}, escríbeme.`,
  ]

  const text = TEXTS[Math.floor(seededRandom(seed + index, 1) * TEXTS.length)]

  return {
    id: `avail_${helper.id}_${seed}`,
    type: 'availability',
    text,
    date: 'Hoy',
    likes: Math.floor(seededRandom(seed, index + 2) * 15) + 2,
    comments: Math.floor(seededRandom(seed, index + 3) * 5),
    badge: 'Disponible esta semana',
    author: helper,
    authorType: 'helper',
    suggested: true,
    dynamic: true,
  }
}

// ── TIP POSTS FROM NÜRA ───────────────────────────────────────────────────
const NURA_TIPS = [
  {
    text: '¿Sabías que los mejores profesionales de Nüra responden en menos de 1 hora? Cuando contactes, cuanto más específico seas en tu mensaje, más rápida y precisa será la respuesta.',
    badge: 'Consejo de Nüra',
  },
  {
    text: 'En Nüra, cada valoración es verificada. Solo pueden dejar reseña quienes han contratado el servicio. Eso significa que un helper con 4.9⭐ realmente lo merece.',
    badge: 'Confianza Nüra',
  },
  {
    text: 'Si tienes una urgencia, busca el rayo  en el perfil del profesional. Significa que atiende casos urgentes, incluso hoy.',
    badge: 'Urgencias en Nüra',
  },
  {
    text: 'Los helpers con DNI verificado tienen un escudo verde  en su perfil. Su identidad ha sido comprobada por Nüra antes de aparecer en la plataforma.',
    badge: 'Verificación de identidad',
  },
  {
    text: 'Puedes hablar con varios helpers antes de decidir. No hay compromiso hasta que tú lo decides. Nüra está aquí para que encuentres a la persona correcta, no a la primera.',
    badge: 'Sin compromiso',
  },
  {
    text: 'El perfil vivo de cada helper en Nüra se actualiza automáticamente. La IA analiza sus valoraciones, sus chats y su trayectoria para mantenerte siempre con la información más precisa.',
    badge: 'Perfil inteligente',
  },
]

export function generateNuraTip(dayOffset = 0) {
  const seed = daysSeed() + dayOffset
  const tip = NURA_TIPS[seed % NURA_TIPS.length]
  return {
    id: `tip_${seed}`,
    type: 'tip',
    text: tip.text,
    badge: tip.badge,
    date: 'Hoy',
    likes: Math.floor(seededRandom(seed, 99) * 40) + 10,
    comments: Math.floor(seededRandom(seed, 88) * 8) + 1,
    author: {
      id: 'nura_ai',
      name: 'Nüra',
      specialty: 'Asistente IA',
      avatarUrl: '/logo-iso.png',
      verified: true,
      dniVerified: true,
    },
    authorType: 'nura',
    suggested: true,
    dynamic: true,
  }
}

// ── NEW HELPER POST ───────────────────────────────────────────────────────
export function generateNewHelperPost(helper) {
  if (!helper.specialty) return null
  return {
    id: `new_${helper.id}`,
    type: 'new_helper',
    text: `¡Hola! Me llamo ${helper.name?.split(' ')?.[0]} y acabo de unirme a Nüra como ${helper.specialty?.toLowerCase()}${helper.zone ? ` en ${helper.zone}` : ''}. ${helper.bio ? helper.bio.slice(0, 120) + (helper.bio.length > 120 ? '...' : '') : 'Estoy disponible y con ganas de ayudar.'}`,
    date: 'Nuevo en Nüra',
    likes: Math.floor(Math.random() * 8) + 1,
    comments: 0,
    badge: 'Nuevo en Nüra',
    author: helper,
    authorType: 'helper',
    suggested: true,
    dynamic: true,
  }
}

// ── MAIN GENERATOR ────────────────────────────────────────────────────────
export function generateDynamicPosts(helpers, limit = 6) {
  const posts = []
  const seed = daysSeed()

  // 1. Daily Nüra tip
  posts.push(generateNuraTip(0))

  // 2. 2-3 availability posts from available helpers
  const available = (helpers || []).filter(h => h?.available && h?.specialty)
  const shuffled = [...available].sort((a, b) => {
    return seededRandom(seed, a.id) - seededRandom(seed, b.id)
  })
  shuffled.slice(0, 3).forEach((h, i) => {
    const post = generateAvailabilityPost(h, i * 10)
    if (post) posts.push(post)
  })

  // 3. A "new helper" post
  const newHelpers = (helpers || []).filter(h => h?.specialty && h?.bio)
  if (newHelpers.length > 0) {
    const idx = seed % newHelpers.length
    const post = generateNewHelperPost(newHelpers[idx])
    if (post) posts.push(post)
  }

  // 4. Second tip with different offset
  posts.push(generateNuraTip(1))

  return posts.filter(Boolean).slice(0, limit)
}
