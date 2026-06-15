import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Mic, MicOff, Plus, Star, MapPin, Shield, MessageCircle, Award, Heart } from 'lucide-react'
import { analyzeNeed, matchHelpers } from '../utils/matching'
import { useUser } from '../context/UserContext'
import { MenuButton } from '../components/NavBar'
import { showToast } from '../components/Toast'
import styles from './Home.module.css'
import Onboarding from '../components/Onboarding'

function getWelcome(user) {
  if (!user) return [
    `Hola, soy **Nüra** ✨`,
    `Cuéntame qué **grad:necesitas** con tus palabras — buscaré a la persona ideal cerca de ti.`,
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
  if (user?.isHelper && (t.includes('aprendido') || t.includes('certificado') || t.includes('estudié') || t.includes('trabajé')))
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
    { icon: '❤️', text: 'Busco cuidadora para mi padre mayor' },
    { icon: '🔧', text: 'Técnico de calderas urgente' },
  ],
  helper: [
    { icon: '✨', text: 'Acabo de obtener una certificación' },
    { icon: '🏢', text: 'He trabajado en un nuevo sitio' },
    { icon: '📅', text: 'Quiero actualizar mi disponibilidad' },
  ],
}

function ResultCard({ helper, onNavigate, onFav, isFav }) {
  return (
    <div className={styles.resultCard} onClick={() => onNavigate(`/helper/${helper.id}`)}>
      <div className={styles.resultTop}>
        <div className={styles.resultAvatarWrap}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt={helper.name} className={styles.resultAvatarImg} />
            : <div className={styles.resultAvatarFallback} style={{background: helper.avatarColor}}>{helper.avatar}</div>
          }
          {helper.dniVerified && <span className={styles.resultVerified}><Shield size={8} /></span>}
        </div>
        <div className={styles.resultInfo}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px'}}>
            <div className={styles.resultName}>
              {helper.name}
              {helper.founder && <Award size={12} color='#92400E' style={{marginLeft:'4px',verticalAlign:'middle',flexShrink:0}} />}
            </div>
            <span style={{fontSize:'13px',fontWeight:700,color:helper.price && helper.price!=='Consultar'?'#7B2FFF':'#aaa',whiteSpace:'nowrap',flexShrink:0}}>
              {helper.price && helper.price !== 'Consultar' ? helper.price : 'Consultar'}
            </span>
          </div>
          <div className={styles.resultSpec}>{helper.specialty}</div>
          <div className={styles.resultMeta}>
            <span className={styles.resultRating}><Star size={11} fill="#F59E0B" color="#F59E0B" /> {helper.rating} <span style={{color:'#aaa'}}>({helper.reviews})</span></span>
            <span className={styles.resultDot} />
            <span className={styles.resultDist}>{helper.distance} km de ti</span>
          </div>
        </div>
      </div>
      <div className={styles.resultBottom}>
        <div className={styles.resultTags}>
          {helper.urgent && <span className={styles.resultUrgent}>⚡ Urgencias</span>}
          {helper.presential && <span className={styles.resultTag}>📍 Presencial</span>}
          {helper.online && <span className={styles.resultTag}>💻 Online</span>}
          <span className={styles.resultTag}>⏱ {helper.responseTime}</span>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <button
            onClick={e => { e.stopPropagation(); onFav?.(helper.id) }}
            style={{width:'32px',height:'32px',borderRadius:'50%',background:'white',border:'none',boxShadow:'0 1px 4px rgba(0,0,0,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Heart size={14} fill={isFav ? '#EF4444' : 'none'} color={isFav ? '#EF4444' : '#999'} />
          </button>
          <button className={styles.resultContact}
            onClick={e => { e.stopPropagation(); onNavigate(`/chat/${helper.id}`) }}>
            <MessageCircle size={14} /> Contactar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home({ setSearchState }) {
  const navigate = useNavigate()
  const { user, addSearch, toggleFavorite, isFavorite, searchHistory } = useUser()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [inputFocused, setInputFocused] = useState(false)
  const [lastMatches, setLastMatches] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const lines = getWelcome(user)
    const msgs = [{ id: 1, from: 'nura', lines }]

    // For users who have searched before — add a personalized insight
    if (user && searchHistory?.length >= 2) {
      msgs.push({
        id: 2, from: 'nura',
        lines: [`Por cierto, la semana pasada buscaste **${searchHistory[0]?.query}**. ¿Encontraste lo que necesitabas o quieres que vuelva a buscar?`],
        quickOptions: ['Sí, ya lo resolví ✓', 'No, busca de nuevo']
      })
    }

    setTimeout(() => setMessages(msgs), 300)

    // Proactive question for helpers after 8s of inactivity
    if (user?.isHelper) {
      const t = setTimeout(() => {
        setMessages(prev => {
          if (prev.length > 1) return prev // user already engaged
          return [...prev, {
            id: Date.now(), from: 'nura',
            lines: ['Por cierto, ¿has trabajado en algo nuevo últimamente o completado alguna formación? Cuéntamelo para actualizar tu perfil.']
          }]
        })
      }, 8000)
      return () => clearTimeout(t)
    }
  }, [user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function formatLine(line) {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        if (part.startsWith('grad:')) return <span key={i} className={styles.gradText}>{part.slice(5)}</span>
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

    // Context-aware responses
    const t = msg.toLowerCase()
    if (lastMatches) {
      // User confirms — guide to profile
      if (t.includes('sí') || t.includes('si') || t.includes('me convence') || t.includes('perfecto') || t.includes('ese') || t.includes('bien')) {
        setTimeout(() => {
          setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: [`Perfecto. Pulsa en el perfil para ver toda la información y contactarle directamente.`] }])
          setLoading(false)
        }, 800)
        return
      }
      // User wants to refine
      if (t.includes('no') || t.includes('otro') || t.includes('más barato') || t.includes('más cerca') || t.includes('diferente') || t.includes('ajusta') || t.includes('filtra')) {
        const refined = await matchHelpers({ categoria: 'otro', palabrasClave: msg.toLowerCase().split(' ').filter(w => w.length > 3) }, 4, msg, lastMatches)
        if (refined?.length) {
          const resultMsg = { id: Date.now(), from: 'nura', lines: [`He ajustado los resultados.`], results: refined }
          setMessages(prev => [...prev, resultMsg])
          setTimeout(() => setMessages(prev => [...prev, { id: Date.now()+1, from: 'nura', lines: ['¿Mejor así?'] }]), 1200)
          setLastMatches(refined)
          setLoading(false)
          return
        }
      }
    }

    // Refinement — if user is refining previous results
    if (lastMatches && intent === 'search') {
      const refined = await matchHelpers({ categoria: 'otro', palabrasClave: msg.toLowerCase().split(' ') }, 4, msg, lastMatches)
      if (refined?.length) {
        const resultMsg = { id: Date.now(), from: 'nura', lines: [`He ajustado los resultados.`], results: refined }
        setMessages(prev => [...prev, resultMsg])
        setTimeout(() => setMessages(prev => [...prev, { id: Date.now()+1, from: 'nura', lines: ['¿Te convence alguno?'] }]), 1200)
        setLastMatches(refined)
        setLoading(false)
        return
      }
    }

    if (intent === 'update_profile') {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['He actualizado tu perfil con esta información. Nüra lo analizará y añadirá las habilidades relevantes automáticamente.'] }])
        setLoading(false)
      }, 1200)
      return
    }
    if (intent === 'b2b') {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['El acceso empresarial está disponible en Fase 3. Si quieres verificar que alguien ha trabajado contigo, cuéntame su nombre y qué quieres que conste.'] }])
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
      const matches = await matchHelpers(analysis, 4)
      setMessages(prev => prev.filter(m => !m.loading))

      if (!matches?.length) {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['No encontré a nadie disponible ahora mismo. Prueba a describirlo de otra forma.'] }])
        setLoading(false)
        return
      }

      addSearch?.(msg)
      setSearchState({ query: msg, analysis, matches })
      setLastMatches(matches)

      const resultMsg = { id: Date.now(), from: 'nura', lines: [`He encontrado **${matches.length} personas** que pueden ayudarte.`], results: matches }
      setMessages(prev => [...prev, resultMsg])
      setTimeout(() => setMessages(prev => [...prev, { id: Date.now()+1, from: 'nura', lines: ['¿Te convence alguno o prefieres ajustar la búsqueda?'] }]), 1500)
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
        <div className={styles.headerLogoPill}>
          <img src="/logo-text.png" alt="Nüra" className={styles.headerLogo} />
        </div>
        <button className={styles.profileBtn} onClick={() => navigate('/profile')} style={{flexShrink:0,width:'38px',height:'38px',minWidth:'38px'}}>
          {user?.name
            ? <img src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name)}`} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
            : '?'
          }
        </button>
      </div>

      <div className={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id}>
            <div className={`${styles.msgRow} ${msg.from === 'user' ? styles.msgRowUser : ''}`}>
              {msg.from === 'nura' && (
                <div className={styles.nuraAvatar}>
                  <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
                </div>
              )}
              <div className={`${styles.bubble} ${msg.from === 'user' ? styles.bubbleUser : styles.bubbleNura}`}>
                {msg.text && <p>{msg.text}</p>}
                {msg.lines?.map((line, i) => <p key={i}>{formatLine(line)}</p>)}
                {msg.loading && <div className={styles.typingDots}><span /><span /><span /></div>}
              {msg.quickOptions && (
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'8px'}}>
                  {msg.quickOptions.map((opt,i) => (
                    <button key={i}
                      style={{padding:'7px 14px',background:'var(--paper)',border:'1.5px solid var(--rule)',borderRadius:'16px',fontSize:'12px',color:'var(--mid)',cursor:'pointer',transition:'all 0.15s'}}
                      onClick={() => {
                        setShowSuggestions(false)
                        if (opt.includes('busca')) handleSend(searchHistory[0]?.query)
                        else setMessages(prev => [...prev, {id:Date.now(),from:'nura',lines:['Me alegra saberlo 🎉 Estoy aquí cuando lo necesites.']}])
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              </div>
            </div>
            {msg.results && (
              <div className={styles.resultsList}>
                {msg.results.map(h => <ResultCard key={h.id} helper={h} onNavigate={navigate} onFav={id => { toggleFavorite(id); showToast(isFavorite(id) ? 'Eliminado de favoritos' : 'Guardado en favoritos') }} isFav={isFavorite(h.id)} />)}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {inputFocused && !input && searchHistory?.length > 0 && (
        <div className={styles.recentSearches}>
          <span className={styles.recentLabel}>Búsquedas recientes</span>
          {searchHistory.slice(0, 3).map((s, i) => (
            <button key={i} className={styles.recentItem} onClick={() => handleSend(s.query)}>
              <span className={styles.recentIcon}>🕐</span>
              <span className={styles.recentText}>{s.query}</span>
            </button>
          ))}
        </div>
      )}

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

      <div className={styles.inputWrap}>
        <div className={styles.inputBar}>
          <button className={styles.plusBtn}><Plus size={18} /></button>
          <input ref={inputRef} className={styles.input}
            placeholder="Escribe a Nüra..."
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey} disabled={loading}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setTimeout(() => setInputFocused(false), 200)} />
          {input.trim()
            ? <button className={styles.sendBtn} onClick={() => handleSend()}><Send size={16} /></button>
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
