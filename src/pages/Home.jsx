import { useState, useEffect, useRef } from 'react'
import { MenuButton } from '../components/NavBar'
import { useNavigate } from 'react-router-dom'
import { Send, Mic, MicOff, Plus, Star, MapPin, Shield, MessageCircle } from 'lucide-react'
import { analyzeNeed, matchHelpers } from '../utils/matching'
import { useUser } from '../context/UserContext'

import styles from './Home.module.css'
import Onboarding from '../components/Onboarding'

function getWelcome(user) {
  if (!user) return [
    `Hola, soy **Nüra** ✨`,
    `¿Qué **grad:necesitas** hoy? Cuéntamelo con tus palabras.`,
  ]
  if (user.isHelper) return [
    `Hola **${user.name?.split(' ')[0]}** 👋`,
    `¿Qué quieres **grad:hacer** hoy? Puedo buscarte clientes, actualizar tu perfil o lo que necesites.`,
  ]
  return [
    `Hola **${user.name?.split(' ')[0]}** 👋`,
    `¿En qué puedo **grad:ayudarte** hoy?`,
  ]
}

function detectIntent(text, user) {
  const t = text.toLowerCase()
  if (user?.isHelper && (t.includes('aprendido') || t.includes('certificado') || t.includes('curso') || t.includes('estudié') || t.includes('trabajé')))
    return 'update_profile'
  if (t.includes('empresa') || t.includes('contratar') || t.includes('empleado') || t.includes('trabajó'))
    return 'b2b'
  if (user?.isHelper && (t.includes('cliente') || t.includes('ofrecer') || t.includes('disponible')))
    return 'helper_visibility'
  return 'search'
}

const SUGGESTIONS = {
  default: [
    { icon: '🗣️', text: 'Necesito un logopeda para mi hijo' },
    { icon: '✍️', text: 'Busco cuidadora para mi padre mayor' },
    { icon: '🔧', text: 'Técnico de calderas urgente' },
  ],
  helper: [
    { icon: '✍️', text: 'Acabo de obtener una certificación nueva' },
    { icon: '🌐', text: 'He trabajado en un nuevo sitio este mes' },
    { icon: '🖼️', text: 'Quiero actualizar mi disponibilidad' },
  ],
}


function ResultCard({ helper, onNavigate }) {
  return (
    <div className={styles.resultCard} onClick={() => onNavigate(`/helper/${helper.id}`)}>
      <div className={styles.resultAvatar}>
        {helper.avatarUrl
          ? <img src={helper.avatarUrl} alt={helper.name} className={styles.resultAvatarImg} />
          : <div className={styles.resultAvatarFallback} style={{background: helper.avatarColor}}>{helper.avatar}</div>
        }
      </div>
      <div className={styles.resultInfo}>
        <div className={styles.resultName}>{helper.name}</div>
        <div className={styles.resultSpec}>{helper.specialty}</div>
        <div className={styles.resultMeta}>
          <span><Star size={10} fill="#F59E0B" color="#F59E0B" /> {helper.rating}</span>
          <span>·</span>
          <span><MapPin size={10} /> {helper.zone}</span>
          {helper.dniVerified && <><span>·</span><Shield size={10} color="#059669" /></>}
        </div>
      </div>
      <button className={styles.resultContact}
        onClick={e => { e.stopPropagation(); onNavigate(`/chat/${helper.id}`) }}>
        <MessageCircle size={14} />
      </button>
    </div>
  )
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

  useEffect(() => {
    const lines = getWelcome(user)
    setTimeout(() => {
      setMessages([{ id: 1, from: 'nura', lines }])
    }, 300)
  }, [user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function formatLine(line) {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        if (part.startsWith('grad:')) {
          return <span key={i} className={styles.gradText}>{part.slice(5)}</span>
        }
        return <strong key={i}>{part}</strong>
      }
      return part
    })
  }

  async function handleSend(text) {
    const msg = text || input
    if (!msg.trim() || loading) return

    setInput('')
    setShowSuggestions(false)
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: msg }])
    setLoading(true)

    const intent = detectIntent(msg, user)

    if (intent === 'update_profile') {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['He actualizado tu perfil con esta información. Nüra lo analizará y añadirá las habilidades relevantes automáticamente.'] }])
        setLoading(false)
      }, 1200)
      return
    }
    if (intent === 'b2b') {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['El acceso empresarial está disponible en Fase 3 de Nüra. Si quieres verificar que alguien ha trabajado contigo, cuéntame su nombre y qué quieres que conste.'] }])
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
      setMessages(prev => [...prev, { id: Date.now() + 0.5, from: 'nura', lines: ['Buscando en la red de helpers...'], loading: true }])
      const analysis = await analyzeNeed(msg)
      const matches = await matchHelpers(analysis)
      setMessages(prev => prev.filter(m => !m.loading))
      if (!matches?.length) {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['No encontré a nadie disponible ahora mismo. Prueba a describirlo de otra forma.'] }])
        setLoading(false)
        return
      }
      addSearch?.(msg)
      setSearchState({ query: msg, analysis, matches })
      setMessages(prev => [...prev, {
        id: Date.now(), from: 'nura',
        lines: [`He encontrado **${matches.length} personas** que pueden ayudarte.`],
        results: matches.slice(0, 4)
      }])
    } catch {
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

  const suggestions = user?.isHelper ? SUGGESTIONS.helper : SUGGESTIONS.default

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <MenuButton />
        <div className={styles.headerLogoPill}><img src="/logo-text.png" alt="Nüra" className={styles.headerLogo} /></div>
        <button className={styles.profileBtn} onClick={() => navigate('/profile')}>
          {user?.name
            ? <img src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name)}`}
                alt={user.name}
                style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
            : '?'
          }
        </button>
      </div>

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
                <p key={i}>{formatLine(line)}</p>
              ))}
              {msg.loading && (
                <div className={styles.typingDots}>
                  <span /><span /><span />
                </div>
              )}
              {msg.results && (
                <div className={styles.resultsList}>
                  {msg.results.map(h => (
                    <ResultCard key={h.id} helper={h} onNavigate={navigate} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — ChatGPT style with icon + text */}
      {showSuggestions && (
        <div className={styles.suggestions}>
          {suggestions.map((s, i) => (
            <button key={i} className={styles.suggestion} onClick={() => handleSend(s.text)}>
              <span className={styles.suggestionIcon}>{s.icon}</span>
              <span className={styles.suggestionText}>{s.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input bar — ChatGPT style */}
      <div className={styles.inputWrap}>
        <div className={styles.inputBar}>
          <button className={styles.plusBtn}><Plus size={18} /></button>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Escribe a Nüra..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          {input.trim()
            ? <button className={styles.sendBtn} onClick={() => handleSend()}>
                <Send size={16} />
              </button>
            : <button className={`${styles.sendBtn} ${listening ? styles.micActive : styles.micBtn}`} onClick={toggleMic}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
          }
        </div>
      </div>

      <Onboarding />
    </div>
  )
}
