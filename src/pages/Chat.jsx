import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Shield, Star, User } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import RatingModal from '../components/RatingModal'
import styles from './Chat.module.css'

function generateFirstMessage(helper) {
  const map = {
    logopedia: `Hola ${helper.name.split(' ')[0]}, te contacto a través de Nüra. Necesito ayuda con logopedia. ¿Tienes disponibilidad esta semana?`,
    tecnico: `Hola ${helper.name.split(' ')[0]}, te contacto por Nüra. Tengo un problema urgente con la caldera. ¿Cuándo podrías venir?`,
    limpieza: `Hola ${helper.name.split(' ')[0]}, te encuentro en Nüra. Busco servicio de limpieza semanal. ¿Estarías disponible?`,
    cuidado: `Hola ${helper.name.split(' ')[0]}, te contacto por Nüra. Busco a alguien de confianza para acompañar a mi padre mayor. ¿Podríamos hablar?`,
    mascotas: `Hola ${helper.name.split(' ')[0]}, vi tu perfil en Nüra. Necesito a alguien que cuide mi perro este fin de semana. ¿Estarías disponible?`,
    matematicas: `Hola ${helper.name.split(' ')[0]}, te encuentro en Nüra. Mi hijo necesita refuerzo en matemáticas. ¿Darías clases?`,
    entrenador: `Hola ${helper.name.split(' ')[0]}, te contacto por Nüra. Me gustaría empezar a entrenar. ¿Cuándo podría ser esa primera sesión gratuita?`,
  }
  return map[helper.category] || `Hola ${helper.name.split(' ')[0]}, te contacto a través de Nüra. ¿Tienes disponibilidad?`
}

function getHelperReply(helper) {
  const map = {
    logopedia: '¡Hola! Claro, tengo disponibilidad esta semana. ¿Me cuentas más sobre las dificultades? Así te digo si es exactamente mi especialidad.',
    tecnico: 'Buenos días. Puedo pasarme hoy o mañana a primera hora. ¿Qué marca es la caldera? Así vengo preparado con el material.',
    limpieza: '¡Hola! Sí, tengo huecos libres. ¿Cuántos metros tiene la casa aproximadamente y qué días te vendrían mejor?',
    cuidado: 'Buenas, con mucho gusto. ¿Me puedes contar un poco más sobre tu familiar? ¿Tiene movilidad reducida o necesidades especiales?',
    mascotas: '¡Hola! ¿Qué raza tiene tu perro y qué necesita exactamente — paseos, cuidado en casa o ambas cosas?',
    matematicas: '¡Hola! Doy clases presenciales o por videollamada. ¿En qué curso está tu hijo y qué temas le cuestan más?',
    entrenador: '¡Hola! La primera sesión es gratuita para evaluar objetivos y estado físico. ¿Te viene bien esta semana?',
  }
  return map[helper.category] || '¡Hola! Gracias por contactarme. ¿Cuándo te vendría bien que hablemos?'
}

function formatTime(date) {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`
}

function formatDateLabel(date) {
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Hoy'
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const helper = HELPERS.find(h => h.id === parseInt(id))
  const { addChat, markRead, hasRated } = useUser()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [suggested, setSuggested] = useState('')
  const [typing, setTyping] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (helper) {
      setSuggested(generateFirstMessage(helper))
      markRead(helper.id)
    }
  }, [helper])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Show rating modal after 3 messages exchanged
  useEffect(() => {
    if (msgCount >= 3 && helper && !hasRated(helper.id)) {
      const timer = setTimeout(() => setShowRating(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [msgCount])

  if (!helper) return <div className={styles.notFound}>No encontrado</div>

  function sendMessage(text) {
    const msg = text || input
    if (!msg.trim()) return
    const newMsg = { id: Date.now(), text: msg, from: 'user', time: new Date() }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setSuggested('')

    // Save to chat history
    addChat(helper.id, helper.name, helper.avatarColor, helper.avatar, msg)

    setTyping(true)
    const delay = 1200 + Math.random() * 800
    setTimeout(() => {
      setTyping(false)
      const reply = { id: Date.now() + 1, text: getHelperReply(helper), from: 'helper', time: new Date() }
      setMessages(prev => [...prev, reply])
      setMsgCount(c => c + 1)
      addChat(helper.id, helper.name, helper.avatarColor, helper.avatar, reply.text)
    }, delay)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Group messages by date
  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1]
    const showDate = !prev || formatDateLabel(msg.time) !== formatDateLabel(prev.time)
    if (showDate) acc.push({ type: 'date', label: formatDateLabel(msg.time) })
    acc.push({ type: 'msg', msg })
    return acc
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={17} /></button>
        <div className={styles.helperInfo} onClick={() => navigate(`/helper/${helper.id}`)}>
          <div className={styles.avatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
          <div>
            <div className={styles.helperName}>{helper.name}</div>
            <div className={styles.helperStatus}>
              {typing
                ? <span className={styles.typingStatus}>escribiendo...</span>
                : <><span className={styles.onlineDot} /> Activo ahora</>}
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!hasRated(helper.id) && messages.length > 0 && (
            <button className={styles.rateBtn} onClick={() => setShowRating(true)}>
              <Star size={14} /> Valorar
            </button>
          )}
          <button className={styles.profileBtn} onClick={() => navigate(`/helper/${helper.id}`)}>
            <User size={14} />
          </button>
        </div>
      </header>

      <div className={styles.messages}>
        <div className={styles.systemNote}>
          <Shield size={11} />
          <span>Chat seguro · Datos personales solo cuando tú decides</span>
        </div>

        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <div className={styles.emptyChatAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
            <p className={styles.emptyChatName}>{helper.name}</p>
            <p className={styles.emptyChatDesc}>{helper.zone} · {helper.distance} km · {helper.price}</p>
          </div>
        )}

        {grouped.map((item, i) => {
          if (item.type === 'date') return <div key={`d${i}`} className={styles.dateLabel}>{item.label}</div>
          const { msg } = item
          return (
            <div key={msg.id} className={`${styles.msg} ${msg.from === 'user' ? styles.msgUser : styles.msgHelper}`}>
              {msg.from === 'helper' && (
                <div className={styles.msgAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
              )}
              <div className={styles.msgBubble}>
                <p>{msg.text}</p>
                <span className={styles.msgTime}>{formatTime(msg.time)}</span>
              </div>
            </div>
          )
        })}

        {typing && (
          <div className={`${styles.msg} ${styles.msgHelper}`}>
            <div className={styles.msgAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
            <div className={styles.typingBubble}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {suggested && messages.length === 0 && (
        <div className={styles.suggestionBar}>
          <div className={styles.suggestionLabel}>💡 Nüra sugiere</div>
          <button className={styles.suggestionText} onClick={() => sendMessage(suggested)}>
            {suggested}
          </button>
        </div>
      )}

      <div className={styles.inputBar}>
        <input className={styles.input}
          placeholder={`Escribe a ${helper.name.split(' ')[0]}...`}
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
        <button className={styles.sendBtn} onClick={() => sendMessage()} disabled={!input.trim()}>
          <Send size={16} />
        </button>
      </div>

      {showRating && <RatingModal helper={helper} onClose={() => setShowRating(false)} />}
    </div>
  )
}
