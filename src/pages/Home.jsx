import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Mic, MicOff, Plus, Clock } from 'lucide-react'
import { analyzeNeed, matchHelpers } from '../utils/matching'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import { MenuButton } from '../components/NavBar'
import { showToast } from '../components/Toast'
import HelperCard from '../components/HelperCard'
import HelperCarousel from '../components/HelperCarousel'
import RegisterGate from '../components/RegisterGate'
import { haptic } from '../utils/haptic'
import { scheduleLocalNotification, notifySearchAbandoned } from '../utils/notifications'
import styles from './Home.module.css'

function getWelcome(user, searchHistory, favorites, helpersCache) {
  const hour = new Date().getHours()
  const greeting = hour < 14 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')?.[0] || user?.name

  if (!user) return [
    `Hola. Soy **Nüra**.`,
    `Cuéntame lo que necesitas — en lenguaje normal, sin formularios. Encuentro a la persona real que puede ayudarte.`,
  ]

  // Use what Nüra knows about this user
  const lastSearch = searchHistory?.[searchHistory.length - 1]?.query
  const favHelpers = (favorites || [])
    .map(id => helpersCache?.[id] || helpersCache?.[String(id)])
    .filter(Boolean)
  const topFav = favHelpers[0]

  // Returning user with history
  if (lastSearch && searchHistory?.length > 2) {
    return [
      `${greeting}, **${firstName}**.`,
      `La última vez buscaste **${lastSearch}**. ¿Sigues necesitando algo parecido o tienes una nueva necesidad?`
    ]
  }

  // User with favorites
  if (topFav && favorites?.length > 0) {
    return [
      `${greeting}, **${firstName}**.`,
      `**${topFav.name?.split(' ')?.[0]}** está en tus favoritos. ¿Le escribo?`
    ]
  }

  // First or second visit
  if (searchHistory?.length === 1) {
    return [
      `Bienvenido de nuevo, **${firstName}**.`,
      `¿Qué necesitas hoy? Cuéntamelo y encuentro a la persona exacta.`
    ]
  }
  // Default greeting
  if (user.isHelper) return [`${greeting}, **${firstName}**. ¿Qué necesitas hoy?`]
  return [
    `${greeting}, **${firstName}**.`,
    hour < 12 ? `¿En qué puedo ayudarte esta mañana?`
    : hour < 18 ? `Cuéntame qué necesitas y lo encontramos.`
    : `¿Qué necesitas esta noche?`
  ]
}

function detectIntent(text, user) {
  const t = text.toLowerCase()
  if (user?.isHelper && (t.includes('aprendido') || t.includes('certificado') || t.includes('estudié') || t.includes('trabajé')))
    return 'update_profile'
  if (t.includes('empresa') || t.includes('contratar') || t.includes('empleado') || t.includes('trabajó'))
    return 'b2b'
  if (user?.isHelper && (t.includes('cliente') || t.includes('ofrecer') || t.includes('disponible')))
    return 'helper_visibility'
  return 'search'
}

