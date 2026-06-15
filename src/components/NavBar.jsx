import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Compass, MessageCircle, User, Rss, X, Menu } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './NavBar.module.css'
import pageStyles from './PageHeader.module.css'

// Export the trigger button separately so each page header can embed it
export function MenuButton() {
  return (
    <button
      onClick={() => window.__openDrawer?.()}
      aria-label="Menú"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'white',
        border: '1.5px solid rgba(0,0,0,0.08)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#333',
        cursor: 'pointer',
        flexShrink: 0,
      }}>
      <Menu size={18} />
    </button>
  )
}

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalUnreadChats, user } = useUser()
  const [open, setOpen] = useState(false)

  // Register global opener so MenuButton can call it
  if (typeof window !== 'undefined') {
    window.__openDrawer = () => setOpen(true)
  }

  const hideOn = ['/login', '/register-helper']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null

  const tabs = [
    { path: '/', icon: <Search size={20} />, label: 'Buscar' },
    { path: '/feed', icon: <Rss size={20} />, label: 'Feed' },
    { path: '/explore', icon: <Compass size={20} />, label: 'Explorar' },
    { path: '/chats', icon: <MessageCircle size={20} />, label: 'Chats', badge: totalUnreadChats },
    { path: '/profile', icon: <User size={20} />, label: 'Mi perfil' },
  ]

  function go(path) { navigate(path); setOpen(false) }

  return (
    <>
      {/* Backdrop */}
      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      {/* Drawer */}
      <aside className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}>

        <div className={styles.drawerHeader}>
          <img src="/logo-text.png" alt="Nüra" className={styles.drawerLogo} />
          <button className={styles.drawerClose} onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {user && (
          <div className={styles.drawerUser} onClick={() => go('/profile')} style={{cursor:'pointer'}}>
            <img
              src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name || 'user')}`}
              alt={user.name}
              className={styles.drawerAvatar}
            />
            <div>
              <div className={styles.drawerUserName}>{user.name}</div>
              <div className={styles.drawerUserSub}>
                {user.isHelper ? '✦ Helper verificado' : 'Miembro de Nüra'}
              </div>
            </div>
          </div>
        )}

        <nav className={styles.drawerNav}>
          {tabs.map(({ path, icon, label, badge }) => {
            const active = location.pathname === path
            return (
              <button key={path}
                className={`${styles.drawerItem} ${active ? styles.drawerItemActive : ''}`}
                onClick={() => go(path)}>
                <span className={styles.drawerIcon}>{icon}</span>
                <span className={styles.drawerLabel}>{label}</span>
                {badge > 0 && <span className={styles.drawerBadge}>{badge}</span>}
              </button>
            )
          })}
        </nav>

        <div className={styles.drawerFooter}>
          <span className={styles.drawerFooterBrand}>Nüra · Barcelona · 2026</span>
          <span className={styles.drawerFooterTag}>La IA que conecta personas</span>
        </div>
      </aside>
    </>
  )
}
