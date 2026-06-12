import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Shield, Zap, MessageCircle, Search, X } from 'lucide-react'
import { matchHelpers } from '../utils/matching'
import styles from './Results.module.css'

function HelperCard({ helper }) {
  const navigate = useNavigate()
  return (
    <div className={styles.card} onClick={() => navigate(`/helper/${helper.id}`)}>
      <div className={styles.cardTop}>
        <div className={styles.avatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>
            {helper.name}
            {helper.verified && <span className={styles.verifiedBadge}><Shield size={10} /> Verificado</span>}
            {helper.founder && <span className={styles.founderBadge}>⭐ Fundador</span>}
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.rating}><Star size={12} fill="#F59E0B" color="#F59E0B" />{helper.rating} ({helper.reviews})</span>
            <span className={styles.dot} />
            <span className={styles.distance}><MapPin size={11} />{helper.distance} km · {helper.zone}</span>
            {helper.urgent && <><span className={styles.dot} /><span className={styles.urgentBadge}><Zap size={11} />Urgencias</span></>}
          </div>
        </div>
        <div className={styles.price}>{helper.price}</div>
      </div>
      <p className={styles.bio}>{helper.bio}</p>
      <div className={styles.tags}>
        {helper.tags.slice(0,3).map((t,i) => <span key={i} className={styles.tag}>{t}</span>)}
      </div>
      <div className={styles.cardActions}>
        <button className={styles.btnPrimary} onClick={e => { e.stopPropagation(); navigate(`/chat/${helper.id}`) }}>
          <MessageCircle size={14} /> Contactar
        </button>
        <button className={styles.btnSecondary} onClick={e => { e.stopPropagation(); navigate(`/helper/${helper.id}`) }}>
          Ver perfil completo
        </button>
      </div>
    </div>
  )
}

export default function Results({ searchState, setSearchState }) {
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
    const newRefinements = refinements.filter((_, i) => i !== idx)
    // Reapply remaining refinements from scratch
    let result = matches
    newRefinements.forEach(r => {
      result = matchHelpers(analysis, 5, r, result)
    })
    setCurrentMatches(result)
    setRefinements(newRefinements)
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleRefine()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}><ArrowLeft size={18} /></button>
        <img src="/logo-text.png" alt="Nüra" className={styles.logoImg} />
      </header>

      <div className={styles.content}>
        {/* Query original */}
        <div className={styles.queryBox}>
          <div className={styles.queryLabel}>Tu búsqueda</div>
          <p className={styles.queryText}>"{query}"</p>
        </div>

        {/* Pills de análisis */}
        <div className={styles.analysisPill}>
          <span className={styles.pill + ' ' + styles.pillNormal}>
            {analysis.presencial ? '📍 Presencial' : '💻 Online o presencial'}
          </span>
          {analysis.urgente && <span className={styles.pill + ' ' + styles.pillUrgent}>⚡ Urgente</span>}
          <span className={styles.pill + ' ' + styles.pillNormal}>
            {{ student:'👤 Sin titulación requerida', experienced:'⭐ Con experiencia', professional:'🎓 Profesional titulado' }[analysis.nivelRequerido]}
          </span>
        </div>

        {/* Filtros aplicados */}
        {refinements.length > 0 && (
          <div className={styles.refinementsApplied}>
            <span className={styles.refinementsLabel}>Filtros aplicados:</span>
            {refinements.map((r, i) => (
              <span key={i} className={styles.refinementTag}>
                {r}
                <button onClick={() => removeRefinement(i)}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}

        {/* ── REFINAMIENTO ── */}
        <div className={styles.refineBox}>
          <div className={styles.refineTitle}>
            <Search size={13} />
            Refina tu búsqueda
          </div>
          <p className={styles.refineHint}>
            Puedes seguir filtrando: "que sea mujer", "menor de 30 años", "online", "menos de 1 km", "disponible hoy"...
          </p>
          <div className={styles.refineInputWrap}>
            <input
              className={styles.refineInput}
              placeholder='Ej: "que sea mujer y pueda venir hoy"'
              value={refineText}
              onChange={e => setRefineText(e.target.value)}
              onKeyDown={handleKey}
              disabled={refining}
            />
            <button
              className={styles.refineBtn}
              onClick={handleRefine}
              disabled={!refineText.trim() || refining}
            >
              {refining ? <div className={styles.spinner} /> : <Search size={15} />}
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            {currentMatches.length > 0 ? `${currentMatches.length} personas encontradas` : 'Sin resultados'}
          </h2>
          <p className={styles.resultsSubtitle}>{analysis.resumen}</p>
        </div>

        {currentMatches.length > 0 ? (
          <div className={styles.cards}>
            {currentMatches.map(h => <HelperCard key={h.id} helper={h} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No hay coincidencias con estos filtros.</p>
            <button className={styles.retryBtn} onClick={() => { setCurrentMatches(matches); setRefinements([]) }}>
              Quitar filtros
            </button>
          </div>
        )}

        <button className={styles.newSearch} onClick={() => navigate('/')}>
          Nueva búsqueda desde cero
        </button>
      </div>
    </div>
  )
}
