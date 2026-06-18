import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Send, Shield, Award, Calendar } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import { getHelperById } from '../utils/supabase'
import { appendHelperChatLog } from '../utils/claudeApi'
import { notifyServiceConfirmed } from '../utils/notifications'
import { haptic } from '../utils/haptic'
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
function getHelperReply(helper, count, userMsg = '') {
  const name = helper.name?.split(' ')?.[0] || ''
  const t = userMsg.toLowerCase()
  
  // When coming from Nüra recommendation — acknowledge it
  if (t.includes('nüra me ha recomendado') || t.includes('nura me ha recomendado')) {
    const cat = helper.category || 'otro'
    const specific = {
      logopeda: `Hola, me alegra que Nüra te haya dirigido aquí. ¿Me cuentas la edad y qué dificultades concretas observas?`,
      cuidado: `Hola, con mucho gusto. ¿Puedes contarme un poco sobre tu familiar — movilidad, horarios, lo que necesite?`,
      tecnico: `Hola, dime en qué consiste el problema exactamente. Así vengo preparado con lo necesario.`,
      limpieza: `Hola, disponibilidad tengo. ¿Cuántos metros es la vivienda y con qué frecuencia lo necesitarías?`,
      entrenador: `Hola, la primera sesión es gratis para evaluar punto de partida y objetivos. ¿Esta semana te viene bien?`,
      salud: `Hola, cuéntame qué te ocurre. Así valoro si puedo ayudarte y cómo.`,
      legal: `Hola, para orientarte bien necesito saber más sobre el caso. ¿Qué tipo de situación es?`,
    }
    return specific[cat] || `Hola, encantado/a. Cuéntame más sobre lo que necesitas para ver cómo puedo ayudarte.`
  }

  // Universal keyword responses (override category)
  if (t.includes('precio') || t.includes('cuánto') || t.includes('coste') || t.includes('tarifa'))
    return `Mi tarifa es ${helper.price || 'a consultar según el servicio'}. ¿Te parece bien?`
  if (t.includes('disponib') || t.includes('cuándo') || t.includes('horario') || t.includes('esta semana'))
    return `Sí, tengo disponibilidad. ¿Qué día y hora te vendría mejor?`
  if (t.includes('dónde') || t.includes('zona') || t.includes('domicilio') || t.includes('online'))
    return helper.online && helper.presential
      ? `Trabajo tanto presencial en ${helper.zone || 'tu zona'} como online. ¿Cuál prefieres?`
      : `Trabajo en ${helper.zone || 'Barcelona'}. ¿Te queda bien?`
  if (t.includes('urgente') || t.includes('hoy') || t.includes('ahora') || t.includes('rápido'))
    return helper.urgent
      ? `Sí, atiendo urgencias. ¿Me cuentas más?`
      : `No hago urgencias normalmente, pero dime qué necesitas y lo vemos.`
  if (t.includes('gracias') || t.includes('perfecto') || t.includes('genial') || t.includes('de acuerdo')) {
    const firstName = helper.name?.split(' ')?.[0] || ''
    const options = [
      `¡Perfecto! Cuando quieras cerramos los detalles, ${firstName}.`,
      `Genial. Avísame cuando quieras concretar y lo organizamos.`,
      `De nada. Estoy aquí para lo que necesites.`,
    ]
    return options[Math.floor(Math.random() * options.length)]
  }
  if (t.includes('referencia') || t.includes('opinión') || t.includes('reseña') || t.includes('valoración'))
    return `Tengo ${helper.reviews || 0} valoraciones en Nüra con una media de ${helper.rating || 4.5} estrellas. Puedes verlas en mi perfil.`
  if (t.includes('contrat') || t.includes('reservar') || t.includes('apuntar'))
    return `Con mucho gusto. Dime cuándo y te confirmo disponibilidad.`
  // Only generic greeting if ONLY a greeting (no other content)
  if ((t.includes('hola') || t.includes('buenas') || t.includes('buenos')) && t.length < 15)
    return `¡Hola! Soy ${name}. ¿En qué puedo ayudarte?`

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
  const extraReplies = {
    salud: [
      `Hola, con mucho gusto. ¿Me comentas qué síntomas o dudas tienes? Así puedo orientarte mejor antes de la consulta.`,
      `Puedo hacer la primera valoración de forma presencial u online, como prefieras.`,
      `Cuéntame con más detalle y te digo si es algo que trato directamente o si te derivo a un especialista.`,
    ],
    legal: [
      `Buenos días. ¿Me explicas brevemente la situación? Con eso puedo decirte si es de mi especialidad y el enfoque que daría.`,
      `La primera consulta es orientativa, sin compromiso. ¿Tienes alguna documentación relacionada?`,
      `Trabajo principalmente en Barcelona pero puedo hacer consultas por videollamada también.`,
    ],
    hogar: [
      `Hola, cuéntame el proyecto. ¿Es una reforma completa, una habitación o algo más puntual?`,
      `¿Tienes ya alguna idea de lo que quieres o empezamos desde cero? En ambos casos podemos trabajar.`,
      `Puedo visitarte sin compromiso para ver el espacio y darte una valoración más concreta.`,
    ],
  }
  const allReplies = { ...replies, ...extraReplies }
  const r = allReplies[helper.category] || [
    `Hola, gracias por escribirme. ¿Me cuentas un poco más sobre lo que necesitas?`,
    `Cuéntame con más detalle para poder orientarte mejor.`,
    `Podemos hacer una primera consulta sin compromiso esta semana si te parece bien.`,
  ]
  return r[Math.min(count, r.length - 1)]
}

