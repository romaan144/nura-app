import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, ArrowRight, MapPin } from 'lucide-react'
import { analyzeNeed, matchHelpers } from '../utils/matching'
import styles from './Home.module.css'

const SUGGESTIONS = [
  "Necesito un logopeda para mi hijo de 7 años",
  "La caldera no calienta, es urgente",
  "Busco a alguien que cuide mi perro este fin de semana",
  "Clases de matemáticas para mi hijo de 12 años",
  "Quiero una persona de limpieza una vez por semana",
  "Alguien que acompañe a mi padre mayor",
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
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  function toggleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tu navegador no soporta voz. Escribe tu consulta.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'es-ES'
    rec.onresult = e => {
      setText(e.results[0][0].transcript)
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    setListening(true)
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
              <circle cx="30" cy="16" r="13" fill="url(#g1)" opacity="0.9"/>
              <circle cx="18" cy="40" r="13" fill="url(#g2)" opacity="0.9"/>
              <circle cx="42" cy="40" r="13" fill="url(#g3)" opacity="0.9"/>
              <defs>
                <radialGradient id="g1" cx="50%" cy="30%"><stop stopColor="#FF4B4B"/><stop offset="1" stopColor="#FF1493"/></radialGradient>
                <radialGradient id="g2" cx="30%" cy="40%"><stop stopColor="#00E5D1"/><stop offset="1" stopColor="#0891B2"/></radialGradient>
                <radialGradient id="g3" cx="70%" cy="40%"><stop stopColor="#9B5DE5"/><stop offset="1" stopColor="#6A0DAD"/></radialGradient>
              </defs>
            </svg>
          </div>
          <span className={styles.logoText}>Nüra</span>
        </div>
        <div className={styles.location}>
          <MapPin size={13} />
          <span>Barcelona</span>
        </div>
      </header>

      {/* Hero */}
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            ¿Qué necesitas?
          </h1>
          <p className={styles.subtitle}>
            Descríbelo con tus palabras. Nüra encuentra a la persona adecuada.
          </p>
        </div>

        {/* Search box */}
        <div className={styles.searchBox}>
          <div className={styles.inputWrap}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="Necesito un logopeda paciente para mi hijo de 7 años en Barcelona..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <div className={styles.actions}>
              <button
                className={`${styles.micBtn} ${listening ? styles.micActive : ''}`}
                onClick={toggleMic}
                title="Hablar"
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                className={styles.sendBtn}
                onClick={handleSearch}
                disabled={!text.trim() || loading}
              >
                {loading
                  ? <div className={styles.spinner} />
                  : <ArrowRight size={20} />
                }
              </button>
            </div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {loading && (
            <p className={styles.loadingText}>
              Nüra está analizando tu necesidad...
            </p>
          )}
        </div>

        {/* Suggestions */}
        {!loading && (
          <div className={styles.suggestions}>
            <p className={styles.suggestLabel}>Ejemplos frecuentes</p>
            <div className={styles.chips}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className={styles.chip}
                  onClick={() => setText(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer tagline */}
      <footer className={styles.footer}>
        <p>La IA que conecta personas · Barcelona · nura.app</p>
      </footer>
    </div>
  )
}
