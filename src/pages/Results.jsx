import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Shield, Zap, MessageCircle } from 'lucide-react'
import styles from './Results.module.css'

function HelperCard({ helper, query }) {
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
              <span className={styles.verifiedBadge}>
                <Shield size={11} /> Verificado
              </span>
            )}
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.rating}>
              <Star size={12} fill="#F59E0B" color="#F59E0B" />
              {helper.rating} ({helper.reviews})
            </span>
            <span className={styles.dot} />
            <span className={styles.distance}>
              <MapPin size={11} />
              {helper.distance} km · {helper.zone}
            </span>
            {helper.urgent && (
              <>
                <span className={styles.dot} />
                <span className={styles.urgentBadge}>
                  <Zap size={11} /> Urgencias
                </span>
              </>
            )}
          </div>
        </div>
        <div className={styles.price}>{helper.price}</div>
      </div>

      <p className={styles.bio}>{helper.bio}</p>

      <div className={styles.tags}>
        {helper.tags.slice(0, 3).map((t, i) => (
          <span key={i} className={styles.tag}>{t}</span>
        ))}
      </div>

      <div className={styles.cardActions}>
        <button
          className={styles.btnPrimary}
          onClick={e => { e.stopPropagation(); navigate(`/chat/${helper.id}`) }}
        >
          <MessageCircle size={15} />
          Contactar
        </button>
        <button
          className={styles.btnSecondary}
          onClick={e => { e.stopPropagation(); navigate(`/helper/${helper.id}`) }}
        >
          Ver perfil
        </button>
      </div>
    </div>
  )
}

export default function Results({ searchState, setSearchState }) {
  const navigate = useNavigate()
  const { query, analysis, matches } = searchState

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
        </button>
        <div className={styles.logo}>
          <svg viewBox="0 0 60 60" fill="none" width="28" height="28">
            <circle cx="30" cy="16" r="13" fill="url(#g1r)" opacity="0.9"/>
            <circle cx="18" cy="40" r="13" fill="url(#g2r)" opacity="0.9"/>
            <circle cx="42" cy="40" r="13" fill="url(#g3r)" opacity="0.9"/>
            <defs>
              <radialGradient id="g1r"><stop stopColor="#FF4B4B"/><stop offset="1" stopColor="#FF1493"/></radialGradient>
              <radialGradient id="g2r"><stop stopColor="#00E5D1"/><stop offset="1" stopColor="#0891B2"/></radialGradient>
              <radialGradient id="g3r"><stop stopColor="#9B5DE5"/><stop offset="1" stopColor="#6A0DAD"/></radialGradient>
            </defs>
          </svg>
          <span className={styles.logoText}>Nüra</span>
        </div>
      </header>

      <div className={styles.content}>
        {/* Query echo */}
        <div className={styles.queryBox}>
          <div className={styles.queryLabel}>Tu búsqueda</div>
          <p className={styles.queryText}>"{query}"</p>
        </div>

        {/* AI analysis pill */}
        <div className={styles.analysisPill}>
          <div className={styles.analysisItem}>
            {analysis.presencial ? '📍 Presencial' : '💻 Online'}
          </div>
          {analysis.urgente && (
            <div className={styles.analysisItemUrgent}>⚡ Urgente</div>
          )}
          <div className={styles.analysisItem}>
            {{student:'👤 Nivel básico', experienced:'⭐ Con experiencia', professional:'🎓 Profesional titulado'}[analysis.nivelRequerido]}
          </div>
        </div>

        {/* Results count */}
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            {matches.length > 0
              ? `${matches.length} personas encontradas`
              : 'Sin resultados exactos'
            }
          </h2>
          <p className={styles.resultsSubtitle}>{analysis.resumen}</p>
        </div>

        {/* Helper cards */}
        {matches.length > 0 ? (
          <div className={styles.cards}>
            {matches.map(h => (
              <HelperCard key={h.id} helper={h} query={query} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No encontramos coincidencias exactas.</p>
            <button className={styles.retryBtn} onClick={() => navigate('/')}>
              Intenta con otra búsqueda
            </button>
          </div>
        )}

        {/* New search */}
        <button className={styles.newSearch} onClick={() => navigate('/')}>
          Nueva búsqueda
        </button>
      </div>
    </div>
  )
}
