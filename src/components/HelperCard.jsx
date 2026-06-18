import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Shield, Zap, MessageCircle, Heart, MapPinned, Monitor } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { showToast } from './Toast'
import styles from './HelperCard.module.css'
import { haptic } from '../utils/haptic'

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
    navigate(`/chat/${helper.id}`, { state: { helper, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis } })
  }

  function handleFav(e) {
    e.stopPropagation()
    haptic('light')
    if (!user) { showToast('Inicia sesión para guardar favoritos'); return }
    toggleFavorite(helper.id)
    showToast(isFavorite(helper.id) ? 'Eliminado de favoritos' : 'Guardado en favoritos')
  }

  function handleTap() {
    const reason = window.__nuraMatchReasons?.[String(helper.id)]
    navigate(`/helper/${helper.id}`, { state: { helper, fromSearch: true, matchReason: reason, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis } })
  }

  const firstName = helper.name?.split(' ')[0]
  const lastName  = helper.name?.split(' ')[1]?.[0]

  return (
    <div className={styles.card} onClick={handleTap}>

      {/* ROW 1: Avatar + Name + Price */}
      <div className={styles.topRow}>
        <div className={styles.avatarWrap}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatar} />
            : <div className={styles.avatarFallback} style={{ background: helper.avatarColor || '#7B2FFF' }}>
                {helper.avatar || helper.name?.[0] || '?'}
              </div>
          }
          {helper.available && <span className={styles.availDot} />}
        </div>

        <div className={styles.info}>
          {/* Name row */}
          <div className={styles.name}>
            <span>{firstName}{lastName ? ` ${lastName}.` : ''}</span>
            {helper.dniVerified && <Shield size={9} color="var(--green)" style={{ marginLeft: 3 }} />}
          </div>

          {/* Specialty + distance */}
          <div className={styles.sub}>
            <span className={styles.specialty}>{helper.specialty}</span>
            {helper.distance && (
              <>
                <span className={styles.dot}>·</span>
                <MapPin size={8} color="rgba(0,0,0,0.3)" />
                <span>{helper.distance}km</span>
              </>
            )}
          </div>

          {/* Meta: rating + mode */}
          <div className={styles.meta}>
            <Star size={9} fill="var(--amber)" color="var(--amber)" />
            <span className={styles.metaStrong}>{helper.rating}</span>
            {helper.reviews > 0 && <span className={styles.metaMuted}>({helper.reviews})</span>}
            {(helper.presential || helper.online) && (
              <>
                <span className={styles.dot}>·</span>
                {helper.presential && helper.online
                  ? <span><MapPinned size={8}/> · <Monitor size={8}/></span>
                  : helper.presential
                  ? <span><MapPinned size={8}/></span>
                  : <span><Monitor size={8}/></span>
                }
              </>
            )}
            {helper.urgent && (
              <>
                <span className={styles.dot}>·</span>
                <Zap size={8} color="#DC2626" />
                <span style={{ color: '#DC2626', fontWeight: 600 }}>Urgencias</span>
              </>
            )}
          </div>
        </div>

        {/* Price + actions (right column) */}
        <div className={styles.right}>
          {helper.price && helper.price !== 'Consultar' && (
            <span className={styles.price}>{helper.price}</span>
          )}
          <div className={styles.actions}>
            <button className={styles.favBtn} onClick={handleFav}>
              <Heart size={12} fill={fav ? 'var(--red)' : 'none'} color={fav ? 'var(--red)' : 'rgba(0,0,0,0.3)'} />
            </button>
            {showContact && (
              <button className={styles.contactBtn} onClick={handleContact}>
                <MessageCircle size={11} /> Escribir
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
