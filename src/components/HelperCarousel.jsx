import { useNavigate } from 'react-router-dom'
import { Star, Shield, MessageCircle, Heart, MapPin } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { showToast } from './Toast'
import styles from './HelperCarousel.module.css'
import { haptic } from '../utils/haptic'

/**
 * HelperCarousel — horizontal scroll of compact helper cards.
 * Used in the Home chat after search results.
 * Tapping a card goes to chat directly (not profile).
 * Compact format: avatar, name, specialty, rating, price, one CTA.
 */
function CarouselCard({ helper, isTopPick, matchReason }) {
  const navigate = useNavigate()
  const { user, toggleFavorite, isFavorite } = useUser()
  const fav = isFavorite(helper.id)

  function handleContact(e) {
    e.stopPropagation()
    haptic('medium')
    if (!user) {
      sessionStorage.setItem('nura_return_to', `/chat/${helper.id}`)
      sessionStorage.setItem('nura_pending_helper', JSON.stringify(helper))
      showToast('Crea tu cuenta para contactar')
      setTimeout(() => navigate('/login'), 600)
      return
    }
    navigate(`/chat/${helper.id}`, { state: { helper, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis } })
  }

  function handleFav(e) {
    e.stopPropagation()
    if (!user) { showToast('Inicia sesión para guardar favoritos'); return }
    toggleFavorite(helper.id)
    showToast(fav ? 'Eliminado de favoritos' : 'Guardado en favoritos')
  }

  return (
    <div
      className={styles.card}
      style={{position:'relative'}}
      onClick={() => {
      const reason = window.__nuraMatchReasons?.[String(helper.id)]
      navigate(`/helper/${helper.id}`, { state: { helper, fromSearch: true, matchReason: reason } })
    }}>

      {/* Top pick indicator */}
      {isTopPick && (
        <div style={{
          position:'absolute',top:-1,left:-1,right:-1,bottom:-1,
          borderRadius:'inherit',border:'1.5px solid var(--purple)',
          pointerEvents:'none',zIndex:1,
        }}/>
      )}
      {isTopPick && (
        <div style={{
          position:'absolute',top:-9,left:'50%',transform:'translateX(-50%)',
          background:'var(--purple)',color:'white',
          fontSize:'8px',fontWeight:800,letterSpacing:'0.8px',
          padding:'2px 8px',borderRadius:'100px',
          whiteSpace:'nowrap',zIndex:2,
        }}>
          NÜRA RECOMIENDA
        </div>
      )}

      {/* Avatar + availability */}
      <div className={styles.avatarWrap}>
        {helper.avatarUrl
          ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatar} />
          : <div className={styles.avatarFallback} style={{ background: helper.avatarColor || '#7B2FFF' }}>
              {helper.avatar || helper.name?.[0]}
            </div>
        }
        {helper.available && <span className={styles.availDot} />}
        <button className={styles.favBtn} onClick={handleFav}>
          <Heart size={11} fill={fav ? '#EF4444' : 'none'} color={fav ? '#EF4444' : 'rgba(0,0,0,0.3)'} />
        </button>
      </div>

      {/* Info */}
      <div className={styles.name}>
        {helper.name?.split(' ')?.[0]} {helper.name?.split(' ')?.[1]?.[0]}.
        {helper.dniVerified && <Shield size={9} color="#059669" style={{ marginLeft: 3, verticalAlign: 'middle' }} />}
      </div>
      <div className={styles.specialty}>{helper.specialty}</div>

      {/* Rating + distance */}
      <div className={styles.meta}>
        <Star size={9} fill="#F59E0B" color="#F59E0B" />
        <span>{helper.rating}</span>
        <span className={styles.metaDot}>·</span>
        <MapPin size={8} color="rgba(0,0,0,0.3)" />
        <span>{helper.distance || 1.2}km</span>
      </div>

      {/* Match reason micro-text — why Nüra chose this helper */}
      {matchReason && (
        <p style={{
          fontSize:'10px',color:'rgba(0,0,0,0.45)',margin:'2px 0 0',
          lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,
          WebkitBoxOrient:'vertical',overflow:'hidden',
          fontStyle:'italic',
        }}>
          {matchReason.replace(/^\*\*[^*]+\*\*[^:]+: /,'')}
        </p>
      )}

      {/* Top tag */}
      {!matchReason && helper.tags?.[0] && (
        <div style={{
          fontSize:'9px',color:'rgba(0,0,0,0.4)',
          background:'rgba(0,0,0,0.04)',
          borderRadius:'100px',padding:'2px 7px',
          alignSelf:'center',fontWeight:500,
          whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
          maxWidth:'120px',
        }}>{helper.tags[0]}</div>
      )}

      {/* Price */}
      {helper.price && helper.price !== 'Consultar' && (
        <div className={styles.price}>{helper.price}</div>
      )}

      {/* CTA */}
      <button className={styles.contactBtn} onClick={handleContact}>
        <MessageCircle size={12} /> Escribir
      </button>
    </div>
  )
}

export default function HelperCarousel({ helpers }) {
  if (!helpers?.length) return null
  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        {helpers.map((h, i) => { const reason = window.__nuraMatchReasons?.[String(h.id)]; return h && <CarouselCard key={h.id} helper={h} isTopPick={i === 0} matchReason={reason} /> })}
      </div>
    </div>
  )
}
