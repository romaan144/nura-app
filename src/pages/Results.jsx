import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Shield, Zap, MessageCircle, Search, X, ChevronRight } from 'lucide-react'
import { matchHelpers } from '../utils/matching'
import { useUser } from '../context/UserContext'
import styles from './Results.module.css'

function HelperCard({ helper }) {
  const navigate = useNavigate()
  if (!helper) return null

  return (
    <div className={styles.card} onClick={() => navigate(`/helper/${helper.id}`)}>
      <div className={styles.cardMain}>
        {helper.avatarUrl
          ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatarImg} />
          : <div className={styles.avatar} style={{ background: helper.avatarColor || '#1A56DB' }}>{helper.avatar || '?'}</div>
        }
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>
            {helper.name}
            {helper.verified && <span className={styles.verifiedDot}><Shield size={9} /></span>}
          </div>
          <div className={styles.cardSpecialty}>{helper.specialty || (helper.tags && helper.tags[0]) || ''}</div>
          <div className={styles.cardMeta}>
            <Star size={11} fill="#F59E0B" color="#F59E0B" />
            <span className={styles.ratingVal}>{helper.rating}</span>
            <span className={styles.dot} />
            <MapPin size={10} />
            <span>{helper.distance}km</span>
            {helper.urgent && <><span className={styles.dot} /><Zap size={10} color="var(--red)" /><span style={{color:'var(--red)',fontWeight:600}}>Hoy</span></>}
          </div>
          <div className={styles.matchReason}>
            💡 {helper.zone} · {helper.responseTime} respuesta · {helper.completionRate}% completados
          </div>
        </div>
        <div className={styles.cardRight}>
          <ChevronRight size={16} color="var(--soft)" />
        </div>
      </div>
      <div className={styles.cardActions}>
        <div className={styles.actionsLeft}>
          <button className={styles.btnPrimary} onClick={e => { e.stopPropagation(); navigate(`/chat/${helper.id}`) }}>
            <MessageCircle size={13} /> Contactar
          </button>
          <button className={styles.btnSecondary} onClick={e => { e.stopPropagation(); navigate(`/helper/${helper.id}`) }}>
            Ver perfil
          </button>
        </div>
        <div className={styles.price}>{helper.price}</div>
      </div>
    </div>
  )
}

export default function Results({ searchState }) {
  const navigate = useNavigate()
  const { cacheHelpers } = useUser()

  // Safety check — if no searchState, go home
  if (!searchState) {
    navigate('/')
    return null
  }

  const { query, analysis, matches } = searchState
  const safeMatches = Array.isArray(matches) ? matches : []

  const [refineText, setRefineText] = useState('')
  const [refinements, setRefinements] = useState([])
  const [currentMatches, setCurrentMatches] = useState(safeMatches)
  const [refining, setRefining] = useState(false)

  useEffect(() => {
    if (safeMatches.length > 0) {
      cacheHelpers?.(safeMatches)
      setCurrentMatches(safeMatches)
    }
  }, [])

  async function handleRefine() {
    if (!refineText.trim()) return
    setRefining(true)
    try {
      const refined = await matchHelpers(analysis, 5, refineText, currentMatches)
      setCurrentMatches(Array.isArray(refined) ? refined : currentMatches)
      setRefinements(prev => [...prev, refineText])
      setRefineText('')
    } finally {
      setRefining(false)
    }
  }

  function removeRefinement(idx) {
    const newR = refinements.filter((_, i) => i !== idx)
    setCurrentMatches(safeMatches)
    setRefinements(newR)
  }

  function handleKey(e) { if (e.key === 'Enter') handleRefine() }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}><ArrowLeft size={18} /></button>
        <img src="/logo-text.png" alt="Nüra" className={styles.logoImg} />
      </header>

      <div className={styles.content}>
        {/* Query */}
        <div className={styles.queryBox}>
          <div className={styles.queryLabel}>Tu búsqueda</div>
          <p className={styles.queryText}>"{query}"</p>
        </div>

        {/* Analysis pills */}
        {analysis && (
          <div className={styles.analysisPill}>
            <span className={styles.pill + ' ' + styles.pillNormal}>
              {analysis.presencial ? '📍 Presencial' : '💻 Online'}
            </span>
            {analysis.urgente && <span className={styles.pill + ' ' + styles.pillUrgent}>⚡ Urgente</span>}
            <span className={styles.pill + ' ' + styles.pillNormal}>
              {{ student:'👤 Sin titulación', experienced:'⭐ Con experiencia', professional:'🎓 Profesional' }[analysis.nivelRequerido] || '⭐ Con experiencia'}
            </span>
          </div>
        )}

        {/* Refine */}
        <div className={styles.refineBox}>
          <div className={styles.refineTitle}><Search size={13} /> Refina tu búsqueda</div>
          <div className={styles.refineInputWrap}>
            <input className={styles.refineInput}
              placeholder='Ej: "disponible hoy y menos de 1 km"'
              value={refineText} onChange={e => setRefineText(e.target.value)}
              onKeyDown={handleKey} disabled={refining} />
            <button className={styles.refineBtn} onClick={handleRefine} disabled={!refineText.trim() || refining}>
              {refining ? <div className={styles.spinner} /> : <Search size={14} />}
            </button>
          </div>
          {refinements.length > 0 && (
            <div className={styles.refinementsApplied}>
              {refinements.map((r, i) => (
                <span key={i} className={styles.refinementTag}>
                  {r} <button onClick={() => removeRefinement(i)}><X size={9} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>{currentMatches.length} personas encontradas</h2>
          {analysis && <p className={styles.resultsSubtitle}>{analysis.resumen}</p>}
        </div>

        {currentMatches.length > 0 ? (
          <div className={styles.cards}>
            {currentMatches.map((h, i) => h && <HelperCard key={h.id || i} helper={h} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No encontramos resultados para esta búsqueda.</p>
            <button className={styles.retryBtn} onClick={() => navigate('/')}>Intentar de nuevo</button>
          </div>
        )}

        <button className={styles.newSearch} onClick={() => navigate('/')}>Nueva búsqueda</button>
      </div>
    </div>
  )
}
