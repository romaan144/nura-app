import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Compass, MessageCircle, User } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './NavBar.module.css'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chats } = useUser()

  const totalUnread = (chats || []).reduce((sum, c) => sum + (c.unread || 0), 0)

  const tabs = [
    { path: '/', icon: Search, label: 'Buscar' },
    { path: '/explore', icon: Compass, label: 'Explorar' },
    { path: '/chats', icon: MessageCircle, label: 'Chats', badge: totalUnread },
    { path: '/profile', icon: User, label: 'Perfil' },
  ]

  const hideOn = ['/login', '/register-helper']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav className={styles.nav}>
      {tabs.map(({ path, icon: Icon, label, badge }) => {
        const active = location.pathname === path
        return (
          <button key={path}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => navigate(path)}
            aria-label={label}>
            <div className={styles.iconWrap}>
              <Icon size={19} />
              {badge > 0 && <span className={styles.badge}>{badge}</span>}
            </div>
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