// ── Nüra intervention — context-aware, detects booking moments ────────────
function getNuraIntervention(helper, count, messages) {
  const name = helper.name?.split(' ')?.[0] || helper.name
  if (count < 2) return null

  // Read all message text to detect booking signals
  const allText = (messages || [])
    .map(m => (m.text || m.lines?.join(' ') || '').toLowerCase())
    .join(' ')

  const hasDia = /lunes|martes|miércoles|jueves|viernes|sábado|domingo|mañana|semana|esta semana|próxima|pasado|día [0-9]/i.test(allText)
  const hasHora = /[0-9]+h|[0-9]+:[0-9]+|por la mañana|por la tarde|por la noche|a las/i.test(allText)
  const hasPrecio = /€|precio|cobro|cuesta|tarifa/i.test(allText)
  const hasPositivo = /perfecto|genial|ok|bien|de acuerdo|confirmado|confirmamos|me viene|me parece|trato|vale|sí|claro/i.test(allText)
  const hasBookingSignal = hasDia && hasPositivo

  // BOOKING MOMENT: date mentioned + positive response → push CTA now
  if (hasBookingSignal && count >= 3) {
    return `Todo apunta a que habéis llegado a un acuerdo. ¿Confirmo la reserva con **${name}**?`
  }

  // Price discussed → reassure
  if (hasPrecio && count === 3) {
    return `El precio está claro. Si todo te parece bien, puedes confirmar desde el botón **Contratar**.`
  }

  // Count-based fallbacks for when no signals detected
  const fallbacks = {
    2: `¿Necesitas algo más antes de decidir? Puedo buscar alternativas si quieres comparar.`,
    5: `**${name}** tiene ${helper.rating || 4.8}★ de media con ${helper.reviews || 0} valoraciones reales.`,
    7: `Cuando estés listo, confirma la reserva. Quedará en **Mis Servicios** con todos los detalles.`,
  }
  return fallbacks[count] || null
}

function formatTime(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}
function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return ''
  if (date.toDateString() === new Date().toDateString()) return 'Hoy'
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1)
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer'
  return date.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })
}


