import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Shield } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './RegisterHelper.module.css'

// ── Nüra AI conversation engine ───────────────────────────────────────────────
const CONVERSATION = [
  {
    id: 'intro',
    nura: `Hola, soy Nüra. Voy a ayudarte a crear tu perfil de helper en unos minutos.\n\nNo hay formularios ni categorías. Cuéntame tú, con tus propias palabras: **¿en qué puedes ayudar a otras personas?**`,
    extract: (text) => ({ bio: text }),
    next: 'location',
  },
  {
    id: 'location',
    nura: (prev) => `Interesante. Veo que puedes ayudar con eso.\n\n¿Dónde estás disponible? ¿En qué zona de Barcelona operas?`,
    extract: (text) => ({ zone: text }),
    next: 'modality',
  },
  {
    id: 'modality',
    nura: (prev) => `Perfecto.\n\n¿Cómo prefieres trabajar? ¿Presencialmente, de forma online, o ambas?`,
    extract: (text) => {
      const t = text.toLowerCase()
      return {
        presential: t.includes('presencial') || t.includes('ambas') || t.includes('dos') || t.includes('sí') || (!t.includes('online') && !t.includes('remoto')),
        online: t.includes('online') || t.includes('ambas') || t.includes('dos') || t.includes('remoto') || t.includes('videollamada'),
      }
    },
    next: 'experience',
  },
  {
    id: 'experience',
    nura: () => `¿Cuánto tiempo llevas haciendo esto? ¿Tienes formación académica, experiencia laboral, o es algo que has aprendido por tu cuenta?`,
    extract: (text) => ({ experience: text }),
    next: 'price',
  },
  {
    id: 'price',
    nura: () => `Muy bien. ¿Tienes alguna idea de lo que cobrarías? Puede ser por hora, por sesión, por día... o si prefieres no indicarlo y hablarlo directamente con cada persona, también está bien.`,
    extract: (text) => {
      const t = text.toLowerCase()
      if (t.includes('no') || t.includes('hablar') || t.includes('consul') || t.includes('negociar')) return { price: 'Consultar' }
      const match = text.match(/\d+/)
      return { price: match ? `${match[0]}€` : text }
    },
    next: 'availability',
  },
  {
    id: 'availability',
    nura: () => `¿Cuándo estás disponible normalmente? ¿Hay días u horas que prefieras?`,
    extract: (text) => ({ availability: text }),
    next: 'special',
  },
  {
    id: 'special',
    nura: () => `Una última cosa: ¿hay algo especial sobre ti o tu forma de trabajar que quieras que sepan las personas antes de contactarte? Algo que te diferencie, una historia, una forma de hacer las cosas...`,
    extract: (text) => ({ special: text }),
    next: 'done',
  },
]

