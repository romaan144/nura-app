import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Shield, Zap, MessageCircle, Search, X, ChevronRight } from 'lucide-react'
import { matchHelpers } from '../utils/matching'
import { useUser } from '../context/UserContext'
import styles from './Results.module.css'

function HelperCard({ helper }) {
  const navigate = useNavigate()
  const { contactedHelpers } = useUser()
  const alreadyContacted = contactedHelpers?.includes(helper.id)
  return (
    <div className={styles.card} onClick={() => navigate(`/helper/${helper.id}`)}>
      <div className={styles.cardMain}>
        {helper.avatarUrl
        ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatarImg} />
        : <div className={styles.avatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
      }
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>
            {helper.name.split(' ')[0]} {helper.name.split(' ')[1]}
            {helper.verified && <span className={styles.verifiedDot}><Shield size={9} /></span>}
          </div>
          <div className={styles.cardSpecialty}>{helper.specialty || helper.tags[0]}</div>
          <div className={styles.cardMeta}>
            <Star size={11} fill="#F59E0B" color="#F59E0B" />
            <span className={styles.ratingVal}>{helper.rating}</span>
            <span className={styles.dot} />
            <MapPin size={10} />
            <span>{helper.distance}km</span>
            {helper.urgent && <><span className={styles.dot} /><Zap size={10} color="var(--red)" /><span style={{color:'var(--red)',fontWeight:600}}>Hoy</span></>}
          </div>
          <div className={styles.matchReason}>
        💡 {helper.distance < 1 ? 'Muy cerca de ti' : `A ${helper.distance}km`} · {helper.responseTime} de respuesta · {helper.completionRate}% completados
      </div>
      <div className={styles.cardTags}>
            {helper.tags.slice(0,2).map((t,i) => <span key={i} className={styles.tag}>{t}</span>)}
          </div>
        </div>
        <div className={styles.cardRight}>
          <div className={styles.price}>{helper.price}</div>
          <ChevronRight size={16} color="var(--soft)" />
        </div>
      </div>
      <div className={styles.cardActions}>
        <button className={styles.btnPrimary} onClick={e => { e.stopPropagation(); navigate(`/chat/${helper.id}`) }}>
          <MessageCircle size={13} /> Contactar
        </button>
        <button className={styles.btnSecondary} onClick={e => { e.stopPropagation(); navigate(`/helper/${helper.id}`) }}>
          Ver perfil
        </button>
      </div>
    </div>
  )
}

export default function Results({ searchState }) {
  const navigate = useNavigate()
  const { query, analysis, matches } = searchState
  const [refineText, setRefineText] = useState('')
  const [refinements, setRefinements] = useState([])
  const [currentMatches, setCurrentMatches] = useState(matches)
  const [refining, setRefining] = useState(false)

  function handleRefine() {
    if (!refineText.trim()) return
    setRefining(true)
    setTimeout(() => {
      const refined = matchHelpers(analysis, 5, refineText, currentMatches)
      setCurrentMatches(refined)
      setRefinements(prev => [...prev, refineText])
      setRefineText('')
      setRefining(false)
    }, 400)
  }

  function removeRefinement(idx) {
    const newR = refinements.filter((_, i) => i !== idx)
    let result = matches
    newR.forEach(r => { result = matchHelpers(analysis, 5, r, result) })
    setCurrentMatches(result)
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
        <div className={styles.queryBox}>
          <div className={styles.queryLabel}>Tu búsqueda</div>
          <p className={styles.queryText}>"{query}"</p>
        </div>

        <div className={styles.analysisPill}>
          <span className={styles.pill + ' ' + styles.pillNormal}>{analysis.presencial ? '📍 Presencial' : '💻 Online'}</span>
          {analysis.urgente && <span className={styles.pill + ' ' + styles.pillUrgent}>⚡ Urgente</span>}
          <span className={styles.pill + ' ' + styles.pillNormal}>
            {{ student:'👤 Sin titulación', experienced:'⭐ Con experiencia', professional:'🎓 Profesional' }[analysis.nivelRequerido]}
          </span>
        </div>

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

        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>{currentMatches.length} personas encontradas</h2>
          <p className={styles.resultsSubtitle}>{analysis.resumen}</p>
        </div>

        {currentMatches.length > 0 ? (
          <div className={styles.cards}>
            {currentMatches.map(h => <HelperCard key={h.id} helper={h} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>Sin coincidencias con estos filtros.</p>
            <button className={styles.retryBtn} onClick={() => { setCurrentMatches(matches); setRefinements([]) }}>Quitar filtros</button>
          </div>
        )}

        <button className={styles.newSearch} onClick={() => navigate('/')}>Nueva búsqueda</button>
      </div>
    </div>
  )
}
