import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Mic, MicOff, Plus, Star, MapPin, Shield, MessageCircle, Award, Heart } from 'lucide-react'
import { analyzeNeed, matchHelpers } from '../utils/matching'
import { useUser } from '../context/UserContext'
import { MenuButton } from '../components/NavBar'
import { showToast } from '../components/Toast'
import RegisterGate from '../components/RegisterGate'
import { haptic } from '../utils/haptic'
import { scheduleLocalNotification } from '../utils/notifications'
import styles from './Home.module.css'

function getWelcome(user) {
  const hour = new Date().getHours()
  const greeting = hour < 14 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches'
  if (!user) return [
    `Hola. Soy **Nüra**, una IA que entiende lo que necesitas y encuentra a la persona real que puede ayudarte — verificada, cerca de ti y disponible ahora.`,
  ]
  if (user.isHelper) return [
    `${greeting}, **${user.name?.split(' ')[0]}**. ¿Qué necesitas hoy?`,
  ]
  return [
    `${greeting}, **${user.name?.split(' ')[0]}**. ¿Qué necesitas?`,
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
    { text: 'Cuidadora de mayores' },
    { text: 'Logopeda infantil' },
    { text: 'Técnico urgente' },
    { text: 'Limpieza del hogar' },
    { text: 'Cuidado de mascotas' },
    { text: 'Clases particulares' },
  ],
  helper: [
    { text: 'Nueva certificación' },
    { text: 'Actualizar disponibilidad' },
    { text: 'Mejorar mi perfil' },
    { text: 'Nueva experiencia' },
  ],
}

function ResultCard({ helper, onNavigate, onFav, isFav }) {
  return (
    <div className={styles.resultCard} onClick={() => onNavigate(`/helper/${helper.id}`, { state: { helper } })}>
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
            <Star size={11} fill="#F59E0B" color="#F59E0B" />
            <span className={styles.resultRating}>{helper.rating}</span>
            <span className={styles.resultMetaDot}>·</span>
            <MapPin size={10} color="#aaa" />
            <span>{helper.distance} km</span>
            <span className={styles.resultMetaDot}>·</span>
            <span>{helper.reviews} reseñas</span>
          </div>
        </div>
      </div>
      <div className={styles.resultBottom}>
        <div className={styles.resultTags}>
          {helper.urgent && <span className={styles.resultUrgent}>⚡ Urgencias</span>}
          {helper.presential && helper.online
            ? <span className={styles.resultTag}>Presencial · Online</span>
            : helper.presential ? <span className={styles.resultTag}>📍 Presencial</span>
            : helper.online ? <span className={styles.resultTag}>💻 Online</span> : null}
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
      {showGate && <RegisterGate reason={gateReason} onClose={() => setShowGate(false)} />}
    </div>
  )
}

