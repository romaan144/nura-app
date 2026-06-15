import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './RegisterHelper.module.css'

const QUESTIONS = [
  { id: 'name',          text: '¡Hola! Soy Nüra y voy a construir tu perfil profesional. ¿Cómo te llamas?', placeholder: 'Tu nombre completo' },
  { id: 'specialty',     text: 'Encantada, {name}. ¿Cuál es tu especialidad principal?', placeholder: 'Ej: logopeda, cuidadora, técnico de calderas...' },
  { id: 'formation',     text: '¿Qué formación tienes? Buscaré tus estudios para verificarlos.', placeholder: 'Ej: Grado en Logopedia, FP Atención Sociosanitaria...' },
  { id: 'experience',    text: '¿Cuántos años llevas trabajando en esto? ¿En qué contextos?', placeholder: 'Ej: 5 años, clínica privada y domicilio' },
  { id: 'zone',          text: '¿En qué zona trabajas? ¿Te desplazas?', placeholder: 'Ej: Gràcia y alrededores, toda Barcelona' },
  { id: 'price',         text: '¿Cuál es tu tarifa? Sé específico: por hora, sesión, día...', placeholder: 'Ej: 50€/sesión de 45 min, 15€/hora' },
  { id: 'availability',  text: '¿Cuándo estás disponible? ¿Haces urgencias?', placeholder: 'Ej: Lunes a viernes tardes, urgencias si puedo' },
  { id: 'modality',      text: '¿Trabajas de forma presencial, online o ambas?', placeholder: 'Ej: Presencial en domicilio, también videollamada' },
  { id: 'differentiator',text: 'Última: ¿qué te hace diferente a otros profesionales?', placeholder: 'Lo que te hace único' },
]

export default function RegisterHelper() {
  const navigate = useNavigate()
  const { login } = useUser()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [typing, setTyping] = useState(false)
  const [done, setDone] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => {
      setMessages([{ id: 1, from: 'nura', text: QUESTIONS[0].text }])
    }, 400)
  }, [])

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
        const nextQ = QUESTIONS[next]
        const text = nextQ.text.replace('{name}', newAnswers.name || val)
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', text }])
        setQIdx(next)
      }, 800)
    } else {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setDone(true)
        setMessages(prev => [...prev, {
          id: Date.now(), from: 'nura',
          text: `Perfecto, ${newAnswers.name || val}. He construido tu perfil. Nüra lo verificará en las próximas horas. ¡Bienvenido a la red!`
        }])
        login({ name: newAnswers.name || val, isHelper: true, helperProfile: newAnswers })
        setTimeout(() => navigate('/'), 2000)
      }, 1000)
    }
  }

  const currentQ = QUESTIONS[qIdx]

  return (
    <div className={styles.page}>
      {/* Floating header */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={17} /></button>
        <div className={styles.logoPill}>
          <img src="/logo-text.png" alt="Nüra" className={styles.logo} />
        </div>
        <div className={styles.progress}>
          <div className={styles.progressFill} style={{width:`${((qIdx) / QUESTIONS.length) * 100}%`}} />
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map(m => (
          <div key={m.id} className={`${styles.msgRow} ${m.from === 'user' ? styles.msgRowUser : ''}`}>
            {m.from === 'nura' && (
              <div className={styles.nuraAvatar}>
                <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
              </div>
            )}
            <div className={`${styles.bubble} ${m.from === 'user' ? styles.bubbleUser : styles.bubbleNura}`}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className={styles.msgRow}>
            <div className={styles.nuraAvatar}>
              <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
            </div>
            <div className={styles.bubbleNura}>
              <div className={styles.typingDots}><span/><span/><span/></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Floating input */}
      {!done && (
        <div className={styles.inputWrap}>
          <div className={styles.inputBar}>
            <input ref={inputRef} className={styles.input}
              placeholder={currentQ?.placeholder || 'Escribe tu respuesta...'}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={typing} />
            <button className={styles.sendBtn} onClick={sendMessage} disabled={!input.trim() || typing}>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
