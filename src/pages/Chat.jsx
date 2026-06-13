import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Shield, Star, User, MapPin } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import RatingModal from '../components/RatingModal'
import styles from './Chat.module.css'

function generateFirstMessage(helper) {
  const map = {
    logopedia: `Hola ${helper.name.split(' ')[0]}, te contacto a través de Nüra. Necesito ayuda con logopedia. ¿Tienes disponibilidad esta semana?`,
    tecnico: `Hola ${helper.name.split(' ')[0]}, te contacto por Nüra. Tengo un problema con la caldera. ¿Cuándo podrías venir?`,
    limpieza: `Hola ${helper.name.split(' ')[0]}, te encuentro en Nüra. Busco servicio de limpieza semanal. ¿Estarías disponible?`,
    cuidado: `Hola ${helper.name.split(' ')[0]}, te contacto por Nüra. Busco a alguien de confianza para acompañar a mi padre mayor. ¿Podríamos hablar?`,
    mascotas: `Hola ${helper.name.split(' ')[0]}, vi tu perfil en Nüra. Necesito a alguien que cuide mi perro este fin de semana. ¿Estarías disponible?`,
    matematicas: `Hola ${helper.name.split(' ')[0]}, te encuentro en Nüra. Mi hijo necesita refuerzo en matemáticas. ¿Darías clases?`,
    entrenador: `Hola ${helper.name.split(' ')[0]}, te contacto por Nüra. Me gustaría empezar a entrenar. ¿Cuándo podría ser esa primera sesión gratuita?`,
  }
  return map[helper.category] || `Hola ${helper.name.split(' ')[0]}, te contacto a través de Nüra. ¿Tienes disponibilidad?`
}

