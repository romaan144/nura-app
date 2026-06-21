import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Shield, Zap, MessageCircle, Heart, MapPinned, Monitor } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { showToast } from './Toast'
import styles from './HelperCard.module.css'
import { haptic } from '../utils/haptic'
import { getFirstName } from '../utils/name'

export default function HelperCard({ helper, onContact, showContact = true }) {
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

  const firstName = getFirstName(helper.name)
  const lastName  = helper.name?.split(' ')[1]?.[0]

  return (
    <div className={styles.card} onClick={handleTap}>
      {/* ROW: Avatar + Info + CTA (always same height) */}
      <div className={styles.row}>

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatar} />
            : <div className={styles.avatarFallback} style={{ background: helper.avatarColor || 'var(--purple)' }}>
                {helper.avatar || helper.name?.[0] || '?'}
              </div>
          }
          {helper.available && <span className={styles.availDot} />}
        </div>

        {/* Info */}
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{firstName}{lastName ? ` ${lastName}.` : ''}</span>
            {helper.dniVerified && <Shield size={9} color="var(--green)" />}
          </div>
          <div className={styles.sub}>
            <span className={styles.specialty}>{helper.specialty}</span>
            {helper.distance && (
              <><span className={styles.dot}>·</span><MapPin size={8} color="rgba(0,0,0,0.3)" /><span>{helper.distance}km</span></>
            )}
          </div>
          <div className={styles.meta}>
            <Star size={9} fill="var(--amber)" color="var(--amber)" />
            <span className={styles.metaStrong}>{helper.rating}</span>
            {helper.reviews > 0 && <span className={styles.metaMuted}>({helper.reviews})</span>}
            {helper.price && helper.price !== 'Consultar' && (
              <><span className={styles.dot}>·</span><span className={styles.price}>{helper.price}</span></>
            )}
            {helper.urgent && <><span className={styles.dot}>·</span><Zap size={8} color="var(--red)" /></>}
          </div>
        </div>

        {/* CTA — always vertically centered */}
        <div className={styles.cta}>
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
  )
}
