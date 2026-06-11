import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, ArrowRight, MapPin } from 'lucide-react'
import { analyzeNeed, matchHelpers } from '../utils/matching'
import styles from './Home.module.css'

const SUGGESTIONS = [
  "Logopeda paciente para mi hijo de 7 años",
  "La caldera no calienta, es urgente",
  "Cuidadora para mi padre mayor unas horas al día",
  "Clases de matemáticas para mi hijo de 12 años",
  "Persona de limpieza una vez por semana",
  "Alguien que cuide mi perro este fin de semana",
]

export default function Home({ setSearchState }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const textareaRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
    }
  }, [text])

  async function handleSearch() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const analysis = await analyzeNeed(text)
      const matches = matchHelpers(analysis)
      setSearchState({ query: text, analysis, matches })
      navigate('/results')
    } catch (e) {
      setError('No se pudo conectar. Comprueba tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch() }
  }

  function toggleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tu navegador no soporta voz. Escribe tu consulta.')
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

      {/* ── HEADER: solo wordmark ── */}
      <header className={styles.header}>
        <img src="/logo-text.png" alt="Nüra" className={styles.logoText} />
        <div className={styles.location}>
          <MapPin size={12} />
          Barcelona
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className={styles.main}>

        {/* Isotipo animado centrado */}
        <div className={styles.isotipoWrap}>
          <div className={styles.isotipoGlow} />
          <img
            src="/logo-iso.png"
            alt=""
            className={`${styles.isotipo} ${loading ? styles.isotipoLoading : ''}`}
          />
        </div>

        {/* Título */}
        <div className={styles.hero}>
          <h1 className={styles.title}>¿Qué necesitas?</h1>
          <p className={styles.subtitle}>
            Descríbelo con tus palabras. Nüra encuentra a la persona adecuada.
          </p>
        </div>

        {/* Search box */}
        <div className={styles.searchBox}>
          <div className={styles.inputCard}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="Necesito un logopeda paciente para mi hijo de 7 años..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <div className={styles.inputFooter}>
              <span className={styles.inputHint}>
                {text.length > 0 ? `${text.length} caracteres` : 'Intro para buscar'}
              </span>
              <div className={styles.inputActions}>
                <button
                  className={`${styles.micBtn} ${listening ? styles.micActive : ''}`}
                  onClick={toggleMic}
                  title={listening ? 'Parar' : 'Hablar'}
                >
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  className={styles.sendBtn}
                  onClick={handleSearch}
                  disabled={!text.trim() || loading}
                >
                  {loading
                    ? <><div className={styles.spinner} /> Buscando...</>
                    : <><ArrowRight size={16} /> Buscar</>
                  }
                </button>
              </div>
            </div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {loading && <p className={styles.loadingText}>Nüra está analizando tu necesidad...</p>}
        </div>

        {/* Suggestions */}
        {!loading && (
          <div className={styles.suggestions}>
            <p className={styles.suggestLabel}>Búsquedas frecuentes</p>
            <div className={styles.chips}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className={styles.chip} onClick={() => setText(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>La IA que conecta personas · Barcelona · nura.app</p>
      </footer>
    </div>
  )
}