// ── DYNAMIC SUGGESTIONS ───────────────────────────────────────────────────
// Rotates based on time of day, day of week, and user history
function getDynamicSuggestions(user, searchHistory) {
  const hour = new Date().getHours()
  const day  = new Date().getDay() // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6
  const isMorning = hour >= 7 && hour < 13
  const isAfternoon = hour >= 13 && hour < 20
  const isEvening = hour >= 20 || hour < 7

  // Pool of all possible suggestions
  const ALL = [
    // Cuidado
    'Cuidadora de mayores en casa',
    'Cuidado de mi abuela con Alzheimer',
    'Niñera para mis hijos',
    'Acompañante para persona mayor',
    'Auxiliar a domicilio',
    // Técnicos
    'Técnico urgente hoy',
    'Fontanero para una gotera',
    'Electricista certificado',
    'Reparar la caldera',
    'Pintor para el salón',
    // Salud
    'Logopeda infantil',
    'Fisioterapeuta a domicilio',
    'Psicólogo online',
    'Nutricionista personalizado',
    // Educación
    'Clases de matemáticas',
    'Profesor de inglés',
    'Refuerzo escolar para el cole',
    // Limpieza
    'Limpieza del hogar',
    'Limpieza profunda',
    'Persona de limpieza semanal',
    // Mascotas
    'Cuidado de mascotas',
    'Paseos para mi perro',
    'Cuidar mi gato en vacaciones',
    // Fitness
    'Entrenador personal',
    'Clases de yoga a domicilio',
    'Pilates personalizado',
  ]

  // Time-based pools
  let pool = []

  if (isWeekend) {
    pool = [
      'Limpieza profunda este fin de semana',
      'Paseos para mi perro',
      'Entrenador personal',
      'Clases de yoga a domicilio',
      'Técnico urgente hoy',
      'Cuidado de mascotas',
    ]
  } else if (isMorning) {
    pool = [
      'Cuidadora de mayores en casa',
      'Logopeda infantil',
      'Clases de matemáticas',
      'Profesor de inglés',
      'Limpieza del hogar',
      'Fontanero para una gotera',
    ]
  } else if (isAfternoon) {
    pool = [
      'Refuerzo escolar para el cole',
      'Fisioterapeuta a domicilio',
      'Niñera para mis hijos',
      'Técnico urgente hoy',
      'Paseos para mi perro',
      'Nutricionista personalizado',
    ]
  } else { // evening
    pool = [
      'Cuidadora de mayores en casa',
      'Psicólogo online',
      'Entrenador personal',
      'Auxiliar a domicilio',
      'Reparar la caldera',
      'Clases de inglés online',
    ]
  }

  // Remove things user already searched
  const searched = (searchHistory || []).map(s => s.query?.toLowerCase() || '')
  const filtered = pool.filter(s =>
    !searched.some(q => s.toLowerCase().includes(q.slice(0,8)))
  )
  const final = filtered.length >= 3 ? filtered : pool

  // Pick 4 varied suggestions (shuffle deterministically by minute)
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) // changes daily
  const shuffled = [...final].sort((a, b) => {
    const ha = (a.charCodeAt(0) + seed) % 7
    const hb = (b.charCodeAt(0) + seed) % 7
    return ha - hb
  })

  return shuffled.slice(0, 4).map(text => ({ text }))
}

const HELPER_SUGGESTIONS = [
  { text: 'Añadir nueva certificación' },
  { text: 'Actualizar disponibilidad' },
  { text: 'Añadir experiencia reciente' },
  { text: 'Cambiar mis tarifas' },
]


