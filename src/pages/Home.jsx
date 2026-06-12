import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, ArrowRight, MapPin } from 'lucide-react'
import { analyzeNeed, matchHelpers } from '../utils/matching'
import { useUser } from '../context/UserContext'
import styles from './Home.module.css'
import Onboarding from '../components/Onboarding'

const SUGGESTIONS = [
  { icon: '🔧', text: 'La caldera no calienta, es urgente' },
  { icon: '🗣️', text: 'Logopeda para mi hijo de 7 años' },
  { icon: '👴', text: 'Cuidadora para mi padre mayor' },
  { icon: '📐', text: 'Clases de matemáticas, 12 años' },
  { icon: '🧹', text: 'Limpieza del hogar una vez por semana' },
  { icon: '🐕', text: 'Cuidar mi perro este fin de semana' },
]

export default function Home({ setSearchState }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const textareaRef = useRef(null)
  const navigate = useNavigate()
  const { user, searchHistory, addSearch } = useUser()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [text])

  async function handleSearch() {
    if (!text.trim()) return
    setLoading(true); setError('')
    try {
      const analysis = await analyzeNeed(text)
      const matches = matchHelpers(analysis)
      addSearch(text)
      setSearchState({ query: text, analysis, matches })
      navigate('/results')
    } catch { setError('No se pudo conectar. Comprueba tu conexión.') }
    finally { setLoading(false) }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch() }
  }

  function toggleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tu navegador no soporta voz.'); return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'es-ES'
    rec.onresult = e => { setText(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start(); setListening(true)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img src="/logo-text.png" alt="Nüra" className={styles.logoText} />
        <div className={styles.location}><MapPin size={12} /> Barcelona</div>
      </header>

      <main className={styles.main}>
        <div className={styles.isotipoWrap}>
          <div className={styles.isotipoGlow} />
          <img src="/logo-iso.png" alt=""
            className={`${styles.isotipo} ${loading ? styles.isotipoLoading : ''}`} />
        </div>

        <div className={styles.hero}>
          <h1 className={styles.title}>¿Qué <span className={styles.titleAccent}>necesitas?</span></h1>
          <p className={styles.subtitle}>Descríbelo con tus palabras. Nüra encuentra a la persona adecuada.</p>
        </div>

        <div className={styles.searchBox}>
          <div className={styles.inputCard}>
            <textarea ref={textareaRef} className={styles.textarea}
              placeholder="Necesito un logopeda paciente para mi hijo de 7 años..."
              aria-label="Describe lo que necesitas"
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={handleKey} rows={1} disabled={loading} />
            <div className={styles.inputFooter}>
              <span className={styles.inputHint}>{text.length > 0 ? `${text.length} caracteres` : 'Intro para buscar'}</span>
              <div className={styles.inputActions}>
                <button className={`${styles.micBtn} ${listening ? styles.micActive : ""}`} onClick={toggleMic} aria-label={listening ? "Parar grabación" : "Buscar por voz"}>
                  {listening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
<button className={styles.sendBtn} onClick={handleSearch} disabled={!text.trim() || loading} aria-label="Buscar">
                  {loading ? <><div className={styles.spinner} /> Buscando...</> : <><ArrowRight size={15} /> Buscar</>}
                </button>
              </div>
            </div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {loading && <p className={styles.loadingText}>Nüra está analizando tu necesidad...</p>}
        </div>

        {!loading && (
          <div className={styles.suggestions}>
            <p className={styles.suggestLabel}>Búsquedas frecuentes</p>
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

      {searchHistory.length > 0 && !loading && text.length === 0 && (
        <div className={styles.recentWrap}>
          <p className={styles.suggestLabel}>Búsquedas recientes</p>
          <div className={styles.recentList}>
            {searchHistory.slice(0,3).map((s, i) => (
              <button key={i} className={styles.recentItem} onClick={() => setText(s.query)}>
                🕐 {s.query}
              </button>
            ))}
          </div>
        </div>
      )}
      <Onboarding />
      <footer className={styles.footer}>
        <p>La IA que conecta personas · Barcelona · nura.app</p>
      </footer>
    </div>
  )
}
