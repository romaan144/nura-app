import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Shield } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import styles from './Chat.module.css'

function generateFirstMessage(helper) {
  const map = {
    logopedia: `Hola ${helper.name.split(' ')[0]}, me han recomendado tu perfil en Nüra. Necesito ayuda con logopedia para mi hijo. ¿Tienes disponibilidad esta semana?`,
    tecnico: `Hola ${helper.name.split(' ')[0]}, te contacto a través de Nüra. Tengo un problema con la caldera que necesita revisión. ¿Cuándo podrías venir?`,
    limpieza: `Hola ${helper.name.split(' ')[0]}, te encuentro en Nüra. Busco una persona de limpieza para mi casa una vez por semana. ¿Estarías disponible?`,
    cuidado: `Hola ${helper.name.split(' ')[0]}, te contacto por Nüra. Busco a alguien de confianza que acompañe a mi padre mayor unas horas al día. ¿Podríamos hablar?`,
    mascotas: `Hola ${helper.name.split(' ')[0]}, vi tu perfil en Nüra. Necesito a alguien que cuide a mi perro este fin de semana. ¿Estarías disponible?`,
    matematicas: `Hola ${helper.name.split(' ')[0]}, te encuentro en Nüra. Mi hijo necesita clases de refuerzo de matemáticas. ¿Darías clases en casa o prefieres online?`,
    entrenador: `Hola ${helper.name.split(' ')[0]}, te contacto a través de Nüra. Me gustaría empezar a entrenar y he visto tu perfil. ¿Cuándo podría ser esa primera sesión gratuita?`,
  }
  return map[helper.category] || `Hola ${helper.name.split(' ')[0]}, te contacto a través de Nüra. Me gustaría hablar sobre tu disponibilidad.`
}

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const helper = HELPERS.find(h => h.id === parseInt(id))
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [suggested, setSuggested] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!helper) return
    const first = generateFirstMessage(helper)
    setSuggested(first)
  }, [helper])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!helper) return <div className={styles.notFound}>No encontrado</div>

  function useSuggested() {
    setInput(suggested)
    setSuggested('')
  }

  function sendMessage() {
    if (!input.trim()) return
    const newMsg = { id: Date.now(), text: input, from: 'user', time: new Date() }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setSuggested('')

    // Simulate helper response
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        text: getHelperReply(helper),
        from: 'helper',
        time: new Date(),
      }
      setMessages(prev => [...prev, reply])
    }, 1200)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className={styles.helperInfo}>
          <div className={styles.avatar} style={{ background: helper.avatarColor }}>
            {helper.avatar}
          </div>
          <div>
            <div className={styles.helperName}>{helper.name}</div>
            <div className={styles.helperStatus}>
              <span className={styles.onlineDot} /> Activo ahora
            </div>
          </div>
        </div>
        <button className={styles.profileBtn} onClick={() => navigate(`/helper/${helper.id}`)}>
          Ver perfil
        </button>
      </header>

      {/* Messages */}
      <div className={styles.messages}>
        {/* Nüra intro note */}
        <div className={styles.systemNote}>
          <Shield size={12} />
          <span>Chat seguro a través de Nüra · Los datos personales se comparten solo cuando tú decides</span>
        </div>

        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <div className={styles.emptyChatAvatar} style={{ background: helper.avatarColor }}>
              {helper.avatar}
            </div>
            <p>Inicia la conversación con {helper.name.split(' ')[0]}</p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`${styles.msg} ${msg.from === 'user' ? styles.msgUser : styles.msgHelper}`}>
            {msg.from === 'helper' && (
              <div className={styles.msgAvatar} style={{ background: helper.avatarColor }}>
                {helper.avatar}
              </div>
            )}
            <div className={styles.msgBubble}>
              <p>{msg.text}</p>
              <span className={styles.msgTime}>
                {msg.time.getHours()}:{String(msg.time.getMinutes()).padStart(2,'0')}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested message */}
      {suggested && messages.length === 0 && (
        <div className={styles.suggestionBar}>
          <div className={styles.suggestionLabel}>💡 Nüra sugiere</div>
          <button className={styles.suggestionText} onClick={useSuggested}>
            {suggested}
          </button>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputBar}>
        <input
          className={styles.input}
          placeholder={`Escribe a ${helper.name.split(' ')[0]}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className={styles.sendBtn} onClick={sendMessage} disabled={!input.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}

function getHelperReply(helper) {
  const replies = {
    logopedia: "Hola! Claro, tengo disponibilidad esta semana. ¿Puedes contarme un poco más sobre las dificultades de tu hijo? Así puedo decirte si es mi especialidad.",
    tecnico: "Buenos días. Puedo pasarme hoy por la tarde o mañana a primera hora. ¿Qué marca es la caldera? Así vengo preparado.",
    limpieza: "Hola! Sí, tengo huecos. ¿Cuántos metros tiene la casa aproximadamente y qué días te vendrían mejor?",
    cuidado: "Buenas. Por supuesto, con mucho gusto. ¿Me puedes contar un poco más sobre tu padre? ¿Tiene movilidad reducida o necesidades especiales?",
    mascotas: "Hola! ¡Claro que sí! ¿Qué raza tiene? ¿Necesita paseos o cuidado en casa?",
    matematicas: "¡Hola! Sí, doy clases en casa o online, lo que sea más cómodo. ¿En qué curso está tu hijo y qué temas le cuestan más?",
    entrenador: "¡Hola! Perfecto. Tenemos la primera sesión gratis para evaluar tu estado físico y objetivos. ¿Te viene bien esta semana?",
  }
  return replies[helper.category] || "Hola! Gracias por contactarme. ¿Cuándo te vendría bien que hablemos?"
}
