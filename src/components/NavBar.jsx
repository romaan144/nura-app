import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Compass, MessageCircle, User, Rss, X, Menu } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './NavBar.module.css'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalUnreadChats, user } = useUser()
  const [open, setOpen] = useState(false)

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
      {/* Hamburger button — always visible top-left */}
      <button
        className={styles.hamburger}
        onClick={() => setOpen(true)}
        aria-label="Menú">
        <Menu size={22} />
      </button>

      {/* Backdrop */}
      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      {/* Drawer */}
      <div className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <img src="/logo-text.png" alt="Nüra" className={styles.drawerLogo} />
          <button className={styles.drawerClose} onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {user && (
          <div className={styles.drawerUser}>
            <div className={styles.drawerAvatar}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className={styles.drawerUserName}>{user.name}</div>
              <div className={styles.drawerUserSub}>{user.isHelper ? 'Helper · Nüra' : 'Usuario · Nüra'}</div>
            </div>
          </div>
        )}

        <nav className={styles.drawerNav}>
          {tabs.map(({ path, icon, label, badge }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
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
          <p>Nüra · Barcelona · 2026</p>
          <p>La IA que conecta personas</p>
        </div>
      </div>
    </>
  )
}
