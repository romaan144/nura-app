import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Shield, Zap, MessageCircle } from 'lucide-react'
import styles from './Results.module.css'

function HelperCard({ helper }) {
  const navigate = useNavigate()
  return (
    <div className={styles.card} onClick={() => navigate(`/helper/${helper.id}`)}>
      <div className={styles.cardTop}>
        <div className={styles.avatar} style={{ background: helper.avatarColor }}>
          {helper.avatar}
        </div>
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>
            {helper.name}
            {helper.verified && (
              <span className={styles.verifiedBadge}><Shield size={10} /> Verificado</span>
            )}
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.rating}>
              <Star size={12} fill="#F59E0B" color="#F59E0B" />
              {helper.rating} ({helper.reviews})
            </span>
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
          Ver perfil
        </button>
      </div>
    </div>
  )
}

export default function Results({ searchState }) {
  const navigate = useNavigate()
  const { query, analysis, matches } = searchState

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}><ArrowLeft size={18} /></button>
        <img src="/logo.png" alt="Nüra" className={styles.logoImg} />
      </header>

      <div className={styles.content}>
        <div className={styles.queryBox}>
          <div className={styles.queryLabel}>Tu búsqueda</div>
          <p className={styles.queryText}>"{query}"</p>
        </div>

        <div className={styles.analysisPill}>
          <span className={styles.pill + ' ' + styles.pillNormal}>
            {analysis.presencial ? '📍 Presencial' : '💻 Online o presencial'}
          </span>
          {analysis.urgente && <span className={styles.pill + ' ' + styles.pillUrgent}>⚡ Urgente</span>}
          <span className={styles.pill + ' ' + styles.pillNormal}>
            {{ student:'👤 No requiere titulación', experienced:'⭐ Con experiencia', professional:'🎓 Profesional titulado' }[analysis.nivelRequerido]}
          </span>
        </div>

        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            {matches.length > 0 ? `${matches.length} personas encontradas` : 'Sin resultados'}
          </h2>
          <p className={styles.resultsSubtitle}>{analysis.resumen}</p>
        </div>

        {matches.length > 0 ? (
          <div className={styles.cards}>
            {matches.map(h => <HelperCard key={h.id} helper={h} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No encontramos coincidencias exactas para tu búsqueda.</p>
            <button className={styles.retryBtn} onClick={() => navigate('/')}>Intentar de nuevo</button>
          </div>
        )}

        <button className={styles.newSearch} onClick={() => navigate('/')}>
          Nueva búsqueda
        </button>
      </div>
    </div>
  )
}
