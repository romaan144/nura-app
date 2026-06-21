import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Plus, Mic, MicOff } from 'lucide-react'
import { useUser } from '../context/UserContext'
import s from '../components/conversation/conversation.module.css'

const SUPABASE_URL = 'https://oxmohciswebonoumghhu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bW9oY2lzd2Vib25vdW1naGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzE4MTUsImV4cCI6MjA2NTIwNzgxNX0.oJQLSV5UEGjV3f6sPnHJT3nOVHXyaQJGzHKVDQkWCHo'

async function saveHelperToSupabase(answers) {
  try {
    const { analyzeNeed } = await import('../utils/matching')
    const specialtyAnalysis = analyzeNeed(answers.specialty || '')
    const inferredCategory = specialtyAnalysis.categoria !== 'otro'
      ? specialtyAnalysis.categoria : 'otro'

    const payload = {
      name: answers.name || 'Profesional',
      specialty: answers.specialty || '',
      bio: `${answers.experience || ''}. ${answers.differentiator || ''}`.trim().replace(/^\. /, ''),
      zone: answers.zone || 'Barcelona',
      city: 'Barcelona',
      price: answers.price || null,
      category: inferredCategory,
      presential: (answers.modality || '').toLowerCase().includes('presencial') || true,
      online: (answers.modality || '').toLowerCase().includes('online'),
      available: true, verified: false, dni_verified: false, founder: false,
      rating: 0, reviews: 0, services: 0,
      response_time: '< 2 horas', completion_rate: 100,
      qualification_level: 'experienced',
      tags: [answers.specialty || ''].filter(Boolean),
      ai_data: { formation: answers.formation, self_registered: true, registered_at: new Date().toISOString() }
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/helpers`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json', 'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    return data?.[0] || null
  } catch (e) { console.warn('Supabase save failed:', e); return null }
}

const QUESTIONS = [
  { id: 'name',           text: 'Hola, vamos a crear tu perfil profesional. ¿Cómo te llamas?',          placeholder: 'Tu nombre completo' },
  { id: 'specialty',      text: 'Encantada, {name}. ¿Cuál es tu especialidad principal?',               placeholder: 'Ej: logopeda, cuidadora, técnico de calderas...' },
  { id: 'formation',      text: '¿Qué formación o certificaciones tienes?',                             placeholder: 'Ej: Grado en Logopedia, FP Atención Sociosanitaria...' },
  { id: 'zone',           text: '¿En qué zona de Barcelona trabajas? ¿Te desplazas?',                   placeholder: 'Ej: Gràcia y alrededores, toda Barcelona' },
  { id: 'price',          text: '¿Cuál es tu tarifa? Cuanto más claro, más confianza genera.',          placeholder: 'Ej: 50€/sesión de 45 min, 15€/hora' },
  { id: 'differentiator', text: 'Última pregunta: ¿qué te diferencia de otros profesionales?',          placeholder: 'Lo que te hace único — en una o dos frases' },
]

export default function RegisterHelper() {
  const navigate = useNavigate()
  const { login } = useUser()
  const [messages, setMessages]   = useState([{ id: 1, from: 'nura', text: QUESTIONS[0].text }])
  const [input, setInput]         = useState('')
  const [qIdx, setQIdx]           = useState(0)
  const [answers, setAnswers]     = useState({})
  const [typing, setTyping]       = useState(false)
  const [listening, setListening] = useState(false)
  const [done, setDone]           = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (!done) inputRef.current?.focus()
  }, [messages, typing])

  function sendMessage() {
    const val = input.trim()
    if (!val || typing) return
    setInput('')
    const q = QUESTIONS[qIdx]
    const newAnswers = { ...answers, [q.id]: val }
    setAnswers(newAnswers)
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: val }])
    const next = qIdx + 1
    if (next < QUESTIONS.length) {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        const text = QUESTIONS[next].text.replace('{name}', newAnswers.name || val)
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', text }])
        setQIdx(next)
      }, 800)
    } else {
      setTyping(true)
      setTimeout(() => {
        setTyping(false); setDone(true)
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
          text: `Perfecto, ${newAnswers.name || val}. Tu perfil está listo. Se irá completando automáticamente con cada interacción. ¡Ya formas parte de la red!`
        }])
        setTimeout(() => setMessages(prev => [...prev, { id: Date.now()+1, from: 'nura',
          text: `Cada valoración que recibas fortalecerá tu reputación. ¡Mucha suerte!`
        }]), 1800)
        saveHelperToSupabase(newAnswers)
        login({ name: newAnswers.name || val, isHelper: true, helperProfile: newAnswers })
        sessionStorage.setItem('nura_helper_registered', '1')
        setTimeout(() => navigate('/'), 3000)
      }, 1000)
    }
  }

  function toggleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'es-ES'
    rec.onresult = e => { setInput(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend   = () => setListening(false)
    rec.start(); setListening(true)
  }

  const currentQ = QUESTIONS[qIdx]
  const progress = (qIdx / QUESTIONS.length) * 100

  return (
    <div className={s.page}>

      {/* ── HEADER — idéntico a Home salvo el subtítulo ── */}
      <div className={s.floatTop}>
        <button className={s.headerCircle} onClick={() => navigate(-1)}>
          <ArrowLeft size={17} />
        </button>

        <div className={s.headerPill}>
          <img src="/logo-text.png" alt="Nüra" className={s.headerLogo} />
          <span className={s.headerDivider} />
          <span className={s.headerSubtitle}>Perfil profesional</span>
        </div>

        {/* Spacer — mismo ancho que el círculo izquierdo para centrar la pastilla */}
        <div style={{ width: 42, flexShrink: 0 }} />
      </div>

      {/* Progress bar — debajo del header */}
      <div style={{
        position: 'absolute', top: 'calc(max(env(safe-area-inset-top,0px),12px) + 54px)',
        left: 14, right: 14, height: 2,
        background: 'rgba(0,0,0,0.07)', borderRadius: 2, zIndex: 29, overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'var(--grad-main)', borderRadius: 2,
          transition: 'width 0.4s ease'
        }} />
      </div>

      {/* ── MESSAGES ── */}
      <div className={s.messages}>
        {messages.map(m => (
          <div key={m.id} className={`${s.msgRow} ${m.from === 'user' ? s.msgRowUser : ''}`}>
            {m.from === 'nura' && (
              <div className={s.nuraAvatar}>
                <img src="/logo-iso.png" alt="Nüra" className={s.nuraAvatarImg} />
              </div>
            )}
            <div className={`${s.bubble} ${m.from === 'user' ? s.bubbleUser : s.bubbleNura}`}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className={s.msgRow}>
            <div className={s.nuraAvatar}>
              <img src="/logo-iso.png" alt="Nüra" className={s.nuraAvatarImg} />
            </div>
            <div className={`${s.bubble} ${s.bubbleNura}`}>
              <div className={s.typingDots}><span/><span/><span/></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT — idéntico a Home ── */}
      {!done && (
        <div className={s.floatBottom}>
          <div className={s.inputCapsule}>
            <button className={s.plusBtn}><Plus size={18} /></button>
            <input
              ref={inputRef}
              className={s.input}
              placeholder={currentQ?.placeholder || 'Escribe tu respuesta...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={typing}
            />
            {input.trim()
              ? <button className={s.sendBtn} onClick={sendMessage} disabled={!input.trim() || typing}>
                  <Send size={16} />
                </button>
              : <button className={`${s.sendBtn} ${listening ? s.micActive : s.micBtn}`} onClick={toggleMic}>
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
            }
          </div>
        </div>
      )}

    </div>
  )
}
