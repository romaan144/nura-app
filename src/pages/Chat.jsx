import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Shield, Star, MapPin, Award, Calendar, Info } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import { getHelperById } from '../utils/supabase'
import { notifyServiceConfirmed } from '../utils/notifications'
import RatingModal from '../components/RatingModal'
import styles from './Chat.module.css'

// ── Context-aware first message ───────────────────────────────────────────
function generateFirstMessage(helper) {
  const name = helper.name?.split(' ')?.[0] || 'Hola'
  const map = {
    logopeda:    `Hola ${name}, te contacto a través de Nüra. Necesito ayuda con logopedia. ¿Tienes disponibilidad esta semana?`,
    tecnico:     `Hola ${name}, te contacto por Nüra. Tengo un problema que necesita un técnico. ¿Cuándo podrías venir?`,
    limpieza:    `Hola ${name}, te encuentro en Nüra. Busco servicio de limpieza del hogar. ¿Estarías disponible?`,
    cuidado:     `Hola ${name}, te contacto por Nüra. Busco a alguien de confianza para cuidar a un familiar. ¿Podríamos hablar?`,
    mascotas:    `Hola ${name}, vi tu perfil en Nüra. Necesito a alguien que cuide mi mascota. ¿Estarías disponible?`,
    matematicas: `Hola ${name}, te encuentro en Nüra. Mi hijo necesita refuerzo escolar. ¿Darías clases?`,
    entrenador:  `Hola ${name}, te contacto por Nüra. Me gustaría empezar a entrenar. ¿Cuándo podría ser la primera sesión?`,
  }
  return map[helper.category] || `Hola ${name}, te contacto a través de Nüra. ¿Tienes disponibilidad?`
}

// ── Smart replies based on conversation stage ─────────────────────────────
function getHelperReply(helper, count) {
  const name = helper.name?.split(' ')?.[0] || ''
  const replies = {
    logopeda: [
      `¡Hola! Claro, tengo disponibilidad esta semana. ¿Me cuentas más sobre el caso para ver si es mi especialidad?`,
      `Perfecto. ¿Cuántos años tiene y qué dificultades concretas has observado?`,
      `Podemos empezar con una sesión de evaluación para conocer el punto de partida. ¿Te viene bien esta semana?`,
    ],
    tecnico: [
      `Hola, puedo pasarme hoy o mañana. ¿De qué se trata exactamente? Así vengo preparado.`,
      `Entendido. ¿Cuándo empezó el problema? Eso me ayuda a saber qué materiales traer.`,
      `Perfecto, te confirmo la hora. El desplazamiento dentro de tu zona no tiene coste adicional.`,
    ],
    limpieza: [
      `¡Hola! Sí, tengo huecos disponibles. ¿Cuántos metros tiene la casa aproximadamente?`,
      `Trabajo con productos ecológicos sin coste adicional. ¿Qué días te vendrían mejor?`,
      `Puedo empezar esta misma semana. ¿El jueves a las 10h te iría bien?`,
    ],
    cuidado: [
      `Buenas, con mucho gusto. ¿Me puedes contar un poco sobre tu familiar? ¿Movilidad, medicación, horarios?`,
      `Tengo experiencia con personas mayores y situaciones de dependencia. ¿Cuántas horas al día necesitarías?`,
      `Podríamos quedar primero para conocernos sin compromiso. ¿Te parece bien esta semana?`,
    ],
    mascotas: [
      `¡Hola! ¿Qué raza y tamaño tiene tu mascota? ¿Necesita paseos diarios o cuidado en casa?`,
      `Mando fotos y actualizaciones cada pocas horas para que estés tranquilo.`,
      `¿Qué fechas necesitarías? Cuanto antes lo reservemos mejor, ya que tengo agenda limitada.`,
    ],
    matematicas: [
      `¡Hola! ¿En qué curso está y qué temas le cuestan más? Así preparo el material adecuado.`,
      `Puedo dar clases presenciales o por videollamada, el precio es el mismo. ¿Cuál prefieres?`,
      `Empezamos con una sesión de diagnóstico para ver el nivel exacto y diseñar el plan.`,
    ],
    entrenador: [
      `¡Hola! La primera sesión es gratuita para evaluar objetivos y estado físico. ¿Te viene bien esta semana?`,
      `Trabajo a domicilio, en parque o en tu gimnasio. ¿Cuál prefieres y cuántos días a la semana?`,
      `¿Tienes alguna lesión o condición física que deba tener en cuenta?`,
    ],
  }
  const r = replies[helper.category] || [
    `¡Hola! Gracias por contactarme. ¿Cuándo te vendría bien hablar con más detalle?`,
    `Cuéntame un poco más sobre lo que necesitas para poder orientarte mejor.`,
    `Podemos quedar para una primera consulta si lo ves bien.`,
  ]
  return r[Math.min(count, r.length - 1)]
}