function buildProfile(answers) {
  // Nüra analyzes the free-text answers to build a structured profile
  const bio = answers.bio || ''
  const fullText = Object.values(answers).join(' ').toLowerCase()

  // Detect category from natural language
  const categories = {
    logopedia: ['logopeda','logopedia','habla','lenguaje','tartamudez','voz'],
    tecnico: ['fontanero','electricista','caldera','técnico','reparar','mecánico','carpintero','albañil','pintor'],
    limpieza: ['limpiar','limpieza','hogar','fregar','planchar','ordenar'],
    cuidado: ['cuidar','cuidadora','mayor','anciano','niños','bebé','alzheimer','dependencia','enfermera'],
    mascotas: ['perro','gato','mascota','pasear','animales','adiestramiento'],
    matematicas: ['clases','profesor','enseñar','inglés','matemáticas','música','piano','idioma','programación'],
    entrenador: ['entrenador','deporte','yoga','pilates','fitness','correr','gym'],
  }

  let detectedCategory = 'otro'
  let maxScore = 0
  for (const [cat, keywords] of Object.entries(categories)) {
    const score = keywords.filter(k => fullText.includes(k)).length
    if (score > maxScore) { maxScore = score; detectedCategory = cat }
  }

  // Extract skills from bio (nouns and key phrases)
  const skillPatterns = ['años de experiencia', 'especializ', 'certific', 'titulad', 'formad', 'trabaj']
  const detectedSkills = []
  if (bio.length > 20) {
    const words = bio.split(/[\s,\.]+/).filter(w => w.length > 4)
    detectedSkills.push(...words.slice(0, 5).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
  }

  return {
    category: detectedCategory,
    detectedSkills: detectedSkills.filter(Boolean),
    presential: answers.presential !== false,
    online: answers.online || false,
    price: answers.price || 'Consultar',
    zone: answers.zone || 'Barcelona',
  }
}

function TypingIndicator() {
  return (
    <div className={styles.typingWrap}>
      <div className={styles.nuraAvatar}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
      </div>
      <div className={styles.typingBubble}>
        <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
      </div>
    </div>
  )
}

function formatBold(text) {
  // Convert **text** to bold spans
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

export default function RegisterHelper() {
  const navigate = useNavigate()
  const { user, login } = useUser()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [typing, setTyping] = useState(false)
  const [done, setDone] = useState(false)
  const [profile, setProfile] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Start conversation
    setTimeout(() => {
      const first = CONVERSATION[0]
      const text = typeof first.nura === 'function' ? first.nura({}) : first.nura
      setMessages([{ from: 'nura', text, id: Date.now() }])
    }, 600)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function sendMessage() {
    if (!input.trim() || typing || done) return
    const userMsg = { from: 'user', text: input, id: Date.now() }
    const currentStep = CONVERSATION[step]
    const newAnswers = { ...answers, ...currentStep.extract(input) }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setAnswers(newAnswers)
    setTyping(true)

    const delay = 800 + input.length * 12
    setTimeout(() => {
      setTyping(false)

      if (currentStep.next === 'done') {
        // Build profile and show summary
        const builtProfile = buildProfile(newAnswers)
        setProfile(builtProfile)
        setDone(true)

        const summary = `¡Perfecto! Ya tengo todo lo que necesito para crear tu perfil.\n\nHe detectado que ofreces servicios de **${builtProfile.category !== 'otro' ? builtProfile.category : 'ayuda especializada'}**, en **${newAnswers.zone || 'Barcelona'}**, y que estás disponible de forma **${builtProfile.presential ? 'presencial' : ''}${builtProfile.presential && builtProfile.online ? ' y ' : ''}${builtProfile.online ? 'online' : ''}**.\n\nNüra seguirá aprendiendo de cada servicio que completes para enriquecer tu perfil automáticamente. Bienvenido a Nüra.`
        setMessages(prev => [...prev, { from: 'nura', text: summary, id: Date.now() }])
      } else {
        const nextIndex = CONVERSATION.findIndex(c => c.id === currentStep.next)
        if (nextIndex !== -1) {
          setStep(nextIndex)
          const nextStep = CONVERSATION[nextIndex]
          const nuraText = typeof nextStep.nura === 'function' ? nextStep.nura(newAnswers) : nextStep.nura
          setMessages(prev => [...prev, { from: 'nura', text: nuraText, id: Date.now() }])
        }
      }
    }, delay)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function finish() {
    const helperData = {
      ...user,
      isHelper: true,
      helperProfile: { ...answers, ...profile },
      helperSince: new Date().toISOString(),
    }
    login(helperData)
    navigate('/profile')
  }

  const currentConv = CONVERSATION[step]
  const progress = done ? 100 : Math.round((step / CONVERSATION.length) * 100)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <div className={styles.headerCenter}>
          <img src="/logo-text.png" alt="Nüra" className={styles.logoText} />
          <span className={styles.headerSub}>Crear perfil de helper</span>
        </div>
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Intro banner */}
      <div className={styles.introBanner}>
        <Shield size={13} color="var(--purple)" />
        <span>Nüra crea tu perfil a través de una conversación. Sin formularios.</span>
      </div>

      <div className={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.msgWrap} ${msg.from === 'user' ? styles.msgUser : styles.msgNura}`}>
            {msg.from === 'nura' && (
              <div className={styles.nuraAvatar}>
                <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
              </div>
            )}
            <div className={`${styles.bubble} ${msg.from === 'user' ? styles.bubbleUser : styles.bubbleNura}`}>
              {msg.text.split('\n').map((line, i) => (
                <p key={i} className={styles.bubbleLine}>{formatBold(line)}</p>
              ))}
            </div>
          </div>
        ))}

        {typing && (
          <div className={styles.msgWrap}>
            <div className={styles.nuraAvatar}>
              <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
            </div>
            <div className={styles.typingBubble}>
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {done ? (
        <div className={styles.doneBar}>
          <button className={styles.doneBtn} onClick={finish}>
            Ver mi perfil →
          </button>
        </div>
      ) : (
        <div className={styles.inputBar}>
          <input ref={inputRef} className={styles.input}
            placeholder="Escribe tu respuesta..."
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey} disabled={typing} />
          <button className={styles.sendBtn} onClick={sendMessage} disabled={!input.trim() || typing}>
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
