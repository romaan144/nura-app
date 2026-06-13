import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Compass, MessageCircle, Rss } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './NavBar.module.css'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalUnreadChats, user } = useUser()

  const tabs = [
    { path: '/', icon: <Search size={21} />, label: 'Buscar' },
    { path: '/feed', icon: <Rss size={21} />, label: 'Feed' },
    { path: '/explore', icon: <Compass size={21} />, label: 'Explorar' },
    { path: '/chats', icon: <MessageCircle size={21} />, label: 'Chats', badge: totalUnreadChats },
    {
      path: '/profile',
      icon: <div className={styles.avatarIcon}>{user?.name?.[0]?.toUpperCase() || '?'}</div>,
      label: 'Perfil',
    },
  ]

  const hideOn = ['/login', '/register-helper']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {tabs.map(({ path, icon, label, badge }) => {
          const active = location.pathname === path
          return (
            <button key={path}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => navigate(path)}
              aria-label={label}>
              <div className={styles.iconWrap}>
                {icon}
                {badge > 0 && <span className={styles.badge}>{badge}</span>}
              </div>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