function getHelperReply(helper, msgCount) {
  const replies = {
    logopedia: [
      '¡Hola! Claro, tengo disponibilidad esta semana. ¿Me cuentas más sobre el caso? Así te digo si es mi especialidad.',
      'Perfecto, ¿cuántos años tiene? Así puedo orientarte mejor sobre el enfoque terapéutico más adecuado.',
      'Podemos quedar para una primera sesión de evaluación gratuita esta semana si te viene bien.',
    ],
    tecnico: [
      'Buenos días. Puedo pasarme hoy o mañana a primera hora. ¿Qué marca es la caldera? Así vengo preparado.',
      'Entendido. ¿Cuándo fue la última revisión? Eso me ayuda a saber si es un problema puntual o de mantenimiento.',
      'Perfecto, te confirmo hora en breve. El desplazamiento no tiene coste adicional.',
    ],
    limpieza: [
      '¡Hola! Sí, tengo huecos. ¿Cuántos metros tiene la casa y qué días te vendrían mejor?',
      'Trabajo con productos ecológicos, sin coste adicional. ¿Incluiría también el planchado?',
      'Puedo empezar esta misma semana si quieres. ¿Te viene bien el jueves?',
    ],
    cuidado: [
      'Buenas, con mucho gusto. ¿Me puedes contar un poco más sobre tu familiar? ¿Movilidad, medicación?',
      'Tengo experiencia específica con Alzheimer y Parkinson. ¿Cuántas horas al día necesitarías?',
      'Podríamos quedar primero para conocernos y que tu padre también se sienta cómodo. ¿Te parece?',
    ],
    mascotas: [
      '¡Hola! ¿Qué raza y tamaño tiene tu perro? ¿Necesita paseos o cuidado en casa durante el fin de semana?',
      'Tengo jardín en casa, así que los perros están muy cómodos. ¿Tiene alguna necesidad especial?',
      'Mando fotos cada pocas horas para que estés tranquilo. ¿Qué fin de semana sería?',
    ],
    matematicas: [
      '¡Hola! ¿En qué curso está y qué temas le cuestan más? Así preparo el material.',
      'Doy clases presenciales o por videollamada. ¿Cuál prefieres? El precio es el mismo.',
      'Podemos empezar con una sesión de diagnóstico gratuita para ver el nivel exacto.',
    ],
    entrenador: [
      '¡Hola! La primera sesión es gratuita para evaluar objetivos y estado físico. ¿Te viene bien esta semana?',
      'Trabajo a domicilio, en parque o en tu gimnasio. ¿Cuál prefieres?',
      'Genial. ¿Tienes alguna lesión o condición que deba tener en cuenta?',
    ],
  }
  const r = replies[helper.category] || ['¡Hola! Gracias por contactarme. ¿Cuándo te vendría bien hablar?']
  return r[Math.min(msgCount, r.length - 1)]
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
  const { addChat, markRead, hasRated, helpersCache } = useUser()

  const helper = helpersCache?.[parseInt(id)] || helpersCache?.[id] || HELPERS.find(h => h.id === parseInt(id))

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [suggested, setSuggested] = useState('')
  const [typing, setTyping] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (helper) { setSuggested(generateFirstMessage(helper)); markRead?.(helper.id) }
  }, [helper])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  useEffect(() => {
    if (msgCount >= 3 && helper && !hasRated(helper.id)) {
      const t = setTimeout(() => setShowRating(true), 1500)
      return () => clearTimeout(t)
    }
  }, [msgCount])

  if (!helper) return <div className={styles.notFound}>Helper no encontrado</div>

  function sendMessage(text) {
    const msg = text || input
    if (!msg.trim()) return
    const newMsg = { id: Date.now(), text: msg, from: 'user', time: new Date() }
    setMessages(prev => [...prev, newMsg])
    setInput(''); setSuggested('')
    addChat?.(helper.id, helper.name, helper.avatarColor, helper.avatar, msg)
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const reply = { id: Date.now() + 1, text: getHelperReply(helper, msgCount), from: 'helper', time: new Date() }
      setMessages(prev => [...prev, reply])
      setMsgCount(c => c + 1)
      addChat?.(helper.id, helper.name, helper.avatarColor, helper.avatar, reply.text)
    }, 1200 + Math.random() * 800)
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1]
    if (!prev || formatDateLabel(msg.time) !== formatDateLabel(prev.time)) {
      acc.push({ type: 'date', label: formatDateLabel(msg.time) })
    }
    acc.push({ type: 'msg', msg })
    return acc
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={17} /></button>

        <div className={styles.helperInfo} onClick={() => navigate(`/helper/${helper.id}`)}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatarImg} />
            : <div className={styles.avatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
          }
          <div>
            <div className={styles.helperName}>{helper.name}</div>
            <div className={styles.helperStatus}>
              {typing
                ? <span className={styles.typingStatus}>escribiendo...</span>
                : <><span className={styles.onlineDot} /> {helper.specialty}</>
              }
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {!hasRated(helper.id) && messages.length > 0 && (
            <button className={styles.rateBtn} onClick={() => setShowRating(true)}>
              <Star size={13} />
            </button>
          )}
          <button className={styles.profileBtn} onClick={() => navigate(`/helper/${helper.id}`)}>
            <User size={15} />
          </button>
        </div>
      </header>

      {/* Helper info strip */}
      <div className={styles.infoStrip}>
        <span className={styles.infoItem}><MapPin size={11} /> {helper.zone}</span>
        <span className={styles.infoDot} />
        <span className={styles.infoItem}><Star size={11} fill="#F59E0B" color="#F59E0B" /> {helper.rating} ({helper.reviews})</span>
        <span className={styles.infoDot} />
        <span className={styles.infoPrice}>{helper.price}</span>
        {helper.dniVerified && <><span className={styles.infoDot} /><span className={styles.infoVerified}><Shield size={10} /> Verificado</span></>}
      </div>

      <div className={styles.messages}>
        <div className={styles.systemNote}>
          <Shield size={11} />
          <span>Chat seguro · Datos personales solo cuando tú decides</span>
        </div>

        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            {helper.avatarUrl
              ? <img src={helper.avatarUrl} alt={helper.name} className={styles.emptyChatImg} />
              : <div className={styles.emptyChatAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
            }
            <p className={styles.emptyChatName}>{helper.name}</p>
            <p className={styles.emptyChatDesc}>{helper.specialty} · {helper.zone}</p>
            <p className={styles.emptyChatPrice}>{helper.price}</p>
          </div>
        )}

        {grouped.map((item, i) => {
          if (item.type === 'date') return <div key={`d${i}`} className={styles.dateLabel}>{item.label}</div>
          const { msg } = item
          return (
            <div key={msg.id} className={`${styles.msg} ${msg.from === 'user' ? styles.msgUser : styles.msgHelper}`}>
              {msg.from === 'helper' && (
                helper.avatarUrl
                  ? <img src={helper.avatarUrl} alt="" className={styles.msgAvatarImg} />
                  : <div className={styles.msgAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
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
            {helper.avatarUrl
              ? <img src={helper.avatarUrl} alt="" className={styles.msgAvatarImg} />
              : <div className={styles.msgAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
            }
            <div className={styles.typingBubble}>
              <span className={styles.typingDot} /><span className={styles.typingDot} /><span className={styles.typingDot} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {suggested && messages.length === 0 && (
        <div className={styles.suggestionBar}>
          <div className={styles.suggestionLabel}>💡 Nüra sugiere</div>
          <button className={styles.suggestionText} onClick={() => sendMessage(suggested)}>{suggested}</button>
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
