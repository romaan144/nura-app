import { useNavigate, useLocation } from 'react-router-dom'
import { Search, MessageCircle, User } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './NavBar.module.css'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chats } = useUser()

  const totalUnread = chats.reduce((sum, c) => sum + (c.unread || 0), 0)

  const tabs = [
    { path: '/', icon: Search, label: 'Buscar' },
    { path: '/chats', icon: MessageCircle, label: 'Chats', badge: totalUnread },
    { path: '/profile', icon: User, label: 'Mi perfil' },
  ]

  const hideOn = ['/login', '/onboarding', '/register-helper']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav className={styles.nav}>
      {tabs.map(({ path, icon: Icon, label, badge }) => {
        const active = location.pathname === path
        return (
          <button key={path} className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => navigate(path)}>
            <div className={styles.iconWrap}>
              <Icon size={20} />
              {badge > 0 && <span className={styles.badge}>{badge}</span>}
            </div>
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