export default function Home({ setSearchState }) {
  const navigate = useNavigate()
  const { user, addSearch, toggleFavorite, isFavorite, searchHistory, favorites, helpersCache, nuraChatMessages, setNuraChatMessages, nuraLastMatches, setNuraLastMatches, cacheHelpers } = useUser()
  // messages persisted in context so they survive navigation
  const messages = nuraChatMessages
  const setMessages = setNuraChatMessages
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [showGate, setShowGate] = useState(false)
  const [gateReason, setGateReason] = useState('contact')
  // showSuggestions: hide once user has chatted
  const showSuggestions = nuraChatMessages.length <= 1
  const setShowSuggestions = () => {} // no-op, derived from messages
  const [inputFocused, setInputFocused] = useState(false)
  const lastMatches = nuraLastMatches
  const setLastMatches = setNuraLastMatches
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    let lines = getWelcome(user)
    // If just came from onboarding with a name — magic first moment
    const justOnboarded = sessionStorage.getItem('nura_just_onboarded')
    if (justOnboarded) {
      sessionStorage.removeItem('nura_just_onboarded')
      const firstName = justOnboarded.split(' ')[0]
      lines = [
        `¡Hola, **${firstName}**! Soy Nüra.`,
        `Cuéntame lo que necesitas — sin formularios, sin filtros. Solo cuéntame.`
      ]
      setTimeout(() => setMessages([{ id: 1, from: 'nura', lines }]), 400)
      return
    }

    // If helper just registered
    const helperRegistered = sessionStorage.getItem('nura_helper_registered')
    if (helperRegistered) {
      sessionStorage.removeItem('nura_helper_registered')
      const firstName = user?.name?.split(' ')?.[0] || user?.name || ''
      lines = [
        `¡Ya eres parte de Nüra, **${firstName}**!`,
        `Tu perfil ya está visible. Los primeros usuarios pueden encontrarte desde ahora. Nüra lo irá enriqueciendo automáticamente con cada interacción.`
      ]
      setTimeout(() => setMessages([{ id: 1, from: 'nura', lines }]), 300)
      return
    }

    // If just registered (user)
    const justRegistered = sessionStorage.getItem('nura_just_registered')
    if (justRegistered) {
      sessionStorage.removeItem('nura_just_registered')
      lines = [`Bienvenido a Nüra, **${user?.name?.split(' ')?.[0] || 'tú'}**. Ya puedes contactar con cualquier profesional. ¿Qué necesitas?`]
      setTimeout(() => setMessages([{ id: 1, from: 'nura', lines }]), 300)
      return
    }
    // Returning user — single message + immediate action chips
    const lastQ = searchHistory?.[0]?.query
    const msgs = [{ id: 1, from: 'nura', lines }]
    if (user && lastQ && nuraChatMessages.length === 0) {
      const hour = new Date().getHours()
      const g = hour < 14 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches'
      const firstName = user.name?.split(' ')?.[0] || user.name
      msgs[0] = {
        id: 1, from: 'nura',
        lines: [`${g}, **${firstName}**. La última vez buscaste **${lastQ}**.`],
        chips: ['Buscar de nuevo', 'Buscar algo diferente']
      }
    }

    // Only init if no previous conversation
    if (nuraChatMessages.length === 0) {
      setTimeout(() => setMessages(msgs), 300)
    }

    // Proactive question for helpers after 8s of inactivity
    if (user?.isHelper) {
      const t = setTimeout(() => {
        setMessages(prev => {
          if (prev.length > 1) return prev // user already engaged
          return [...prev, {
            id: Date.now(), from: 'nura',
            lines: ['Por cierto, ¿has trabajado en algo nuevo últimamente o completado alguna formación? Cuéntamelo para actualizar tu perfil.']
          }]
        })
      }, 8000)
      return () => clearTimeout(t)
    }
  }, [user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function formatLine(line) {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (parts||[]).map((part, i) => {
      if (i % 2 === 1) {
        if (part.startsWith('grad:')) return <span key={i} className={styles.gradText}>{part.slice(5)}</span>
        return <strong key={i}>{part}</strong>
      }
      return part
    })
  }

  async function handleSend(text) {
    const msg = text || input
    if (!msg.trim() || loading) return
    haptic('light')

    setInput('')
    setShowSuggestions(false)
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: msg }])
    setLoading(true)

    const intent = detectIntent(msg, user)

    // Context-aware responses
    const t = msg.toLowerCase()
    if (lastMatches) {
      // User confirms — guide to profile
      if (t.includes('sí') || t.includes('si') || t.includes('me convence') || t.includes('perfecto') || t.includes('ese') || t.includes('bien')) {
        const topMatch = lastMatches?.[0]
        const firstName = topMatch?.name?.split(' ')?.[0] || ''
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [
              topMatch
                ? `Perfecto. **${firstName}** tiene ${topMatch.rating}★ y suele responder en ${topMatch.responseTime || '< 1 hora'}.`
                : `Perfecto.`,
              `Pulsa en la tarjeta para ver el perfil completo y escribirle directamente.`
            ],
            chips: topMatch ? [`Escribir a ${firstName}`] : []
          }])
          setLoading(false)
        }, 800)
        return
      }
      // Smart refinement based on chip
      const isRefinement = t.includes('no') || t.includes('otro') || t.includes('diferente') ||
        t.includes('más barato') || t.includes('más cerca') || t.includes('mejor valorado') ||
        t.includes('ajusta') || t.includes('filtra') || t.includes('urgencias')

      if (isRefinement && lastMatches?.length > 0) {
        let refined = [...lastMatches]
        let refineLine = 'He ajustado los resultados.'

        if (t.includes('más barato') || t.includes('precio') || t.includes('económico')) {
          refined = refined.sort((a,b) => {
            const pa = parseFloat((a.price||'999').replace(/[^0-9.]/g,'')) || 999
            const pb = parseFloat((b.price||'999').replace(/[^0-9.]/g,'')) || 999
            return pa - pb
          })
          refineLine = `Ordenados por precio. El más económico es **${refined[0]?.name?.split(' ')?.[0]}** a ${refined[0]?.price}.`
        } else if (t.includes('más cerca') || t.includes('cerca') || t.includes('zona')) {
          refined = refined.sort((a,b) => (a.distance||9) - (b.distance||9))
          refineLine = `Ordenados por cercanía. **${refined[0]?.name?.split(' ')?.[0]}** está a ${refined[0]?.distance || '1.2'}km.`
        } else if (t.includes('mejor valorado') || t.includes('rating') || t.includes('valoración')) {
          refined = refined.sort((a,b) => (b.rating||0) - (a.rating||0))
          refineLine = `Ordenados por valoración. **${refined[0]?.name?.split(' ')?.[0]}** tiene ${refined[0]?.rating}⭐.`
        } else if (t.includes('urgencias') || t.includes('urgente') || t.includes('hoy')) {
          refined = refined.filter(h => h.urgent).concat(refined.filter(h => !h.urgent))
          refineLine = refined.filter(h=>h.urgent).length > 0
            ? `Primero los que atienden urgencias.`
            : `Ninguno de estos atiende urgencias. Prueba buscar "urgente" directamente.`
        } else {
          // Generic: re-run with same analysis
          const reRefined = await matchHelpers({ categoria: analysis?.categoria || 'otro', palabrasClave: [] }, 4, msg, lastMatches)
          refined = reRefined?.length ? reRefined : refined
          refineLine = 'He ajustado los resultados.'
        }

        const resultMsg = { id: Date.now(), from: 'nura', lines: [refineLine], results: refined,
          chips: [`Escribir a ${refined[0]?.name?.split(' ')?.[0]}`, 'Más barato', 'Más cerca', 'Ver todos'] }
        setMessages(prev => [...prev, resultMsg])
        setLastMatches(refined)
        setLoading(false)
        return
      }
    }

    // Refinement — if user is refining previous results
    if (lastMatches && intent === 'search') {
      const refined = await matchHelpers({ categoria: 'otro', palabrasClave: msg.toLowerCase().split(' ') }, 4, msg, lastMatches)
      if (refined?.length) {
        const resultMsg = { id: Date.now(), from: 'nura', lines: [`He ajustado los resultados.`], results: refined }
        setMessages(prev => [...prev, resultMsg])
        setTimeout(() => setMessages(prev => [...prev, { id: Date.now()+1, from: 'nura', lines: ['¿Te convence alguno?'] }]), 1200)
        setLastMatches(refined)
        setLoading(false)
        return
      }
    }

    if (intent === 'update_profile') {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['He actualizado tu perfil con esta información. Nüra lo analizará y añadirá las habilidades relevantes automáticamente.'] }])
        setLoading(false)
      }, 1200)
      return
    }
    if (intent === 'b2b') {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['El acceso empresarial está disponible en Fase 3. Si quieres verificar que alguien ha trabajado contigo, cuéntame su nombre y qué quieres que conste.'] }])
        setLoading(false)
      }, 1000)
      return
    }
    if (intent === 'helper_visibility') {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['Tu perfil está activo. ¿Quieres actualizar tu disponibilidad, zona o añadir algo nuevo?'] }])
        setLoading(false)
      }, 1000)
      return
    }

    try {
      // Analyse first so we can use it for contextual loading message
      const analysis = await analyzeNeed(msg)
      const loadingText = analysis?.urgente
        ? 'Buscando disponibilidad urgente...'
        : analysis?.categoria === 'cuidado'
        ? 'Revisando cuidadoras verificadas en tu zona...'
        : analysis?.categoria === 'tecnico'
        ? 'Localizando técnicos disponibles...'
        : analysis?.categoria === 'logopeda'
        ? 'Buscando logopedas especializados...'
        : analysis?.categoria === 'salud'
        ? 'Buscando profesionales de salud...'
        : analysis?.categoria === 'legal'
        ? 'Buscando asesores jurídicos...'
        : 'Analizando tu necesidad y buscando el perfil ideal...'
      setMessages(prev => [...prev, { id: Date.now() + 0.5, from: 'nura', lines: [loadingText], loading: true }])
      const matches = await matchHelpers(analysis, 4)
      clearInterval(window.__nuraStatusInterval)
      setMessages(prev => prev.filter(m => !m.loading))

      if (!matches?.length) {
        // Smart recovery: suggest alternatives based on the analysis
        const categoria = analysis?.categoria || 'otro'
        const alternativas = {
          logopeda:    { alt: 'logopeda online', chip1: 'Buscar online', chip2: 'Ampliar zona' },
          tecnico:     { alt: 'técnico de guardia', chip1: 'Urgencias 24h', chip2: 'Ampliar zona' },
          limpieza:    { alt: 'servicio de limpieza online', chip1: 'Ampliar zona', chip2: 'Ver todos' },
          cuidado:     { alt: 'cuidadora a domicilio', chip1: 'Ver cuidadoras', chip2: 'Ampliar zona' },
          mascotas:    { alt: 'cuidador de mascotas', chip1: 'Ver cuidadores', chip2: 'Ampliar zona' },
          matematicas: { alt: 'profesor online', chip1: 'Buscar online', chip2: 'Ampliar zona' },
          entrenador:  { alt: 'entrenador online', chip1: 'Buscar online', chip2: 'Ampliar zona' },
          otro:        { alt: 'profesional similar', chip1: 'Ampliar zona', chip2: 'Ver todos' },
        }
        const rec = alternativas[categoria] || alternativas.otro

        setMessages(prev => [...prev, {
          id: Date.now(), from: 'nura',
          lines: [
            `Ahora mismo no hay nadie disponible exactamente para eso en tu zona.`,
            `Puedo buscar **${rec.alt}** o ampliar un poco el radio. ¿Qué prefieres?`
          ],
          chips: [rec.chip1, rec.chip2, 'Cuéntame más']
        }])

        // After 2s, proactively suggest Explore
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 1, from: 'nura',
            lines: ['También puedes explorar todos los profesionales disponibles en Nüra.'],
            chips: ['Ver Explorar']
          }])
        }, 2500)

        setLoading(false)
        return
      }

      addSearch?.(msg)
      window.__nuraLastQuery = msg  // Store for chat pre-fill
      window.__nuraLastAnalysis = analysis
      setSearchState({ query: msg, analysis, matches })
      setLastMatches(matches)
      // Schedule reminder if user doesn't contact
      scheduleLocalNotification(
        '¿Te convencieron los resultados?',
        `Tienes ${matches.length} profesionales esperando tu mensaje en Nüra.`,
        2 * 60 * 60 * 1000
      )
      // Cache helpers for instant profile + chat loading
      if (matches?.length) {
        const cacheMap = {}
        matches.forEach(h => {
          if (h?.id) {
            cacheMap[h.id] = h
            cacheMap[String(h.id)] = h
            cacheMap[parseInt(h.id)] = h
          }
        })
        window.__nuraHelperCache = { ...(window.__nuraHelperCache || {}), ...cacheMap }
        // Store match reason for profile view
        // Store match reasons for ALL results
        if (matches?.length > 0) {
          const reasons = {}
          matches.forEach((h, i) => {
            if (!h?.id) return
            const reason = buildMatchReason(h, analysis)
            if (reason) reasons[String(h.id)] = reason
          })
          window.__nuraMatchReasons = { ...(window.__nuraMatchReasons||{}), ...reasons }
        }
        // Also cache in UserContext via cacheHelpers
        cacheHelpers?.(matches)
      }

      // Build smart result message with context
      const cat = analysis?.categoria || 'otro'
      const especialidad = cat === 'logopeda' ? 'logopedas'
        : cat === 'tecnico' ? 'técnicos'
        : cat === 'limpieza' ? 'profesionales de limpieza'
        : cat === 'cuidado' ? 'cuidadoras'
        : cat === 'mascotas' ? 'cuidadores de mascotas'
        : cat === 'matematicas' ? 'profesores'
        : cat === 'entrenador' ? 'entrenadores'
        : cat === 'salud' ? 'profesionales de salud'
        : cat === 'legal' ? 'asesores legales'
        : cat === 'hogar' ? 'profesionales del hogar'
        : 'profesionales'
      const top = matches?.[0]
      const zona = top?.zone || top?.city || 'Barcelona'
      const topName = top?.name?.split(' ')?.[0] || ''
      const resultLine = matches.length === 1
        ? `Encontré **1 ${especialidad.slice(0,-1)}** verificado cerca de ti.`
        : `Encontré **${matches.length} ${especialidad}** cerca de ti en ${zona}.`

      // Build rich match explanation — the core AI differentiator
      function buildMatchReason(helper, analysis) {
        if (!helper) return null
        const name = helper.name?.split(' ')?.[0]
        const reasons = []

        // Specialty match
        if (helper.specialty) reasons.push(`especialista en ${helper.specialty.toLowerCase()}`)

        // Experience signal
        if (helper.reviews >= 80) reasons.push(`${helper.reviews} clientes satisfechos`)
        else if (helper.reviews >= 30) reasons.push(`${helper.reviews} valoraciones`)

        // Distance
        if (helper.distance) reasons.push(`a ${helper.distance}km de ti`)

        // Response time
        if (helper.responseTime) reasons.push(`responde en ${helper.responseTime}`)

        // Urgency match
        if (analysis?.urgente && helper.urgent) reasons.push('atiende urgencias hoy')

        // Modality match
        if (analysis?.modalidad === 'online' && helper.online) reasons.push('disponible online')
        else if (analysis?.modalidad === 'presencial' && helper.presential) reasons.push('visita a domicilio')

        if (reasons.length === 0) return `**${name}** está disponible y tiene ${helper.rating}★`

        const mainReason = reasons.slice(0, 2).join(' y ')
        return `**${name}** es mi recomendación: ${mainReason}. ${helper.rating}★ de media.`
      }

      const matchExplanation = buildMatchReason(top, analysis)
      const followLine = matches.length >= 3 && matchExplanation
        ? matchExplanation
        : matches.length > 0
        ? `Solo hay ${matches.length} disponibles ahora. ¿Ampliamos la búsqueda?`
        : null

      const resultMsg = {
        id: Date.now(), from: 'nura',
        lines: followLine
          ? (user ? [resultLine, followLine] : [resultLine, followLine, 'Para contactarles, crea tu cuenta gratis. Solo tarda 30 segundos.'])
          : (user ? [resultLine] : [resultLine, 'Crea tu cuenta gratis para escribirles.']),
        results: matches,
        chips: matches.length > 0
          ? (user
            ? [`Escribir a ${topName}`, 'Más barato', 'Más cerca', 'Ver todos']
            : [`Crear cuenta`, 'Más barato', 'Más cerca', 'Ver todos'])
          : ['Ampliar búsqueda', 'Cambiar zona', 'Online también']
      }
      setMessages(prev => [...prev, resultMsg])
    } catch {
      clearInterval(window.__nuraStatusInterval)
      setMessages(prev => prev.filter(m => !m.loading))
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['Algo fue mal. Inténtalo de nuevo.'] }])
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function toggleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'es-ES'
    rec.onresult = e => { handleSend(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    setListening(true)
  }

  const suggestions = user?.isHelper ? HELPER_SUGGESTIONS : getDynamicSuggestions(user, searchHistory)

  return (
    <div className={styles.page}>
      {/* New search button — appears when chat has content */}
      {messages.length > 1 && (
        <div style={{
          position:'absolute', top:'max(env(safe-area-inset-top,0px),52px)',
          right:'16px', zIndex:25,
          marginTop:'8px',
        }}>
          <button
            onClick={() => {
              setMessages([])
              setLastMatches([])
              setInput('')
              setTimeout(() => {
                setMessages([{ id: 1, from: 'nura', lines: getWelcome(user) }])
              }, 100)
            }}
            style={{
              padding:'6px 12px',
              background:'rgba(255,255,255,0.85)',
              backdropFilter:'blur(20px)',
              WebkitBackdropFilter:'blur(20px)',
              border:'1px solid rgba(0,0,0,0.08)',
              borderRadius:'100px',
              fontSize:'11px', fontWeight:600,
              color:'rgba(0,0,0,0.5)',
              cursor:'pointer',
              boxShadow:'0 1px 8px rgba(0,0,0,0.06)',
              display:'flex', alignItems:'center', gap:'4px',
            }}>
            ✕ Nueva búsqueda
          </button>
        </div>
      )}

      {/* Floating top — three independent bubbles */}
      <div className={styles.floatTop}>
        <button
          className={styles.logoBubble}
          style={{position:'static',transform:'none',padding:'0',width:'42px',height:'42px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all'}}
          onClick={() => window.__openDrawer?.()}>
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            <rect width="18" height="2" rx="1" fill="rgba(0,0,0,0.65)"/>
            <rect y="5" width="14" height="2" rx="1" fill="rgba(0,0,0,0.65)"/>
            <rect y="10" width="18" height="2" rx="1" fill="rgba(0,0,0,0.65)"/>
          </svg>
        </button>
        <div className={styles.logoBubble}>
          <img src="/logo-text.png" alt="Nüra" className={styles.headerLogo} />
        </div>
        <button
          className={styles.logoBubble}
          style={{position:'static',transform:'none',padding:'0',width:'42px',height:'42px',borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all'}}
          onClick={() => navigate('/profile')}>
          {user?.name
            ? <img src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name)}`} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
            : <span style={{fontSize:'16px',color:'rgba(0,0,0,0.5)'}}>?</span>
          }
        </button>
      </div>

      <div className={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id}>
            <div className={`${styles.msgRow} ${msg.from === 'user' ? styles.msgRowUser : ''}`}>
              {msg.from === 'nura' && (
                <div className={styles.nuraAvatar}>
                  <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
                </div>
              )}
              <div className={`${styles.bubble} ${msg.from === 'user' ? styles.bubbleUser : styles.bubbleNura}`}>
                {msg.text && <p>{msg.text}</p>}
                {msg.lines?.map((line, i) => <p key={i}>{formatLine(line)}</p>)}
                {msg.loading && <div className={styles.typingDots}><span /><span /><span /></div>}
              {msg.chips && (
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'8px'}}>
                  {(msg.chips||[]).map((chip,i) => (
                    <button key={i} onClick={() => {
                      if (chip === 'Buscar de nuevo' && searchHistory?.[0]?.query) {
                        handleSend(searchHistory[0].query); return
                      }
                      if (chip === 'Buscar algo diferente') {
                        setMessages([{ id: Date.now(), from: 'nura', lines: ['Cuéntame qué necesitas.'] }])
                        setTimeout(() => document.querySelector('textarea,input[type=text]')?.focus(), 100)
                        return
                      }
                      if (chip === 'Ver Explorar') { navigate('/explore'); return }
                      if (chip === 'Ver todos') { navigate('/explore'); return }
                      if (chip === 'Crear cuenta') { navigate('/login'); return }
                      if (chip.startsWith('Escribir a ') && lastMatches?.[0]) {
                        const h = lastMatches[0]
                        navigate(`/chat/${h.id}`, { state: { helper: h } })
                        return
                      }
                      handleSend(chip)
                    }}
                      style={{padding:'5px 12px',borderRadius:'100px',background:'rgba(0,0,0,0.06)',border:'none',fontSize:'12px',fontWeight:500,color:'rgba(0,0,0,0.7)',cursor:'pointer',transition:'opacity 0.15s'}}>
                      {chip}
                    </button>
                  ))}
                </div>
              )}
              {msg.quickOptions && (
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'8px'}}>
                  {(msg.quickOptions||[]).map((opt,i) => (
                    <button key={i}
                      style={{padding:'7px 14px',background:'var(--paper)',border:'1.5px solid var(--rule)',borderRadius:'16px',fontSize:'12px',color:'var(--mid)',cursor:'pointer',transition:'all 0.15s'}}
                      onClick={() => {
                        setShowSuggestions(false)
                        if (opt.includes('busca')) handleSend(searchHistory[0]?.query)
                        else setMessages(prev => [...prev, {id:Date.now(),from:'nura',lines:['Me alegra saberlo 🎉 Estoy aquí cuando lo necesites.']}])
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              </div>
            </div>
            {messages.length === 1 && msg.from === 'nura' && (
              <>
              {!user && (
              <div style={{display:'flex',gap:'20px',padding:'4px 0',flexWrap:'wrap'}}>
                {[['1.200+','profesionales verificados'],['4.8★','valoración media'],['< 1h','primer contacto']].map(([n,l]) => (
                  <div key={l} style={{textAlign:'center'}}>
                    <div style={{fontSize:'15px',fontWeight:800,color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>{n}</div>
                    <div style={{fontSize:'11px',color:'rgba(0,0,0,0.4)',fontWeight:400}}>{l}</div>
                  </div>
                ))}
              </div>
              )}

              {/* Disponibles ahora strip */}
              <div style={{width:'100%',marginTop:'12px'}}>
                <p style={{fontSize:'11px',fontWeight:700,color:'rgba(0,0,0,0.3)',
                  letterSpacing:'0.5px',textTransform:'uppercase',margin:'0 0 8px'}}>
                  Disponibles ahora
                </p>
                <div style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'2px'}}>
                  {HELPERS.filter(h=>h.available).slice(0,5).map(h=>(
                    <button key={h.id}
                      onClick={()=>navigate(`/helper/${h.id}`,{state:{helper:h}})}
                      style={{
                        flexShrink:0,display:'flex',flexDirection:'column',
                        alignItems:'center',gap:'5px',
                        background:'rgba(255,255,255,0.85)',
                        border:'1px solid rgba(255,255,255,0.5)',
                        borderRadius:'16px',padding:'10px 10px 8px',
                        cursor:'pointer',minWidth:'68px',
                        WebkitBackdropFilter:'blur(20px)',
                        backdropFilter:'blur(20px)',
                      }}>
                      {h.avatarUrl
                        ?<img src={h.avatarUrl} alt={h.name}
                            style={{width:'38px',height:'38px',borderRadius:'50%',objectFit:'cover'}}/>
                        :<div style={{width:'38px',height:'38px',borderRadius:'50%',
                            background:h.avatarColor||'#7B2FFF',color:'white',fontSize:'13px',
                            fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            {h.avatar}
                          </div>
                      }
                      <span style={{fontSize:'10px',fontWeight:700,color:'rgba(0,0,0,0.75)',
                        textAlign:'center',lineHeight:1.2,maxWidth:'62px'}}>
                        {h.name.split(' ')[0]}
                      </span>
                      <span style={{fontSize:'9px',color:'rgba(0,0,0,0.4)',
                        textAlign:'center',lineHeight:1.2,maxWidth:'62px',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {h.tags?.[0] || h.specialty?.split(' ')[0]}
                      </span>
                      <span style={{fontSize:'8px',color:'#059669',fontWeight:700,
                        background:'#ECFDF5',borderRadius:'100px',padding:'1px 5px',
                        display:'flex',alignItems:'center',gap:'2px'}}>
                        <span style={{width:'5px',height:'5px',borderRadius:'50%',
                          background:'#059669',display:'inline-block'}}/>
                        Libre
                      </span>
                    </button>
                  ))}
                  <button onClick={()=>navigate('/explore')}
                    style={{
                      flexShrink:0,display:'flex',flexDirection:'column',
                      alignItems:'center',justifyContent:'center',gap:'4px',
                      background:'rgba(123,47,255,0.05)',
                      border:'1px dashed rgba(123,47,255,0.25)',
                      borderRadius:'16px',padding:'10px 10px 8px',
                      cursor:'pointer',minWidth:'68px',
                    }}>
                    <span style={{fontSize:'18px'}}>→</span>
                    <span style={{fontSize:'9px',fontWeight:700,color:'#7B2FFF',textAlign:'center',lineHeight:1.3}}>
                      Ver todos
                    </span>
                  </button>
                </div>
              </div>
              </>
            )}
            {msg.results && (
              <HelperCarousel helpers={msg.results} />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Floating bottom — suggestions + input capsule */}
      <div className={styles.floatBottom}>
        {inputFocused && !input && searchHistory?.length > 0 && (
          <div className={styles.recentSearches}>
            <span className={styles.recentLabel}>Recientes</span>
            {searchHistory.slice(0, 3).map((s, i) => (
              <button key={i} className={styles.recentItem} onClick={() => handleSend(s.query)}>
                <Clock size={12} color='rgba(0,0,0,0.35)' style={{flexShrink:0}} />
                <span className={styles.recentText}>{s.query}</span>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && (
          <div className={styles.suggestionsWrap}>
          <div className={styles.suggestions}>
            {(suggestions||[]).map((s, i) => (
              <button key={i} className={styles.suggestion} onClick={() => handleSend(s.text)}>
                <span className={styles.suggestionText}>{s.text}</span>
              </button>
            ))}
          </div>
          </div>
        )}

        <div className={styles.inputCapsule}>
          <button className={styles.plusBtn}><Plus size={18} /></button>
          <input ref={inputRef} className={styles.input}
            placeholder="Cuéntame qué necesitas..."
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey} disabled={loading}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setTimeout(() => setInputFocused(false), 200)} />
          {input.trim()
            ? <button className={styles.sendBtn} onClick={() => handleSend()}><Send size={16} /></button>
            : <button className={`${styles.sendBtn} ${listening ? styles.micActive : styles.micBtn}`} onClick={toggleMic}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
          }
        </div>
      </div>

      {showGate && <RegisterGate reason={gateReason} onClose={() => setShowGate(false)} />}
    </div>
  )
}
