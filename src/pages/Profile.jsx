import { useNavigate } from 'react-router-dom'
import { Settings, LogOut, Star, MessageCircle, ChevronRight, Shield, Award, Plus } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { HELPERS } from '../data/helpers'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, logout, chats, ratings } = useUser()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className={styles.noUser}>
        <div className={styles.noUserIcon}>👤</div>
        <h2>Inicia sesión</h2>
        <p>Para ver tu perfil necesitas una cuenta en Nüra.</p>
        <button className={styles.loginBtn} onClick={() => navigate('/login')}>Iniciar sesión</button>
      </div>
    )
  }

  const daysSince = user.joined
    ? Math.floor((new Date() - new Date(user.joined)) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.headerTitle}>Mi perfil</span>
        <button className={styles.settingsBtn} onClick={logout}>
          <LogOut size={17} />
        </button>
      </header>

      <div className={styles.content}>
        {/* Profile hero */}
        <div className={styles.heroCard}>
          <div className={styles.avatar}>{user.name?.[0]?.toUpperCase() || '?'}</div>
          <h2 className={styles.name}>{user.name}</h2>
          <p className={styles.phone}>{user.phone ? `+34 ${user.phone}` : 'nura.app'}</p>
          {user.isHelper && (
            <div className={styles.helperBadges}>
              <span className={styles.founderBadge}><Award size={11} /> Helper Fundador</span>
              <span className={styles.verifiedBadge}><Shield size={11} /> Verificado</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {[
            { val: chats.length, label: 'Contactos', icon: <MessageCircle size={14} /> },
            { val: ratings.length, label: 'Valoraciones', icon: <Star size={14} /> },
            { val: daysSince, label: 'Días en Nüra', icon: <Award size={14} /> },
          ].map((s, i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLbl}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Helper section */}
        {user.isHelper && user.helperProfile && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tu perfil de helper</h3>
            <div className={styles.helperCard}>
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
              <div className={styles.helperRow}>
                <span className={styles.helperKey}>Modalidad</span>
                <span className={styles.helperVal}>
                  {user.helperProfile.presential && '📍 Presencial '}
                  {user.helperProfile.online && '💻 Online'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent ratings */}
        {ratings.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tus valoraciones</h3>
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
                      {[1,2,3,4,5].map(n => <Star key={n} size={12} fill={n <= r.rating ? '#F59E0B' : 'none'} color="#F59E0B" />)}
                    </div>
                    {r.comment && <p className={styles.ratingComment}>"{r.comment}"</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Acciones</h3>
          {[
            !user.isHelper && { icon: '✨', label: 'Quiero ser Helper', action: () => navigate('/register-helper'), highlight: true },
            { icon: '💬', label: 'Mis conversaciones', action: () => navigate('/chats') },
            { icon: '🔒', label: 'Privacidad y datos', action: () => {} },
            { icon: '❓', label: 'Cómo funciona Nüra', action: () => navigate('/how-it-works') },
          ].filter(Boolean).map((item, i) => (
            <button key={i} className={`${styles.actionRow} ${item.highlight ? styles.actionHighlight : ''}`}
              onClick={item.action}>
              <span className={styles.actionIcon}>{item.icon}</span>
              <span className={styles.actionLabel}>{item.label}</span>
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
