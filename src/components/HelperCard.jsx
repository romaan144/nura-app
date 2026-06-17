import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Shield, Zap, Award, MessageCircle, Heart } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { showToast } from './Toast'
import styles from './HelperCard.module.css'
import { haptic } from '../utils/haptic'

/**
 * HelperCard — single card component used in Home, Results and Explore.
 * Consistent visual language across the entire app.
 *
 * Props:
 *  helper       — helper object
 *  onContact    — optional override for contact button (defaults to chat navigation)
 *  compact      — if true, hides bio (for inline Home results)
 *  showContact  — show "Contactar" button (default true)
 */
export default function HelperCard({ helper, onContact, compact = false, showContact = true }) {
  const navigate = useNavigate()
  const { user, toggleFavorite, isFavorite } = useUser()
  if (!helper) return null

  const fav = isFavorite(helper.id)

  function handleContact(e) {
    e.stopPropagation()
    haptic('medium')
    if (onContact) { onContact(helper); return }
    if (!user) {
      sessionStorage.setItem('nura_return_to', `/chat/${helper.id}`)
      sessionStorage.setItem('nura_pending_helper', JSON.stringify(helper))
      showToast('Crea tu cuenta para contactar con este profesional')
      setTimeout(() => navigate('/login'), 600)
      return
    }
    navigate(`/chat/${helper.id}`, { state: { helper } })
  }

  function handleFav(e) {
    e.stopPropagation()
    haptic('light')
    if (!user) { showToast('Inicia sesión para guardar favoritos'); return }
    toggleFavorite(helper.id)
    showToast(isFavorite(helper.id) ? 'Eliminado de favoritos' : 'Guardado en favoritos')
  }

  return (
    <div
      className={styles.card}
      onClick={() => {
      const reason = window.__nuraMatchReasons?.[String(helper.id)]
      navigate(`/helper/${helper.id}`, { state: { helper, fromSearch: true, matchReason: reason } })
    }}>

      {/* TOP BADGE */}
      {helper.rating >= 4.9 && helper.reviews >= 20 && (
        <div className={styles.topBadge}>TOP</div>
      )}

      {/* MAIN ROW: avatar + info + price */}
      <div className={styles.main}>
        <div className={styles.avatarWrap}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatar} />
            : <div className={styles.avatarFallback} style={{ background: helper.avatarColor || '#1A56DB' }}>
                {helper.avatar || helper.name?.[0] || '?'}
              </div>
          }
          {helper.available && <span className={styles.availDot} />}
        </div>

        <div className={styles.info}>
          <div className={styles.name}>
            {helper.name}
            {helper.dniVerified && <Shield size={10} color="#059669" style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
            {helper.founder && <Award size={10} color="#92400E" style={{ marginLeft: 3, verticalAlign: 'middle' }} />}
          </div>
          <div className={styles.specialty}>{helper.specialty}</div>
          <div className={styles.meta}>
            <Star size={10} fill="#F59E0B" color="#F59E0B" />
            <span>{helper.rating}</span>
            <span className={styles.dot}>·</span>
            <MapPin size={9} color="rgba(0,0,0,0.35)" />
            <span>{helper.zone || helper.city || 'Barcelona'}</span>
            {helper.reviews > 0 && <>
              <span className={styles.dot}>·</span>
              <span>{helper.reviews} reseñas</span>
            </>}
            {helper.urgent && <>
              <span className={styles.dot}>·</span>
              <Zap size={9} color="#DC2626" />
              <span style={{ color: '#DC2626', fontWeight: 600 }}>Urgencias</span>
            </>}
            {helper.responseTime && !helper.urgent && <>
              <span className={styles.dot}>·</span>
              <span>Resp. {helper.responseTime}</span>
            </>}
            {helper.completionRate >= 95 && <>
              <span className={styles.dot}>·</span>
              <span style={{color:'#059669',fontWeight:600}}>{helper.completionRate}% completado</span>
            </>}
          </div>
        </div>

        <div className={styles.right}>
          {helper.price && helper.price !== 'Consultar' && (
            <span className={styles.price}>{helper.price}</span>
          )}
        </div>
      </div>

      {/* BIO SNIPPET */}
      {!compact && helper.bio && (
        <p className={styles.bio}>
          {helper.bio.length > 100 ? helper.bio.slice(0, 100) + '…' : helper.bio}
        </p>
      )}

      {/* SPECIALTY TAGS */}
      {helper.tags?.length > 0 && (
        <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginTop:'-4px'}}>
          {helper.tags.slice(0,3).map((tag,i) => (
            <span key={i} style={{
              fontSize:'10px',color:'rgba(0,0,0,0.45)',
              background:'rgba(0,0,0,0.04)',
              borderRadius:'100px',padding:'2px 8px',fontWeight:500,
            }}>{tag}</span>
          ))}
        </div>
      )}

      {/* BOTTOM: tags + actions */}
      <div className={styles.bottom}>
        <div className={styles.tags}>
          {helper.presential && helper.online
            ? <span className={styles.tag}>Presencial · Online</span>
            : helper.presential
            ? <span className={styles.tag}>📍 Presencial</span>
            : helper.online
            ? <span className={styles.tag}>💻 Online</span>
            : null}
        </div>

        <div className={styles.actions}>
          <button className={styles.favBtn} onClick={handleFav}>
            <Heart size={13} fill={fav ? '#EF4444' : 'none'} color={fav ? '#EF4444' : 'rgba(0,0,0,0.35)'} />
          </button>
          {showContact && (
            <button className={styles.contactBtn} onClick={handleContact}>
              <MessageCircle size={12} /> Contactar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
