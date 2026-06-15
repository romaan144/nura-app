import { useNavigate } from 'react-router-dom'
import { LogOut, Star, MessageCircle, ChevronRight, Shield, Award, TrendingUp, Sparkles, BarChart2, Users, Clock, Calendar } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useUser } from '../context/UserContext'
import { HELPERS } from '../data/helpers'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, logout, chats, ratings } = useUser()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className={styles.noUser}>
        <div className={styles.noUserIso}>
          <img src="/logo-iso.png" alt="Nüra" className={styles.noUserLogo} />
        </div>
        <h2>Únete a Nüra</h2>
        <p>Crea tu perfil para acceder a tu historial, conversaciones y más.</p>
        <button className={styles.loginBtn} onClick={() => navigate('/login')}>Iniciar sesión</button>
        <button className={styles.helperBtn} onClick={() => navigate('/register-helper')}>
          ✨ Quiero ser Helper
        </button>
      </div>
    )
  }

  const daysSince = user.joined
    ? Math.floor((new Date() - new Date(user.joined)) / (1000 * 60 * 60 * 24))
    : 0

  const totalUnread = (chats || []).reduce((s, c) => s + (c.unread || 0), 0)

  return (
    <div className={styles.page}>
      <PageHeader rightEl={<button className={styles.settingsBtn} onClick={() => { logout(); navigate('/') }}><LogOut size={17} /></button>} />

      <div className={styles.content}>

        {/* Hero */}
        <div className={styles.heroCard}>
          <img src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name)}`} alt={user.name} className={styles.avatar} style={{objectFit:'cover'}} />
          <h2 className={styles.name}>{user.name}</h2>
          <p className={styles.phone}>{user.phone ? `+34 ${user.phone}` : ''}</p>
          {user.isHelper && (
            <div className={styles.helperBadges}>
              <span className={styles.founderBadge}><Award size={11} /> Helper Fundador</span>
              <span className={styles.verifiedBadge}><Shield size={11} /> Verificado</span>
            </div>
          )}
          <p className={styles.memberSince}>Miembro desde hace {daysSince} días</p>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {[
            { val: chats?.length || 0, label: 'Contactos', icon: <MessageCircle size={14} />, color: 'var(--purple)' },
            { val: ratings?.length || 0, label: 'Valoraciones', icon: <Star size={14} />, color: '#F59E0B' },
            { val: totalUnread, label: 'Sin leer', icon: <Clock size={14} />, color: 'var(--red)' },
          ].map((s, i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statIcon} style={{color:s.color}}>{s.icon}</span>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLbl}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Helper dashboard */}
        {user.isHelper && user.helperProfile && (
          <div className={styles.section}>
            <div className={styles.actionRow} onClick={() => navigate('/my-services')}>
              <span className={styles.actionIcon}><Calendar size={16} /></span>
              <span className={styles.actionLabel}>Mis servicios</span>
              <ChevronRight size={16} color="var(--soft)" />
            </div>
            <h3 className={styles.sectionTitle} style={{marginTop:'16px'}}><BarChart2 size={13} /> Tu perfil de helper</h3>
            <div className={styles.helperDashboard}>
              <div className={styles.dashRow}>
                <div className={styles.dashItem}>
                  <span className={styles.dashVal} style={{background:'var(--grad-main)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Activo</span>
                  <span className={styles.dashLbl}>Estado</span>
                </div>
                <div className={styles.dashItem}>
                  <span className={styles.dashVal}>0</span>
                  <span className={styles.dashLbl}>Servicios</span>
                </div>
                <div className={styles.dashItem}>
                  <span className={styles.dashVal}>—</span>
                  <span className={styles.dashLbl}>Valoración</span>
                </div>
              </div>
              <div className={styles.helperInfo}>
                <div className={styles.helperRow}>
                  <span className={styles.helperKey}>Servicio</span>
                  <span className={styles.helperVal}>{user.helperProfile.category}</span>
                </div>
                <div className={styles.helperRow}>
                  <span className={styles.helperKey}>Zona</span>
                  <span className={styles.helperVal}>{user.helperProfile.zone}</span>
                </div>
                <div className={styles.helperRow}>
                  <span className={styles.helperKey}>Precio</span>
                  <span className={styles.helperVal}>{user.helperProfile.price}</span>
                </div>
              </div>
              <div className={styles.liveProfileNote}>
                <Sparkles size={12} />
                <span>Tu perfil vivo se construye automáticamente con cada servicio que completes</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent ratings */}
        {ratings?.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><Star size={13} /> Tus valoraciones</h3>
            {ratings.slice(-3).reverse().map((r, i) => {
              const helper = HELPERS.find(h => h.id === r.helperId)
              return (
                <div key={i} className={styles.ratingCard}>
                  <div className={styles.ratingAvatar} style={{background: helper?.avatarColor || '#7C3AED'}}>
                    {helper?.avatar || '?'}
                  </div>
                  <div className={styles.ratingInfo}>
                    <div className={styles.ratingName}>{helper?.name || 'Helper'}</div>
                    <div className={styles.ratingStars}>
                      {[1,2,3,4,5].map(n => <Star key={n} size={11} fill={n <= r.rating ? '#F59E0B' : 'none'} color="#F59E0B" />)}
                    </div>
                    {r.comment && <p className={styles.ratingComment}>"{r.comment}"</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}


          {searchHistory?.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🕐 Búsquedas recientes</h3>
              <div className={styles.historyList}>
                {searchHistory.slice(0,5).map((s,i) => (
                  <div key={i} className={styles.historyItem}>
                    <span className={styles.historyQuery}>{s.query}</span>
                    <span className={styles.historyDate}>{new Date(s.date).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        {/* Actions */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Acciones</h3>
          {[
            !user.isHelper && { icon: '✨', label: 'Quiero ser Helper en Nüra', action: () => navigate('/register-helper'), highlight: true },
            { icon: '❤️', label: 'Mis favoritos', action: () => navigate('/favorites') },
            { icon: '💬', label: 'Mis conversaciones', action: () => navigate('/chats'), badge: totalUnread > 0 ? totalUnread : null },
            { icon: '❓', label: 'Cómo funciona Nüra', action: () => navigate('/how-it-works') },
            { icon: '🔒', label: 'Privacidad y datos', action: () => {} },
          ].filter(Boolean).map((item, i) => (
            <button key={i} className={`${styles.actionRow} ${item.highlight ? styles.actionHighlight : ''}`}
              onClick={item.action}>
              <span className={styles.actionIcon}>{item.icon}</span>
              <span className={styles.actionLabel}>{item.label}</span>
              {item.badge && <span className={styles.actionBadge}>{item.badge}</span>}
              <ChevronRight size={15} color="var(--soft)" />
            </button>
          ))}
        </div>

        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}