// ── Extract date/time from conversation ──────────────────────────────────
function extractDateFromMessages(messages) {
  const text = (messages || [])
    .map(m => (m.text || m.lines?.join(' ') || '').toLowerCase())
    .join(' ')

  let extractedDate = ''
  let extractedTime = ''

  // Extract time: "a las 10", "10h", "10:00", "las 9"
  const timeMatch = text.match(/(?:a las |las )?(\d{1,2})(?::00)?(?:h|:00)?\ ?(?:de la (?:mañana|tarde))?/)
  if (timeMatch) {
    const h = parseInt(timeMatch[1])
    if (h >= 7 && h <= 22) {
      extractedTime = `${h}:00`
    }
  }

  // Extract day of week → map to next occurrence
  const today = new Date()
  const days = { lunes:1, martes:2, miércoles:3, jueves:4, viernes:5, sábado:6, domingo:0 }
  for (const [dayName, dayNum] of Object.entries(days)) {
    if (text.includes(dayName)) {
      const d = new Date()
      const diff = (dayNum - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      extractedDate = d.toISOString().split('T')[0]
      break
    }
  }

  // "mañana"
  if (!extractedDate && text.includes('mañana')) {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    extractedDate = d.toISOString().split('T')[0]
  }

  // "hoy"
  if (!extractedDate && text.includes('hoy')) {
    extractedDate = new Date().toISOString().split('T')[0]
  }

  // "esta semana" or "próxima" → default to next available weekday
  if (!extractedDate && (text.includes('esta semana') || text.includes('próxima semana'))) {
    const d = new Date()
    d.setDate(d.getDate() + (d.getDay() === 5 ? 3 : d.getDay() === 6 ? 2 : 1))
    extractedDate = d.toISOString().split('T')[0]
  }

  return { extractedDate, extractedTime }
}

// ── Confirm Service Modal ─────────────────────────────────────────────────
function ConfirmModal({ helper, onClose, onConfirm, prefillDate, prefillTime }) {
  const [date, setDate] = useState(prefillDate || '')
  const [time, setTime] = useState(prefillTime || '')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const name = helper.name?.split(' ')?.[0] || helper.name

  if (done) return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',WebkitBackdropFilter: 'blur(8px)', backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'rgba(255,255,255,0.95)',WebkitBackdropFilter: 'blur(32px)', backdropFilter:'blur(32px)',border:'1px solid rgba(255,255,255,0.5)',borderRadius:'24px',padding:'36px 28px',textAlign:'center',maxWidth:'320px',width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,0.12)'}}>
        {/* Avatar with checkmark */}
        <div style={{position:'relative',display:'inline-block',marginBottom:'12px'}}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt={name}
                style={{width:'64px',height:'64px',borderRadius:'50%',border:'3px solid var(--green-dot)',display:'block'}} />
            : <div style={{width:'64px',height:'64px',borderRadius:'50%',background:helper.avatarColor||'#7B2FFF',
                display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'var(--text-lg)',fontWeight:700,
                border:'3px solid var(--green-dot)'}}>
                {helper.avatar||name[0]}
              </div>
          }
          <span style={{position:'absolute',bottom:-2,right:-2,width:'20px',height:'20px',background:'var(--green-dot)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width='11' height='11' viewBox='0 0 12 12' fill='none'><path d='M2 6l3 3 5-5' stroke='white' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/></svg></span>
        </div>
        <h3 style={{fontSize:'19px',fontWeight:800,marginBottom:'4px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>¡Solicitud enviada!</h3>
        <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.45)',marginBottom:'12px',lineHeight:1.6}}>{name} confirmará disponibilidad en breve.</p>
        {(date || time) && (
          <div style={{background:'rgba(0,0,0,0.03)',border:'1px solid rgba(0,0,0,0.06)',borderRadius:'12px',
            padding:'10px 14px',marginBottom:'20px',textAlign:'left'}}>
            {date && <p style={{margin:'0 0 3px',fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.55)'}}>
              {new Date(date).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}
            </p>}
            {time && <p style={{margin:0,fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.55)'}}>{time}h</p>}
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:'8px',width:'100%'}}>
          <button onClick={() => { onClose(); navigate('/my-services') }}
            style={{padding:'13px',background:'var(--purple)',color:'white',border:'none',borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:700,cursor:'pointer',width:'100%'}}>
            Ver mis servicios
          </button>
          <button onClick={onClose}
            style={{padding:'12px',background:'transparent',color:'rgba(0,0,0,0.4)',border:'none',fontSize:'var(--text-sm)',cursor:'pointer'}}>
            Volver al chat
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',WebkitBackdropFilter: 'blur(8px)', backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:'rgba(255,255,255,0.95)',WebkitBackdropFilter: 'blur(32px)', backdropFilter:'blur(32px)',border:'1px solid rgba(255,255,255,0.5)',borderRadius:'24px 24px 0 0',padding:'24px 20px 32px',width:'100%',maxWidth:'500px',boxShadow:'0 -8px 40px rgba(0,0,0,0.1)'}}>
        <div style={{width:'36px',height:'4px',background:'rgba(0,0,0,0.1)',borderRadius:'2px',margin:'0 auto 24px'}} />
        <h3 style={{fontSize:'var(--text-md)',fontWeight:800,marginBottom:'4px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>Solicitar servicio</h3>
        <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.45)',marginBottom: prefillDate ? '12px' : '20px'}}>Con {name} · {helper.price || 'Precio a consultar'}</p>
        {prefillDate && (
          <div style={{display:'flex',alignItems:'center',gap:'6px',
            background:'rgba(123,47,255,0.06)',border:'1px solid rgba(123,47,255,0.1)',
            borderRadius:'10px',padding:'8px 12px',marginBottom:'16px',
          }}>
            <img src="/logo-iso.png" alt="" style={{width:'12px',height:'12px',opacity:0.7}} />
            <span style={{fontSize:'var(--text-xs)',color:'var(--purple)',fontWeight:600}}>
              Nüra detectó la fecha de vuestra conversación
            </span>
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
          {/* Day pills */}
          <div>
            <p style={{fontSize:'var(--text-xs)',fontWeight:700,color:'rgba(0,0,0,0.4)',margin:'0 0 8px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Fecha</p>
            <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px'}}>
              {Array.from({length:7},(_,i)=>{
                const d=new Date(); d.setDate(d.getDate()+i)
                const iso=d.toISOString().split('T')[0]
                const lbl=i===0?'Hoy':i===1?'Mañana':d.toLocaleDateString('es-ES',{weekday:'short',day:'numeric'})
                return (
                  <button key={i} onClick={()=>setDate(iso)} style={{
                    flexShrink:0,padding:'8px 14px',
                    background:date===iso?'var(--purple)':'rgba(0,0,0,0.05)',
                    color:date===iso?'white':'rgba(0,0,0,0.6)',
                    border:'none',borderRadius:'100px',fontSize:'var(--text-xs)',fontWeight:600,
                    cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',whiteSpace:'nowrap',
                  }}>{lbl}</button>
                )
              })}
            </div>
          </div>
          {/* Time pills */}
          <div>
            <p style={{fontSize:'var(--text-xs)',fontWeight:700,color:'rgba(0,0,0,0.4)',margin:'0 0 8px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Hora</p>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {['9:00','10:00','11:00','12:00','16:00','17:00','18:00','19:00'].map(t=>(
                <button key={t} onClick={()=>setTime(t)} style={{
                  padding:'7px 12px',
                  background:time===t?'var(--purple)':'rgba(0,0,0,0.05)',
                  color:time===t?'white':'rgba(0,0,0,0.6)',
                  border:'none',borderRadius:'100px',fontSize:'var(--text-xs)',fontWeight:600,
                  cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                }}>{t}</button>
              ))}
            </div>
          </div>
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Detalles adicionales (opcional)..." rows={3}
            style={{padding:'12px 16px',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'14px',fontSize:'var(--text-base)',outline:'none',resize:'none',fontFamily:'-apple-system,Inter,sans-serif',color:'rgba(0,0,0,0.85)',background:'rgba(0,0,0,0.03)'}} />
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={onClose} style={{flex:1,padding:'14px',background:'rgba(0,0,0,0.05)',color:'rgba(0,0,0,0.55)',border:'none',borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:600,cursor:'pointer'}}>Cancelar</button>
          <button onClick={()=>{ onConfirm?.(date, time, note); setDone(true); notifyServiceConfirmed(helper.name?.split(' ')?.[0] || helper.name); haptic('success') }} disabled={!date}
            style={{flex:2,padding:'14px',background:date?'var(--purple)':'rgba(0,0,0,0.1)',color:date?'white':'rgba(0,0,0,0.3)',border:'none',borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:700,cursor:date?'pointer':'default',transition:'all 0.2s'}}>
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
  const location = useLocation()
  const { addChat, markRead, hasRated, helpersCache, addService,
    services, getChatHistory, saveChatHistory
  } = useUser()

  const [helper, setHelper] = useState(
    helpersCache?.[parseInt(id)] || helpersCache?.[id] || helpersCache?.[String(id)] ||
    HELPERS.filter(Boolean).find(h => String(h.id) === String(id)) || null
  )

  useEffect(() => {
    if (!helper) {
      getHelperById(id).then(h => { if (h) setHelper(h) })
    }
  }, [id])

  const [messages, setMessages] = useState(() => {
    const real = getChatHistory(id)
    if (real?.length > 0) return real
    const demo = location.state?.demoHistory
    if (demo?.length > 0) return demo
    return []
  })
  const hasHistory = (getChatHistory(id)?.length > 0) || (location.state?.demoHistory?.length > 0)
  const userQuery = location.state?.userQuery || window.__nuraLastQuery
  const fromSearch = !!userQuery && !hasHistory

  // Pre-fill input with contextual message when coming from search
  const buildPreFill = (helper, query) => {
    if (!helper || !query) return ''
    const name = helper.name?.split(' ')?.[0] || ''
    // Clean up the query — remove trailing punctuation, make it lowercase if it starts as such
    const q = query.trim().replace(/[.?!]+$/, '')
    return `Hola ${name}, Nüra me ha recomendado tu perfil. ${q}. ¿Puedes ayudarme?`
  }

  const [input, setInput] = useState(() =>
    (!!location.state?.userQuery || !!window.__nuraLastQuery) && !hasHistory
      ? buildPreFill(
          helpersCache?.[parseInt(id)] || helpersCache?.[id] ||
          HELPERS.filter(Boolean).find(h => String(h.id) === String(id)),
          location.state?.userQuery || window.__nuraLastQuery
        )
      : ''
  )
  const [suggested, setSuggested] = useState('')
  const [typing, setTyping] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [msgCount, setMsgCount] = useState(() => Math.floor((getChatHistory(id)?.filter(m => m.from === 'helper')?.length || 0)))
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!helper) return
    setSuggested(generateFirstMessage(helper))
    markRead?.(helper.id)

    // Send initial greeting if no history
    if (!hasHistory) {
      setTyping(true)
      const delay = 800 + Math.random() * 400
      setTimeout(() => {
        setTyping(false)
        const greeting = getHelperReply(helper, 0, '')
        const greetMsg = {
          id: Date.now(),
          from: 'helper',
          text: greeting,
          time: new Date().toISOString()
        }
        setMessages([greetMsg])
      }, delay)
    }
  }, [helper?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  // Persist chat history per helper
  useEffect(() => {
    if (messages.length > 0 && helper) {
      saveChatHistory(id, messages)
    }
  }, [messages])

  if (!helper) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',background:'#F7F7F9'}}>
      <img src="/logo-iso.png" alt="" style={{width:'40px',opacity:0.4,animation:'pulse 1.5s infinite'}} />
    </div>
  )

  function sendMessage(text) {
    haptic('light')
    const msg = text || input
    if (!msg.trim() || typing) return
    const newMsg = { id: Date.now(), text: msg, from: 'user', time: new Date().toISOString() }
    setMessages(prev => [...prev, newMsg])
    setInput(''); setSuggested('')
    addChat?.(helper.id, helper.name, helper.avatarColor, helper.avatar, msg)
    setTyping(true)
    const delay = 1000 + Math.random() * 600
    setTimeout(() => {
      setTyping(false)
      const replyText = getHelperReply(helper, msgCount, msg)
      const reply = { id: Date.now() + 1, text: replyText, from: 'helper', time: new Date().toISOString() }
      // Log for future Claude analysis (silently)
      if (helper.isFromSupabase) {
        appendHelperChatLog(helper.id, msg, replyText).catch(() => {})
      }
      setMessages(prev => [...prev, reply])
      const newCount = msgCount + 1
      setMsgCount(newCount)
      addChat?.(helper.id, helper.name, helper.avatarColor, helper.avatar, replyText)

      // Nüra intervention at key moments
      const nura = getNuraIntervention(helper, newCount, messages)
      if (nura) {
        setTimeout(() => {
          const isBookingMoment = nura.includes('Confirmo la reserva') || nura.includes('confirmar')
          setMessages(prev => [...prev, {
            id: Date.now() + 2,
            text: nura,
            from: 'nura',
            time: new Date().toISOString(),
            chips: isBookingMoment ? ['Confirmar reserva', 'Todavía no'] : undefined,
          }])
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

  // Context-aware quick replies based on conversation stage
  // Context-aware next steps — push toward booking
  const lastMsgText = messages[messages.length - 1]?.text?.toLowerCase() || ''
  const mentionedPrice = messages.some(m => m.text?.includes('€') || m.text?.toLowerCase()?.includes('precio'))
  const mentionedDate  = messages.some(m => m.text?.toLowerCase().includes('lunes') || m.text?.toLowerCase().includes('martes') || m.text?.toLowerCase().includes('semana') || m.text?.toLowerCase().includes('mañana'))

  const QUICK_REPLIES = msgCount === 0 ? [
    '¿Tienes disponibilidad esta semana?',
    '¿Cuál es tu precio?',
    '¿Trabajas en mi zona?',
  ] : mentionedDate && mentionedPrice ? [
    'Perfecto, lo confirmo',
    'Quiero reservar',
  ] : mentionedDate ? [
    '¿Cuánto cobras?',
    'Me interesa, ¿cómo lo reservamos?',
  ] : mentionedPrice ? [
    '¿Tienes hueco esta semana?',
    'Me parece bien el precio',
  ] : msgCount <= 3 ? [
    '¿Cuándo puedes empezar?',
    '¿Tienes experiencia con casos como el mío?',
  ] : [
    'Quiero contratarte',
    'Voy a reservar ahora',
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
              {helper.dniVerified && <Shield size={10} color='var(--green)' style={{marginLeft:'3px',verticalAlign:'middle'}} />}
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
            {fromSearch && userQuery ? (
              <div style={{
                background:'linear-gradient(135deg,rgba(123,47,255,0.06),rgba(0,212,200,0.04))',
                border:'1px solid rgba(123,47,255,0.12)',
                borderRadius:'14px',padding:'10px 14px',
                marginBottom:'4px',maxWidth:'260px',textAlign:'left',
              }}>
                <p style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--purple)',margin:'0 0 4px',
                  letterSpacing:'0.3px',textTransform:'uppercase'}}>Nüra preparó tu mensaje</p>
                <p style={{fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.5)',margin:0,lineHeight:1.6}}>
                  He redactado un primer mensaje basado en lo que necesitas. Revísalo y envíalo cuando quieras.
                </p>
              </div>
            ) : null}
            <p className={styles.emptyChatName}>{helper.name}</p>
            <p className={styles.emptyChatDesc}>{helper.specialty} · {helper.zone}</p>
            {helper.price && <p className={styles.emptyChatPrice}>{helper.price}</p>}
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center',marginTop:'4px'}}>
              {helper.dniVerified && <span style={{fontSize:'var(--text-xs)',color:'var(--green)',background:'var(--green-light)',border:'1px solid rgba(5,150,105,0.15)',borderRadius:'100px',padding:'3px 10px',fontWeight:600}}>Verificado</span>}
              {helper.available && <span style={{fontSize:'var(--text-xs)',color:'var(--green)',background:'var(--green-light)',border:'1px solid rgba(5,150,105,0.15)',borderRadius:'100px',padding:'3px 10px',fontWeight:600}}>● Disponible</span>}
              <span style={{fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.4)',background:'rgba(0,0,0,0.04)',borderRadius:'100px',padding:'3px 10px'}}>⭐ {helper.rating} · {helper.reviews} reseñas</span>
            </div>
            {/* Conversation starters */}
            <div style={{display:'flex',flexDirection:'column',gap:'8px',marginTop:'20px',width:'100%',maxWidth:'280px'}}>
              <p style={{fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.4)',textAlign:'center',margin:0}}>Empieza la conversación</p>
              {[
                `¿Tienes disponibilidad esta semana?`,
                `¿Cuánto cobras por sesión?`,
                `¿Puedes contarme más sobre tu experiencia?`,
              ].map((q,i) => (
                <button key={i}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding:'11px 16px',
                    background:'rgba(255,255,255,0.85)',
                    border:'1px solid rgba(0,0,0,0.08)',
                    borderRadius:'14px',
                    fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.7)',
                    cursor:'pointer',textAlign:'left',
                    fontFamily:'-apple-system,"Inter",sans-serif',
                    transition:'opacity 0.15s',
                  }}>
                  {q}
                </button>
              ))}
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
                {isNura && msg.chips && (
                  <div style={{display:'flex',gap:'6px',marginTop:'8px',flexWrap:'wrap'}}>
                    {msg.chips.map((chip, ci) => (
                      <button key={ci}
                        onClick={() => {
                          if (chip === 'Confirmar reserva') { setShowConfirm(true); return }
                          if (chip === 'Todavía no') return
                          sendMessage(chip)
                        }}
                        style={{
                          padding:'5px 12px',borderRadius:'100px',fontSize:'var(--text-xs)',fontWeight:600,
                          cursor:'pointer',border:'none',
                          background: chip === 'Confirmar reserva'
                            ? 'var(--purple)' : 'rgba(0,0,0,0.07)',
                          color: chip === 'Confirmar reserva' ? 'white' : 'rgba(0,0,0,0.6)',
                          fontFamily:'inherit',
                        }}>
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
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
          <span className={styles.suggestionLabel}>Nüra sugiere</span>
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
      {showConfirm && (() => {
        const { extractedDate, extractedTime } = extractDateFromMessages(messages)
        return <ConfirmModal
          helper={helper}
          onClose={() => setShowConfirm(false)}
          onNavigate={navigate}
          prefillDate={extractedDate}
          prefillTime={extractedTime}
          onConfirm={(date, time, note) => { addService(helper, date, time, note) }}
        />
      })()}
    </div>
  )
}
