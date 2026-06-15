import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Shield, Star, MapPin, Award, Calendar } from 'lucide-react'
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


function ConfirmServiceModal({ helper, onClose }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed) return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'white',borderRadius:'24px',padding:'32px',textAlign:'center',maxWidth:'320px',width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,0.18)'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>✅</div>
        <h3 style={{fontSize:'18px',fontWeight:800,marginBottom:'8px',color:'var(--ink)'}}>Solicitud enviada</h3>
        <p style={{fontSize:'13px',color:'var(--mid)',marginBottom:'24px',lineHeight:1.6}}>{helper.name.split(' ')[0]} recibirá tu solicitud y confirmará disponibilidad.</p>
        <button onClick={onClose} style={{padding:'12px 28px',background:'#1C1C1E',color:'white',border:'none',borderRadius:'20px',fontSize:'14px',fontWeight:700}}>Entendido</button>
      </div>
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:'white',borderRadius:'24px 24px 0 0',padding:'24px',width:'100%',maxWidth:'500px',boxShadow:'0 -8px 40px rgba(0,0,0,0.18)'}}>
        <div style={{width:'36px',height:'4px',background:'var(--rule)',borderRadius:'2px',margin:'0 auto 20px'}} />
        <h3 style={{fontSize:'17px',fontWeight:800,marginBottom:'4px',color:'var(--ink)'}}>Solicitar servicio</h3>
        <p style={{fontSize:'13px',color:'var(--mid)',marginBottom:'20px'}}>Con {helper.name.split(' ')[0]} · {helper.price || 'Precio a consultar'}</p>
        <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'20px'}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{padding:'11px 14px',border:'1.5px solid var(--rule)',borderRadius:'14px',fontSize:'14px',outline:'none',fontFamily:'Inter,sans-serif',color:'var(--ink)'}} />
          <input type="time" value={time} onChange={e=>setTime(e.target.value)}
            style={{padding:'11px 14px',border:'1.5px solid var(--rule)',borderRadius:'14px',fontSize:'14px',outline:'none',fontFamily:'Inter,sans-serif',color:'var(--ink)'}} />
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Cuéntale más detalles (opcional)..."
            rows={3}
            style={{padding:'11px 14px',border:'1.5px solid var(--rule)',borderRadius:'14px',fontSize:'14px',outline:'none',resize:'none',fontFamily:'Inter,sans-serif',color:'var(--ink)'}} />
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={onClose} style={{flex:1,padding:'13px',background:'var(--paper)',color:'var(--mid)',border:'none',borderRadius:'18px',fontSize:'14px',fontWeight:600}}>Cancelar</button>
          <button onClick={()=>setConfirmed(true)} disabled={!date}
            style={{flex:2,padding:'13px',background:date?'var(--grad-main)':'var(--rule)',color:'white',border:'none',borderRadius:'18px',fontSize:'14px',fontWeight:700,boxShadow:date?'0 4px 14px rgba(123,47,255,0.3)':'none'}}>
            Enviar solicitud
          </button>
        </div>
      </div>
    </div>
  )
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
  const [showConfirm, setShowConfirm] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (helper) { setSuggested(generateFirstMessage(helper)); markRead?.(helper.id) }
  }, [helper])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  // Mark messages as read after 1.5s
  const [readIndex, setReadIndex] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setReadIndex(messages.length), 1500)
    return () => clearTimeout(t)
  }, [messages.length])

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
          <div className={styles.helperMeta}>
            <div className={styles.helperName}>
                {helper.name}
                {helper.founder && <Award size={12} color='#92400E' style={{marginLeft:'4px',verticalAlign:'middle'}} />}
                {helper.dniVerified && <Shield size={11} color='#059669' style={{marginLeft:'4px',verticalAlign:'middle'}} />}
              </div>
            <div className={styles.helperStatus}>
              {typing
                ? <span className={styles.typingStatus}>escribiendo...</span>
                : <><span className={styles.onlineDot} /> {helper.specialty}</>
              }
            </div>
          </div>
        </div>


        <button onClick={() => setShowConfirm(true)} style={{
          display:'flex',alignItems:'center',gap:'6px',
          padding:'8px 14px',background:'var(--grad-main)',
          color:'white',border:'none',borderRadius:'20px',
          fontSize:'12px',fontWeight:700,
          boxShadow:'0 2px 8px rgba(123,47,255,0.3)',
          flexShrink:0
        }}>
          <Calendar size={13} /> Contratar
        </button>
        <button onClick={() => setShowConfirm(true)}
          style={{padding:'7px 14px',borderRadius:'100px',
            background:'rgba(255,255,255,0.72)',
            backdropFilter:'blur(24px) saturate(180%)',
            WebkitBackdropFilter:'blur(24px) saturate(180%)',
            border:'1px solid rgba(255,255,255,0.35)',
            boxShadow:'0 2px 16px rgba(0,0,0,0.05)',
            fontSize:'12px',fontWeight:700,color:'var(--purple)',
            display:'flex',alignItems:'center',gap:'5px',flexShrink:0}}>
          <Calendar size={13} /> Contratar
        </button>
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
        <div className={styles.inputPill}>
          <input className={styles.input}
            placeholder={`Escribe a ${helper.name.split(' ')[0]}...`}
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
          <button className={styles.sendBtn} onClick={() => sendMessage()} disabled={!input.trim()}>
            <Send size={15} />
          </button>
        </div>
      </div>

      {showRating && <RatingModal helper={helper} onClose={() => setShowRating(false)} />}
      {showConfirm && <ConfirmServiceModal helper={helper} onClose={() => setShowConfirm(false)} />}
    </div>
  )
}