export default function Home({ setSearchState }) {
  const navigate = useNavigate()
  const { user, addSearch, toggleFavorite, isFavorite, searchHistory, nuraChatMessages, setNuraChatMessages, nuraLastMatches, setNuraLastMatches, cacheHelpers } = useUser()
  // messages persisted in context so they survive navigation
  const messages = nuraChatMessages
  const setMessages = setNuraChatMessages
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [showGate, setShowGate] = useState(false)
  const [gateReason, setGateReason] = useState('contact')
  // showSuggestions: hide once user has chatted
  const showSuggestions = nuraChatMessages.length <= 1
  const setShowSuggestions = () => {} // no-op, derived from messages
  const [inputFocused, setInputFocused] = useState(false)
  const lastMatches = nuraLastMatches
  const setLastMatches = setNuraLastMatches
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

    // Only init if no previous conversation
    if (nuraChatMessages.length === 0) {
      setTimeout(() => setMessages(msgs), 300)
    }

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
    haptic('light')

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
        const topMatch = lastMatches?.[0]
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [`Perfecto. Pulsa en la tarjeta para ver el perfil completo y contactarle directamente.`]
          }])
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
      clearInterval(window.__nuraStatusInterval)
      setMessages(prev => prev.filter(m => !m.loading))

      if (!matches?.length) {
        setMessages(prev => [...prev, {
          id: Date.now(), from: 'nura',
          lines: ['No encontré exactamente lo que describes en tu zona. Puedes ampliar la búsqueda, cambiar la modalidad a online, o cuéntame más detalles del caso.'],
          chips: ['Ampliar zona', 'Online también', 'Cuéntame más']
        }])
        setLoading(false)
        return
      }

      addSearch?.(msg)
      setSearchState({ query: msg, analysis, matches })
      setLastMatches(matches)
      // Schedule reminder if user doesn't contact
      scheduleLocalNotification(
        '¿Te convencieron los resultados?',
        `Tienes ${matches.length} profesionales esperando tu mensaje en Nüra.`,
        2 * 60 * 60 * 1000
      )
      // Cache helpers for instant profile + chat loading
      if (matches?.length) {
        const cacheMap = {}
        matches.forEach(h => {
          if (h?.id) {
            cacheMap[h.id] = h
            cacheMap[String(h.id)] = h
            cacheMap[parseInt(h.id)] = h
          }
        })
        window.__nuraHelperCache = { ...(window.__nuraHelperCache || {}), ...cacheMap }
        // Also cache in UserContext via cacheHelpers
        cacheHelpers?.(matches)
      }

      const resultMsg = { id: Date.now(), from: 'nura', lines: [`He encontrado **${matches.length} personas** que pueden ayudarte.`], results: matches }
      setMessages(prev => [...prev, resultMsg])
      const followUp = matches.length >= 3
        ? '¿Te convence alguno? También puedo filtrar más.'
        : matches.length > 0
        ? `Solo encontré ${matches.length} opciones. ¿Quieres que amplíe la búsqueda?`
        : '¿Reformulamos la búsqueda?'
      setTimeout(() => setMessages(prev => [...prev, {
        id: Date.now()+1, from: 'nura',
        lines: [followUp],
        chips: ['Más barato', 'Más cerca', 'Mejor valorado', 'Con urgencias']
      }]), 1500)
    } catch {
      clearInterval(window.__nuraStatusInterval)
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

  const allSuggestions = user?.isHelper ? SUGGESTIONS.helper : SUGGESTIONS.default
  const suggestions = allSuggestions.slice(0, 3)

  return (
    <div className={styles.page}>
      {/* Floating top — three independent bubbles */}
      <div className={styles.floatTop}>
        <button
          className={styles.logoBubble}
          style={{position:'static',transform:'none',padding:'0',width:'42px',height:'42px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all'}}
          onClick={() => window.__openDrawer?.()}>
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            <rect width="18" height="2" rx="1" fill="rgba(0,0,0,0.65)"/>
            <rect y="5" width="14" height="2" rx="1" fill="rgba(0,0,0,0.65)"/>
            <rect y="10" width="18" height="2" rx="1" fill="rgba(0,0,0,0.65)"/>
          </svg>
        </button>
        <div className={styles.logoBubble}>
          <img src="/logo-text.png" alt="Nüra" className={styles.headerLogo} />
        </div>
        <button
          className={styles.logoBubble}
          style={{position:'static',transform:'none',padding:'0',width:'42px',height:'42px',borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all'}}
          onClick={() => navigate('/profile')}>
          {user?.name
            ? <img src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name)}`} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
            : <span style={{fontSize:'16px',color:'rgba(0,0,0,0.5)'}}>?</span>
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
              {msg.chips && (
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'8px'}}>
                  {msg.chips.map((chip,i) => (
                    <button key={i} onClick={() => handleSend(chip)}
                      style={{padding:'5px 12px',borderRadius:'100px',background:'rgba(0,0,0,0.06)',border:'none',fontSize:'12px',fontWeight:500,color:'rgba(0,0,0,0.7)',cursor:'pointer',transition:'opacity 0.15s'}}>
                      {chip}
                    </button>
                  ))}
                </div>
              )}
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
            {!user && messages.length === 1 && msg.from === 'nura' && (
              <div style={{display:'flex',gap:'20px',padding:'4px 0',flexWrap:'wrap'}}>
                {[['1.200+','profesionales verificados'],['4.8★','valoración media'],['< 1h','primer contacto']].map(([n,l]) => (
                  <div key={l} style={{textAlign:'center'}}>
                    <div style={{fontSize:'15px',fontWeight:800,color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>{n}</div>
                    <div style={{fontSize:'11px',color:'rgba(0,0,0,0.4)',fontWeight:400}}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            {msg.results && (
              <div className={styles.resultsList}>
                {msg.results.map(h => <ResultCard key={h.id} helper={h} onNavigate={navigate} onFav={id => { if(!user){setShowGate(true);setGateReason('favorite')} else { toggleFavorite(id); showToast(isFavorite(id)?'Eliminado de favoritos':'Guardado en favoritos') } }} isFav={isFavorite(h.id)} />)}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Floating bottom — suggestions + input capsule */}
      <div className={styles.floatBottom}>
        {inputFocused && !input && searchHistory?.length > 0 && (
          <div className={styles.recentSearches}>
            <span className={styles.recentLabel}>Recientes</span>
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
                <span className={styles.suggestionText}>{s.text}</span>
              </button>
            ))}
          </div>
        )}

        <div className={styles.inputCapsule}>
          <button className={styles.plusBtn}><Plus size={18} /></button>
          <input ref={inputRef} className={styles.input}
            placeholder="¿Qué necesitas?"
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

      {showGate && <RegisterGate reason={gateReason} onClose={() => setShowGate(false)} />}
    </div>
  )
}
