import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, ArrowRight, MapPin, Sparkles, TrendingUp, Users, Shield } from 'lucide-react'
import { analyzeNeed, matchHelpers } from '../utils/matching'
import styles from './Home.module.css'
import Onboarding from '../components/Onboarding'
import { useUser } from '../context/UserContext'

const SUGGESTIONS = [
  { icon: '🔧', text: 'La caldera no calienta, es urgente', cat: 'técnico' },
  { icon: '🗣️', text: 'Logopeda para mi hijo de 7 años', cat: 'logopedia' },
  { icon: '👴', text: 'Cuidadora para mi padre mayor con Alzheimer', cat: 'cuidado' },
  { icon: '📐', text: 'Clases de matemáticas para mi hijo de 12 años', cat: 'clases' },
  { icon: '🧹', text: 'Limpieza del hogar una vez por semana', cat: 'limpieza' },
  { icon: '🐕', text: 'Cuidar mi perro este fin de semana', cat: 'mascotas' },
  { icon: '💪', text: 'Entrenador personal a domicilio', cat: 'deporte' },
  { icon: '🏠', text: 'Fontanero urgente, hay una fuga', cat: 'técnico' },
]

const STATS = [
  { icon: <Users size={16} />, val: '1.200+', label: 'Helpers verificados' },
  { icon: <Shield size={16} />, val: '100%', label: 'Identidades verificadas' },
  { icon: <Sparkles size={16} />, val: '4.8★', label: 'Valoración media' },
]

export default function Home({ setSearchState }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const textareaRef = useRef(null)
  const navigate = useNavigate()
  const { addSearch } = useUser()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [text])

  async function handleSearch() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const analysis = await analyzeNeed(text)
      const matches = await matchHelpers(analysis)
      if (!matches || matches.length === 0) {
        setError('No encontramos resultados. Prueba con otra búsqueda.')
        setLoading(false)
        return
      }
      addSearch?.(text)
      setSearchState({ query: text, analysis, matches })
      navigate('/results')
    } catch(e) {
      console.error(e)
      setError('Error al buscar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch() }
  }

  function toggleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tu navegador no soporta voz.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'es-ES'
    rec.onresult = e => { setText(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    setListening(true)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img src="/logo-text.png" alt="Nüra" className={styles.logoText} />
        <div className={styles.location}><MapPin size={12} /> Barcelona</div>
      </header>

      <main className={styles.main}>
        {/* Isotipo */}
        <div className={styles.isotipoWrap}>
          <div className={styles.isotipoGlow} />
          <img src="/logo-iso.png" alt=""
            className={`${styles.isotipo} ${loading ? styles.isotipoLoading : ''}`} />
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <h1 className={styles.title}>¿Qué <span className={styles.titleAccent}>necesitas?</span></h1>
          <p className={styles.subtitle}>
            Descríbelo con tus palabras. Nüra entiende el contexto,
            la urgencia y la cualificación que necesitas.
          </p>
        </div>

        {/* Search */}
        <div className={styles.searchBox}>
          <div className={styles.inputCard}>
            <textarea ref={textareaRef} className={styles.textarea}
              placeholder="Ej: Necesito un logopeda paciente para mi hijo de 7 años en Barcelona..."
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={handleKey} rows={1} disabled={loading}
              aria-label="Describe lo que necesitas" />
            <div className={styles.inputFooter}>
              <span className={styles.inputHint}>
                {text.length > 0 ? `${text.length} caracteres · Intro para buscar` : 'Cuéntanos qué necesitas'}
              </span>
              <div className={styles.inputActions}>
                <button
                  className={`${styles.micBtn} ${listening ? styles.micActive : ''}`}
                  onClick={toggleMic}
                  aria-label={listening ? 'Parar grabación' : 'Buscar por voz'}>
                  {listening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
                <button className={styles.sendBtn} onClick={handleSearch}
                  disabled={!text.trim() || loading} aria-label="Buscar">
                  {loading
                    ? <><div className={styles.spinner} /> Buscando...</>
                    : <><ArrowRight size={15} /> Buscar</>}
                </button>
              </div>
            </div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {loading && <p className={styles.loadingText}>Nüra está analizando tu necesidad...</p>}
        </div>

        {/* Stats strip */}
        {!loading && (
          <div className={styles.statsStrip}>
            {STATS.map((s, i) => (
              <div key={i} className={styles.statItem}>
                <span className={styles.statIcon}>{s.icon}</span>
                <span className={styles.statVal}>{s.val}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {!loading && (
          <div className={styles.suggestions}>
            <p className={styles.suggestLabel}>
              <TrendingUp size={11} /> Búsquedas frecuentes
            </p>
            <div className={styles.chips}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className={styles.chip} onClick={() => setText(s.text)}>
                  <span className={styles.chipIcon}>{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <Onboarding />

      <footer className={styles.footer}>
        <p>La IA que conecta personas · Barcelona · nura.app</p>
      </footer>
    </div>
  )
}
