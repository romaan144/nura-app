import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Compass, MessageCircle, User, Rss } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './BottomNav.module.css'

const TABS = [
  { path: '/',        icon: Search,        label: 'Nüra'     },
  { path: '/explore', icon: Compass,       label: 'Explorar' },
  { path: '/chats',   icon: MessageCircle, label: 'Chats'    },
  { path: '/feed',    icon: Rss,           label: 'Feed'     },
  { path: '/profile', icon: User,          label: 'Perfil'   },
]

const HIDE_ON = ['/login', '/register-helper', '/onboarding', '/chat/']

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { totalUnreadChats } = useUser()
  // Add 1 demo unread (Elena's message) if no real chats yet
  const { chats } = useUser()
  const effectiveUnread = chats?.length > 0 ? totalUnreadChats : totalUnreadChats + 1

  if (HIDE_ON.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav className={styles.nav}>
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(path)
        return (
          <button
            key={path}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => navigate(path)}
          >
            <div className={styles.iconWrap}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
              {path === '/chats' && effectiveUnread > 0 && (
                <span className={styles.badge}>{effectiveUnread > 9 ? '9+' : effectiveUnread}</span>
              )}
            </div>
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