// ── Nüra intervention — helps close the deal ─────────────────────────────
function getNuraIntervention(helper, count) {
  if (count === 2) return `💡 Parece que la conversación va bien. Si quieres cerrar el servicio con ${helper.name?.split(' ')?.[0]}, pulsa **Contratar** arriba.`
  if (count === 4) return `💡 Recuerda que puedes ver el perfil completo de ${helper.name?.split(' ')?.[0]} — valoraciones, experiencia y verificaciones — antes de confirmar.`
  return null
}

function formatTime(date) {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`
}
function formatDateLabel(date) {
  if (date.toDateString() === new Date().toDateString()) return 'Hoy'
  return date.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })
}

// ── Confirm Service Modal ─────────────────────────────────────────────────
function ConfirmModal({ helper, onClose, onConfirm }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const name = helper.name?.split(' ')?.[0] || helper.name

  if (done) return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'rgba(255,255,255,0.95)',backdropFilter:'blur(32px)',border:'1px solid rgba(255,255,255,0.5)',borderRadius:'24px',padding:'36px 28px',textAlign:'center',maxWidth:'320px',width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,0.12)'}}>
        <div style={{fontSize:'52px',marginBottom:'16px',lineHeight:1}}>✅</div>
        <h3 style={{fontSize:'19px',fontWeight:800,marginBottom:'8px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>Solicitud enviada</h3>
        <p style={{fontSize:'13px',color:'rgba(0,0,0,0.45)',marginBottom:'24px',lineHeight:1.6}}>{name} recibirá tu solicitud y te confirmará disponibilidad.</p>
        <div style={{display:'flex',flexDirection:'column',gap:'8px',width:'100%'}}>
          <button onClick={() => { onClose(); navigate('/my-services') }}
            style={{padding:'13px 28px',background:'#1C1C1E',color:'white',border:'none',borderRadius:'100px',fontSize:'14px',fontWeight:700,cursor:'pointer',width:'100%'}}>
            Ver mis servicios
          </button>
          <button onClick={onClose}
            style={{padding:'12px',background:'transparent',color:'rgba(0,0,0,0.4)',border:'none',fontSize:'14px',cursor:'pointer'}}>
            Volver al chat
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:'rgba(255,255,255,0.95)',backdropFilter:'blur(32px)',border:'1px solid rgba(255,255,255,0.5)',borderRadius:'24px 24px 0 0',padding:'24px 20px 32px',width:'100%',maxWidth:'500px',boxShadow:'0 -8px 40px rgba(0,0,0,0.1)'}}>
        <div style={{width:'36px',height:'4px',background:'rgba(0,0,0,0.1)',borderRadius:'2px',margin:'0 auto 24px'}} />
        <h3 style={{fontSize:'18px',fontWeight:800,marginBottom:'4px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>Solicitar servicio</h3>
        <p style={{fontSize:'13px',color:'rgba(0,0,0,0.45)',marginBottom:'20px'}}>Con {name} · {helper.price || 'Precio a consultar'}</p>
        <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{padding:'12px 16px',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'14px',fontSize:'15px',outline:'none',fontFamily:'-apple-system,Inter,sans-serif',color:'rgba(0,0,0,0.85)',background:'rgba(0,0,0,0.03)'}} />
          <input type="time" value={time} onChange={e=>setTime(e.target.value)}
            style={{padding:'12px 16px',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'14px',fontSize:'15px',outline:'none',fontFamily:'-apple-system,Inter,sans-serif',color:'rgba(0,0,0,0.85)',background:'rgba(0,0,0,0.03)'}} />
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Detalles adicionales (opcional)..." rows={3}
            style={{padding:'12px 16px',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'14px',fontSize:'15px',outline:'none',resize:'none',fontFamily:'-apple-system,Inter,sans-serif',color:'rgba(0,0,0,0.85)',background:'rgba(0,0,0,0.03)'}} />
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={onClose} style={{flex:1,padding:'14px',background:'rgba(0,0,0,0.05)',color:'rgba(0,0,0,0.55)',border:'none',borderRadius:'100px',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Cancelar</button>
          <button onClick={()=>{ onConfirm?.(date, time, note); setDone(true); notifyServiceConfirmed(helper.name?.split(' ')?.[0] || helper.name) }} disabled={!date}
            style={{flex:2,padding:'14px',background:date?'#1C1C1E':'rgba(0,0,0,0.1)',color:date?'white':'rgba(0,0,0,0.3)',border:'none',borderRadius:'100px',fontSize:'14px',fontWeight:700,cursor:date?'pointer':'default',transition:'all 0.2s'}}>
            Enviar solicitud
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Chat ─────────────────────────────────────────────────────────────
export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addChat, markRead, hasRated, helpersCache, addService } = useUser()

  const [helper, setHelper] = useState(
    helpersCache?.[parseInt(id)] || helpersCache?.[id] || helpersCache?.[String(id)] ||
    HELPERS.find(h => String(h.id) === String(id)) || null
  )

  useEffect(() => {
    if (!helper) {
      getHelperById(id).then(h => { if (h) setHelper(h) })
    }
  }, [id])

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [suggested, setSuggested] = useState('')
  const [typing, setTyping] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (helper) { setSuggested(generateFirstMessage(helper)); markRead?.(helper.id) }
  }, [helper?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  if (!helper) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',background:'#F7F7F9'}}>
      <img src="/logo-iso.png" alt="" style={{width:'40px',opacity:0.4,animation:'pulse 1.5s infinite'}} />
    </div>
  )

  function sendMessage(text) {
    const msg = text || input
    if (!msg.trim() || typing) return
    const newMsg = { id: Date.now(), text: msg, from: 'user', time: new Date() }
    setMessages(prev => [...prev, newMsg])
    setInput(''); setSuggested('')
    addChat?.(helper.id, helper.name, helper.avatarColor, helper.avatar, msg)
    setTyping(true)
    const delay = 1000 + Math.random() * 600
    setTimeout(() => {
      setTyping(false)
      const replyText = getHelperReply(helper, msgCount)
      const reply = { id: Date.now() + 1, text: replyText, from: 'helper', time: new Date() }
      setMessages(prev => [...prev, reply])
      const newCount = msgCount + 1
      setMsgCount(newCount)
      addChat?.(helper.id, helper.name, helper.avatarColor, helper.avatar, replyText)

      // Nüra intervention at key moments
      const nura = getNuraIntervention(helper, newCount)
      if (nura) {
        setTimeout(() => {
          setMessages(prev => [...prev, { id: Date.now() + 2, text: nura, from: 'nura', time: new Date() }])
        }, 800)
      }
    }, delay)
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

  // Quick replies after helper responds
  const lastMsg = messages[messages.length - 1]
  const showQuickReplies = lastMsg?.from === 'helper' && !typing

  const QUICK_REPLIES = [
    '¿Cuál es el precio exacto?',
    '¿Cuándo podrías empezar?',
    'Perfecto, adelante',
    '¿Tienes referencias?',
  ]

  return (
    <div className={styles.page}>

      {/* Floating header */}
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={17} />
        </button>

        <div className={styles.helperInfo} onClick={() => navigate(`/helper/${helper.id}`, { state: { helper } })}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatarImg} />
            : <div className={styles.avatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
          }
          <div className={styles.helperMeta}>
            <div className={styles.helperName}>
              {helper.name}
              {helper.founder && <Award size={11} color='#92400E' style={{marginLeft:'3px',verticalAlign:'middle'}} />}
              {helper.dniVerified && <Shield size={10} color='#059669' style={{marginLeft:'3px',verticalAlign:'middle'}} />}
            </div>
            <div className={styles.helperStatus}>
              {typing
                ? <span className={styles.typingStatus}>escribiendo...</span>
                : <><span className={styles.onlineDot} />{helper.specialty}</>
              }
            </div>
          </div>
        </div>

        <button className={styles.contractBtn} onClick={() => setShowConfirm(true)}>
          <Calendar size={13} /> Contratar
        </button>
      </header>

      {/* Messages — full screen */}
      <div className={styles.messages}>

        {/* System note */}
        <div className={styles.systemNote}>
          <Shield size={11} /> Chat seguro · Comparte datos personales solo cuando confíes
        </div>

        {/* Empty state */}
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            {helper.avatarUrl
              ? <img src={helper.avatarUrl} alt={helper.name} className={styles.emptyChatImg} />
              : <div className={styles.emptyChatAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
            }
            <p className={styles.emptyChatName}>{helper.name}</p>
            <p className={styles.emptyChatDesc}>{helper.specialty} · {helper.zone}</p>
            {helper.price && <p className={styles.emptyChatPrice}>{helper.price}</p>}
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center',marginTop:'4px'}}>
              {helper.dniVerified && <span style={{fontSize:'11px',color:'#059669',background:'#ECFDF5',border:'1px solid rgba(5,150,105,0.15)',borderRadius:'100px',padding:'3px 10px',fontWeight:600}}>✓ Verificado</span>}
              {helper.available && <span style={{fontSize:'11px',color:'#059669',background:'#ECFDF5',border:'1px solid rgba(5,150,105,0.15)',borderRadius:'100px',padding:'3px 10px',fontWeight:600}}>● Disponible</span>}
              <span style={{fontSize:'11px',color:'rgba(0,0,0,0.4)',background:'rgba(0,0,0,0.04)',borderRadius:'100px',padding:'3px 10px'}}>⭐ {helper.rating} · {helper.reviews} reseñas</span>
            </div>
          </div>
        )}

        {/* Messages */}
        {grouped.map((item, i) => {
          if (item.type === 'date') return <div key={`d${i}`} className={styles.dateLabel}>{item.label}</div>
          const { msg } = item
          const isNura = msg.from === 'nura'
          return (
            <div key={msg.id} className={`${styles.msg} ${msg.from === 'user' ? styles.msgUser : styles.msgHelper}`}>
              {msg.from === 'helper' && (
                helper.avatarUrl
                  ? <img src={helper.avatarUrl} alt="" className={styles.msgAvatarImg} />
                  : <div className={styles.msgAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
              )}
              {isNura && (
                <div className={styles.nuraAvatarSmall}>
                  <img src="/logo-iso.png" alt="Nüra" style={{width:'18px',height:'18px',objectFit:'contain'}} />
                </div>
              )}
              <div className={`${styles.msgBubble} ${isNura ? styles.msgBubbleNura : ''}`}>
                <p>{msg.text}</p>
                <span className={msg.from === 'user' ? styles.msgTime : styles.msgTimeHelper}>{formatTime(msg.time)}</span>
              </div>
            </div>
          )
        })}

        {/* Typing */}
        {typing && (
          <div className={`${styles.msg} ${styles.msgHelper}`}>
            {helper.avatarUrl
              ? <img src={helper.avatarUrl} alt="" className={styles.msgAvatarImg} />
              : <div className={styles.msgAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
            }
            <div className={styles.typingBubble}>
              <span className={styles.typingDot}/><span className={styles.typingDot}/><span className={styles.typingDot}/>
            </div>
          </div>
        )}

        {/* Quick replies */}
        {showQuickReplies && (
          <div className={styles.quickReplies}>
            {QUICK_REPLIES.map((r, i) => (
              <button key={i} className={styles.quickReply} onClick={() => sendMessage(r)}>{r}</button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Nüra suggestion for first message */}
      {suggested && messages.length === 0 && (
        <div className={styles.suggestionBar}>
          <span className={styles.suggestionLabel}>💡 Nüra sugiere</span>
          <button className={styles.suggestionText} onClick={() => sendMessage(suggested)}>{suggested}</button>
        </div>
      )}

      {/* Floating input */}
      <div className={styles.inputWrap}>
        <div className={styles.inputBar}>
          <input className={styles.input}
            placeholder={`Escribe a ${helper.name?.split(' ')?.[0] || helper.name}...`}
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
          <button className={styles.sendBtn} onClick={() => sendMessage()} disabled={!input.trim()}>
            <Send size={15} />
          </button>
        </div>
      </div>

      {showRating && <RatingModal helper={helper} onClose={() => setShowRating(false)} />}
      {showConfirm && <ConfirmModal helper={helper} onClose={() => setShowConfirm(false)} onConfirm={(date, time, note) => { addService(helper, date, time, note) }} />}
    </div>
  )
}
