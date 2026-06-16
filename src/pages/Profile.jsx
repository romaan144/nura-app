import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Star, MessageCircle, ChevronRight, Shield, Award,
  Edit2, Check, X, Calendar, Heart, Search, Bell, HelpCircle,
  UserPlus, Settings, Clock
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useUser } from '../context/UserContext'
import styles from './Profile.module.css'

export default function Profile() {
  const {
    user, logout, updateUser,
    chats, ratings, searchHistory, favorites,
    totalUnreadChats: totalUnread,
    services
  } = useUser()
  const navigate = useNavigate()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')

  // ── Not logged in ───────────────────────────────────────────────────────
  if (!user) return (
    <div className={styles.page}>
      <PageHeader />
      <div className={styles.noUser}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.noUserLogo} />
        <h2 className={styles.noUserTitle}>Tu perfil en Nüra</h2>
        <p className={styles.noUserDesc}>Accede a tu historial de búsquedas, conversaciones y helpers favoritos.</p>
        <button className={styles.loginBtn} onClick={() => navigate('/login')}>
          Iniciar sesión
        </button>
        <button className={styles.registerBtn} onClick={() => navigate('/login')}>
          Crear cuenta
        </button>
        <button className={styles.helperBtn} onClick={() => navigate('/register-helper')}>
          ✨ Quiero ser Helper
        </button>
      </div>
    </div>
  )

  const daysSince = user.joined
    ? Math.floor((new Date() - new Date(user.joined)) / (1000*60*60*24))
    : 0

  function saveName() {
    if (nameInput.trim()) updateUser({ name: nameInput.trim() })
    setEditingName(false)
  }
  function savePhone() {
    if (phoneInput.trim()) updateUser({ phone: phoneInput.trim() })
    setEditingPhone(false)
  }

  const ACTIONS = [
    { icon: '💬', label: 'Mis conversaciones', sub: `${chats?.length || 0} activas`, action: () => navigate('/chats') },
    { icon: '❤️', label: 'Favoritos', sub: `${favorites?.length || 0} guardados`, action: () => navigate('/favorites') },
    { icon: '📋', label: 'Mis servicios', sub: 'Historial y valoraciones', action: () => navigate('/my-services') },
    { icon: '❓', label: 'Cómo funciona Nüra', sub: 'Guía rápida', action: () => navigate('/how-it-works') },
  ]

  return (
    <div className={styles.page}>
      <PageHeader rightEl={
        <button className={styles.logoutIcon} onClick={() => { logout(); navigate('/') }}
          title="Cerrar sesión">
          <LogOut size={17} />
        </button>
      } />

      <div className={styles.content}>

        {/* ── Hero card ─────────────────────────────────────────────── */}
        <div className={styles.heroCard}>
          <div className={styles.avatarWrap}>
            <img
              src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name || 'user')}`}
              alt={user.name} className={styles.avatar}
            />
            <div className={styles.avatarBadge}>
              {user.isHelper ? <Award size={12} color="white" /> : <span style={{fontSize:'10px'}}>✓</span>}
            </div>
          </div>

          {/* Editable name */}
          {editingName ? (
            <div className={styles.editRow}>
              <input
                className={styles.editInput}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') saveName(); if (e.key==='Escape') setEditingName(false) }}
                autoFocus maxLength={40}
              />
              <button className={styles.editConfirm} onClick={saveName}><Check size={15} /></button>
              <button className={styles.editCancel} onClick={() => setEditingName(false)}><X size={15} /></button>
            </div>
          ) : (
            <div className={styles.nameRow}>
              <h2 className={styles.name}>{user.name}</h2>
              <button className={styles.editBtn} onClick={() => { setNameInput(user.name); setEditingName(true) }}>
                <Edit2 size={13} />
              </button>
            </div>
          )}

          {/* Editable phone */}
          {editingPhone ? (
            <div className={styles.editRow} style={{marginTop:'6px'}}>
              <input
                className={styles.editInput}
                value={phoneInput} placeholder="6XX XXX XXX"
                onChange={e => setPhoneInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') savePhone(); if (e.key==='Escape') setEditingPhone(false) }}
                autoFocus type="tel" maxLength={15}
              />
              <button className={styles.editConfirm} onClick={savePhone}><Check size={15} /></button>
              <button className={styles.editCancel} onClick={() => setEditingPhone(false)}><X size={15} /></button>
            </div>
          ) : (
            <div className={styles.phoneRow}>
              <p className={styles.phone}>
                {user.phone ? `+34 ${user.phone}` : 'Añadir teléfono'}
              </p>
              <button className={styles.editBtn} onClick={() => { setPhoneInput(user.phone || ''); setEditingPhone(true) }}>
                <Edit2 size={11} />
              </button>
            </div>
          )}

          {user.isHelper && (
            <div className={styles.helperBadges}>
              <span className={styles.founderBadge}><Award size={11} /> Helper verificado</span>
            </div>
          )}
          {daysSince > 0 && (
            <p className={styles.memberSince}>En Nüra desde hace {daysSince} días</p>
          )}
        </div>

        {/* ── Activity stats ──────────────────────────────────────────── */}
        <div className={styles.statsRow}>
          {[
            { n: searchHistory?.length || 0, l: 'Búsquedas' },
            { n: chats?.length || 0, l: 'Contactos' },
            { n: favorites?.length || 0, l: 'Favoritos' },
          ].map(({ n, l }, i) => (
            <div key={l} className={styles.statItem}
              style={{borderRight: i<2 ? '1px solid rgba(0,0,0,0.06)' : 'none'}}>
              <span className={styles.statNum}>{n}</span>
              <span className={styles.statLbl}>{l}</span>
            </div>
          ))}
        </div>

        {/* ── Complete name nudge ─────────────────────────────────────── */}
        {(!user.name || user.name === 'Usuario') && (
          <div className={styles.nudgeCard} onClick={() => { setNameInput(''); setEditingName(true) }}>
            <span style={{fontSize:'20px'}}>👋</span>
            <div>
              <div className={styles.nudgeTitle}>Añade tu nombre</div>
              <div className={styles.nudgeDesc}>Para que los helpers sepan quién les contacta</div>
            </div>
            <ChevronRight size={16} color="rgba(0,0,0,0.3)" />
          </div>
        )}

        {/* ── Become helper CTA ───────────────────────────────────────── */}
        {!user.isHelper && (
          <div className={styles.helperCta} onClick={() => navigate('/register-helper')}>
            <span style={{fontSize:'22px'}}>✨</span>
            <div style={{flex:1}}>
              <div className={styles.nudgeTitle}>Ofrece tus servicios en Nüra</div>
              <div className={styles.nudgeDesc}>Crea tu perfil de helper gratis</div>
            </div>
            <ChevronRight size={16} color="var(--purple)" />
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className={styles.section}>
          {ACTIONS.map((a, i) => (
            <button key={i} className={styles.actionRow} onClick={a.action}>
              <span className={styles.actionIcon}>{a.icon}</span>
              <div className={styles.actionMeta}>
                <span className={styles.actionLabel}>{a.label}</span>
                <span className={styles.actionSub}>{a.sub}</span>
              </div>
              <ChevronRight size={15} color="rgba(0,0,0,0.25)" />
            </button>
          ))}
        </div>

        {/* ── Logout ──────────────────────────────────────────────────── */}
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={15} /> Cerrar sesión
        </button>

        <p className={styles.version}>Nüra · v1.0 · Barcelona</p>
      </div>
    </div>
  )
}
