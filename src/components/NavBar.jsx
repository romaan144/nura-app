import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Compass, MessageCircle } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './NavBar.module.css'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chats, user } = useUser()

  const totalUnread = (chats || []).reduce((sum, c) => sum + (c.unread || 0), 0)

  const tabs = [
    { path: '/', icon: <Search size={22} />, label: 'Buscar' },
    { path: '/explore', icon: <Compass size={22} />, label: 'Explorar' },
    { path: '/chats', icon: <MessageCircle size={22} />, label: 'Chats', badge: totalUnread },
    {
      path: '/profile',
      icon: user?.name
        ? <div className={styles.avatarIcon}>{user.name[0].toUpperCase()}</div>
        : <div className={styles.avatarIcon}>?</div>,
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
            <button
              key={path}
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
