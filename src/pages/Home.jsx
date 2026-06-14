import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Mic, MicOff, ArrowRight } from 'lucide-react'
import { analyzeNeed, matchHelpers } from '../utils/matching'
import { MenuButton } from '../components/NavBar'
import { useUser } from '../context/UserContext'
import styles from './Home.module.css'
import Onboarding from '../components/Onboarding'

// Nüra's opening message adapts to who you are
function getWelcome(user) {
  if (!user) return [
    `Hola, soy **Nüra**.`,
    `Cuéntame qué necesitas o en qué puedes ayudar. Puedo encontrarte a alguien, actualizar tu perfil o conectarte con una empresa. Habla con naturalidad.`,
  ]
  if (user.isHelper) return [
    `Hola ${user.name?.split(' ')[0] || ''} 👋`,
    `¿Qué quieres hacer hoy? Puedo ayudarte a encontrar nuevos clientes, actualizar tu perfil con algo nuevo que hayas aprendido, o responder cualquier duda sobre tus servicios.`,
  ]
  return [
    `Hola ${user.name?.split(' ')[0] || ''} 👋`,
    `¿En qué puedo ayudarte hoy? Cuéntamelo con tus palabras.`,
  ]
}

// Detect intent from message
function detectIntent(text, user) {
  const t = text.toLowerCase()
  const isHelper = user?.isHelper

  if (isHelper && (t.includes('aprendido') || t.includes('certificado') || t.includes('curso') || t.includes('formación') || t.includes('estudié') || t.includes('trabajé')))
    return 'update_profile'
  if (t.includes('empresa') || t.includes('contratar') || t.includes('b2b') || t.includes('empleado') || t.includes('trabajó'))
    return 'b2b'
  if (isHelper && (t.includes('cliente') || t.includes('ayudar') || t.includes('ofrecer') || t.includes('disponible')))
    return 'helper_visibility'
  return 'search'
}

const SUGGESTIONS = {
  default: ['Necesito un logopeda para mi hijo', 'Busco cuidadora para mi padre', 'Quiero un técnico de calderas urgente', 'Clases de matemáticas en casa'],
  helper: ['Acabo de obtener una certificación nueva', 'He trabajado en un sitio nuevo este mes', 'Quiero aparecer en más búsquedas', 'Tengo disponibilidad esta semana'],
}

export default function Home({ setSearchState }) {
  const navigate = useNavigate()
  const { user, addSearch } = useUser()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Init with Nüra's welcome
  useEffect(() => {
    const lines = getWelcome(user)
    setTimeout(() => {
      setMessages([{ id: 1, from: 'nura', lines }])
    }, 300)
  }, [user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(text) {
    const msg = text || input
    if (!msg.trim() || loading) return

    setInput('')
    setShowSuggestions(false)
    const userMsg = { id: Date.now(), from: 'user', text: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const intent = detectIntent(msg, user)

    // Nüra responds differently based on intent
    if (intent === 'update_profile') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now(), from: 'nura',
          lines: [
            `Perfecto. He actualizado tu perfil con esta información.`,
            `Nüra analizará el contexto y añadirá las habilidades y experiencia relevantes automáticamente. Tu perfil ya refleja esto.`,
          ]
        }])
        setLoading(false)
      }, 1200)
      return
    }

    if (intent === 'b2b') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now(), from: 'nura',
          lines: [
            `Entendido. El acceso empresarial a perfiles verificados está disponible en Fase 3 de Nüra.`,
            `Si quieres añadir una verificación al perfil de alguien que ha trabajado contigo, escríbeme el nombre y qué quieres que conste.`,
          ]
        }])
        setLoading(false)
      }, 1000)
      return
    }

    if (intent === 'helper_visibility') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now(), from: 'nura',
          lines: [
            `Tu perfil está activo y apareces en las búsquedas de tu zona.`,
            `¿Quieres actualizar tu disponibilidad, tu zona de trabajo o añadir algo nuevo a tu perfil?`,
          ]
        }])
        setLoading(false)
      }, 1000)
      return
    }

    // Search intent — the main flow
    try {
      // Nüra confirms she understood
      setMessages(prev => [...prev, {
        id: Date.now() + 0.5, from: 'nura',
        lines: [`Entendido. Buscando en la red de helpers de Barcelona...`],
        loading: true
      }])

      const analysis = await analyzeNeed(msg)
      const matches = await matchHelpers(analysis)

      setMessages(prev => prev.filter(m => !m.loading))

      if (!matches || matches.length === 0) {
        setMessages(prev => [...prev, {
          id: Date.now(), from: 'nura',
          lines: [`No encontré a nadie disponible para esto ahora mismo. Prueba a describírmelo de otra forma o amplía la zona.`]
        }])
        setLoading(false)
        return
      }

      addSearch?.(msg)
      setSearchState({ query: msg, analysis, matches })

      setMessages(prev => [...prev, {
        id: Date.now(), from: 'nura',
        lines: [`He encontrado **${matches.length} personas** que pueden ayudarte. Aquí están los perfiles más compatibles.`],
        action: { label: 'Ver resultados', onClick: () => navigate('/results') }
      }])
    } catch(e) {
      setMessages(prev => prev.filter(m => !m.loading))
      setMessages(prev => [...prev, {
        id: Date.now(), from: 'nura',
        lines: [`Algo fue mal. Inténtalo de nuevo.`]
      }])
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

  const suggestions = user?.isHelper ? SUGGESTIONS.helper : SUGGESTIONS.default

  function formatLine(line) {
    // Bold **text**
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <MenuButton />
        <img src="/logo-text.png" alt="Nüra" className={styles.logoText} />
        <span className={styles.location}>📍 Barcelona</span>
      </header>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.msgRow} ${msg.from === 'user' ? styles.msgRowUser : ''}`}>
            {msg.from === 'nura' && (
              <div className={styles.nuraAvatar}>
                <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
              </div>
            )}
            <div className={`${styles.bubble} ${msg.from === 'user' ? styles.bubbleUser : styles.bubbleNura}`}>
              {msg.text && <p>{msg.text}</p>}
              {msg.lines?.map((line, i) => (
                <p key={i} className={i === 0 && msg.lines.length > 1 ? styles.bubbleFirst : ''}>
                  {formatLine(line)}
                </p>
              ))}
              {msg.loading && (
                <div className={styles.typingDots}>
                  <span /><span /><span />
                </div>
              )}
              {msg.action && (
                <button className={styles.bubbleAction} onClick={msg.action.onClick}>
                  {msg.action.label} <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className={styles.suggestions}>
          {suggestions.map((s, i) => (
            <button key={i} className={styles.suggestion} onClick={() => handleSend(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={styles.inputBar}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Escribe a Nüra..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button className={`${styles.micBtn} ${listening ? styles.micActive : ''}`} onClick={toggleMic}>
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <button className={styles.sendBtn} onClick={() => handleSend()} disabled={!input.trim() || loading}>
          <Send size={16} />
        </button>
      </div>

      <Onboarding />
    </div>
  )
}
