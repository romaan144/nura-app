import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronRight, Award, Edit2, Check, X, User, MessageCircle, Heart, Clock, Star, ClipboardList, HelpCircle, Info, AlertCircle, UserCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useUser } from '../context/UserContext'
import { HELPERS } from '../data/helpers'
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
        <h2 className={styles.noUserTitle}>Crea tu cuenta gratis</h2>
        <p className={styles.noUserDesc}>Solo tarda 30 segundos.</p>

        <div style={{display:'flex',flexDirection:'column',gap:'12px',width:'100%',maxWidth:'280px',margin:'20px 0'}}>
          {[
            [MessageCircle, 'Escribe a cualquier profesional'],
            [Heart,         'Guarda tus profesionales favoritos'],
            [Clock,         'Consulta tu historial de búsquedas'],
            [Star,          'Valora a los profesionales que contratas'],
          ].map(([Icon, text]) => (
            <div key={text} style={{display:'flex',alignItems:'center',gap:'12px',textAlign:'left'}}>
              <Icon size={16} color="var(--purple)" strokeWidth={1.8} style={{flexShrink:0}} />
              <span style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.65)',fontWeight:500}}>{text}</span>
            </div>
          ))}
        </div>

        <button className={styles.loginBtn} onClick={() => navigate('/login')}>
          Crear cuenta gratis
        </button>
        <button className={styles.helperBtn} onClick={() => navigate('/register-helper')}>
          <Sparkles size={14} strokeWidth={1.8} style={{marginRight:'6px'}} /> Quiero ser Profesional
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

  // For helpers: find their profile in helpers list
  const helperProfileId = null // Will be populated from Supabase when real auth exists

  const ACTIONS = [
    ...(user?.isHelper ? [{ icon: User, label: 'Mi perfil público', sub: 'Cómo te ven los usuarios', action: () => navigate('/explore') }] : [{ icon: User, label: 'Ofrecer mis servicios', sub: 'Registra tu perfil profesional', action: () => navigate('/register-helper') }]),
    { icon: MessageCircle, label: 'Mis conversaciones', sub: `${chats?.length || 0} activas`, action: () => navigate('/chats') },
    { icon: Heart, label: 'Favoritos', sub: `${favorites?.length || 0} guardados`, action: () => navigate('/favorites') },
    { icon: ClipboardList, label: 'Mis servicios', sub: 'Historial y valoraciones', action: () => navigate('/my-services') },
    
  ]

  return (
    <div className={styles.page}>
      <PageHeader rightEl={
        <button className={styles.logoutIcon} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={17} />
        </button>
      } />

      <div className={styles.scroll}>

        {/* ── HERO ─────────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.avatarWrap}>
            <img
              src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name || 'user')}`}
              alt={user.name}
              className={styles.avatar}
            />
            <div className={styles.avatarBadge}>
              {user.isHelper
                ? <Award size={12} color="white" />
                : <Check size={10} color="white" strokeWidth={3} />}
            </div>
          </div>

          {editingName ? (
            <div className={styles.editRow}>
              <input className={styles.editInput} value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') saveName(); if (e.key==='Escape') setEditingName(false) }}
                autoFocus maxLength={40} />
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

          {editingPhone ? (
            <div className={styles.editRow}>
              <input className={styles.editInput} value={phoneInput} placeholder="6XX XXX XXX"
                onChange={e => setPhoneInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') savePhone(); if (e.key==='Escape') setEditingPhone(false) }}
                autoFocus type="tel" maxLength={15} />
              <button className={styles.editConfirm} onClick={savePhone}><Check size={15} /></button>
              <button className={styles.editCancel} onClick={() => setEditingPhone(false)}><X size={15} /></button>
            </div>
          ) : (
            <div className={styles.phoneRow}>
              <p className={styles.phone}>{user.phone ? `+34 ${user.phone}` : 'Añadir teléfono'}</p>
              <button className={styles.editBtn} onClick={() => { setPhoneInput(user.phone || ''); setEditingPhone(true) }}>
                <Edit2 size={11} />
              </button>
            </div>
          )}

          {daysSince > 0 && (
            <p className={styles.memberSince}>Miembro desde hace {daysSince} días</p>
          )}
        </div>

        {/* ── STATS ──────────────────────────────────────────── */}
        <div className={styles.stats}>
          {[
            { n: searchHistory?.length || 0, l: 'Búsquedas', path: '/' },
            { n: chats?.length || 0, l: 'Chats', path: '/chats' },
            { n: favorites?.length || 0, l: 'Favoritos', path: '/favorites' },
            { n: ratings?.length || 0, l: 'Valoraciones', path: '/my-services' },
          ].map(({ n, l, path }) => (
            <div key={l} className={styles.statItem} onClick={() => navigate(path)}>
              <span className={styles.statNum}>{n}</span>
              <span className={styles.statLbl}>{l}</span>
            </div>
          ))}
        </div>

        {/* ── ACTIVIDAD RECIENTE ─────────────────────────────── */}
        {searchHistory?.length > 0 && (
          <div className={styles.activityCard}>
            <p className={styles.activityHeader}>Actividad reciente</p>
            {searchHistory.slice(0, 3).map((s, i) => (
              <button key={i} className={styles.activityItem} onClick={() => navigate('/')}>
                <span className={styles.activityDot} />
                <span className={styles.activityText}>Buscaste "{typeof s === 'string' ? s : s.query}"</span>
                <ChevronRight size={14} color="var(--ink-tertiary)" />
              </button>
            ))}
          </div>
        )}

        {/* ── MENÚ ───────────────────────────────────────────── */}
        <div className={styles.menuCard}>
          {ACTIONS.map(({ icon: Icon, label, sub, action }) => (
            <button key={label} className={styles.menuItem} onClick={action}>
              <div className={styles.menuIcon}>
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <div className={styles.menuLabel}>
                <span className={styles.menuTitle}>{label}</span>
                {sub && <span className={styles.menuSub}>{sub}</span>}
              </div>
              <ChevronRight size={16} color="var(--ink-tertiary)" />
            </button>
          ))}
        </div>

        {/* ── LOGOUT ─────────────────────────────────────────── */}
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>

        <p className={styles.version}>Nüra · v1.0</p>

      </div>
    </div>
  )
}
