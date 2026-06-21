import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit2, Check, X, Award, MessageCircle,
         Heart, ClipboardList, User, ChevronRight, Star } from 'lucide-react'
import { useUser } from '../context/UserContext'
import PageHeader from '../components/PageHeader'
import styles from './Profile.module.css'

export default function Profile() {
  const {
    user, logout, updateUser,
    chats, ratings, searchHistory, favorites,
    services
  } = useUser()
  const navigate = useNavigate()

  const [editingName, setEditingName]   = useState(false)
  const [nameInput,   setNameInput]     = useState('')
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput,  setPhoneInput]    = useState('')

  /* ── Guest ─────────────────────────────────────────────── */
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
            [ClipboardList, 'Consulta tu historial de búsquedas'],
            [Star,          'Valora a los profesionales que contratas'],
          ].map(([Icon, text]) => (
            <div key={text} style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <Icon size={16} color="var(--purple)" strokeWidth={1.8} style={{flexShrink:0}} />
              <span style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.65)',fontWeight:500}}>{text}</span>
            </div>
          ))}
        </div>
        <button className={styles.loginBtn} onClick={() => navigate('/login')}>
          Crear cuenta gratis
        </button>
        <button className={styles.helperBtn} onClick={() => navigate('/register-helper')}>
          Quiero ser Profesional
        </button>
      </div>
    </div>
  )

  /* ── Logged-in helpers ─────────────────────────────────── */
  const daysSince = user.joined
    ? Math.floor((new Date() - new Date(user.joined)) / (1000*60*60*24))
    : 0

  function saveName()  { if (nameInput.trim())  updateUser({ name: nameInput.trim() });  setEditingName(false) }
  function savePhone() { if (phoneInput.trim())  updateUser({ phone: phoneInput.trim() }); setEditingPhone(false) }

  const recentSearches = (searchHistory || [])
    .filter((s, i, arr) => {
      const q = typeof s === 'string' ? s : s.query
      return arr.findIndex(x => (typeof x === 'string' ? x : x.query) === q) === i
    })
    .slice(0, 3)

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <PageHeader rightEl={
        <button className={styles.logoutIcon} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={17} />
        </button>
      } />

      <div className={styles.scroll}>

        {/* ── NIVEL 1: IDENTIDAD ──────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.avatarWrap}>
            <img
              src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name || 'user')}`}
              alt={user.name} className={styles.avatar}
            />
            <div className={styles.avatarBadge}>
              {user.isHelper ? <Award size={12} color="white" /> : <Check size={10} color="white" strokeWidth={3} />}
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
            <button className={styles.nameTap} onClick={() => { setNameInput(user.name); setEditingName(true) }}>
              <h2 className={styles.name}>{user.name}</h2>
              <Edit2 size={14} className={styles.editHint} />
            </button>
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
            <button className={styles.phoneBtn} onClick={() => { setPhoneInput(user.phone || ''); setEditingPhone(true) }}>
              <Phone size={12} />
              {user.phone ? `+34 ${user.phone}` : 'Añadir teléfono'}
            </button>
          )}

          {/* Stats inline — no card separada */}
          <div className={styles.statsLine}>
            {[
              { n: searchHistory?.length || 0, l: 'Búsquedas', path: '/' },
              { n: chats?.length || 0, l: 'Chats', path: '/chats' },
              { n: favorites?.length || 0, l: 'Favoritos', path: '/favorites' },
            ].map(({ n, l, path }, i) => (
              <>
                {i > 0 && <div key={`d${i}`} className={styles.statDiv} />}
                <div key={l} className={styles.statPill} onClick={() => navigate(path)}>
                  <span className={styles.statNum}>{n}</span>
                  <span className={styles.statLbl}>{l}</span>
                </div>
              </>
            ))}
          </div>
        </div>

        {/* ── NIVEL 2: ACCIÓN PRINCIPAL ───────────────────── */}
        {!user.isHelper && (
          <button className={styles.proCta} onClick={() => navigate('/register-helper')}>
            <div className={styles.proCtaIcon}>
              <User size={20} color="white" />
            </div>
            <div className={styles.proCtaText}>
              <span className={styles.proCtaTitle}>Conviértete en profesional</span>
              <span className={styles.proCtaSub}>Comparte lo que sabes hacer</span>
            </div>
            <ChevronRight size={18} color="var(--purple)" />
          </button>
        )}

        {/* ── NIVEL 2: ACCIONES ───────────────────────────── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Mi cuenta</p>
          <div className={styles.card}>
            {[
              { icon: MessageCircle, label: 'Mis conversaciones', sub: `${chats?.length || 0} activas`, path: '/chats' },
              { icon: ClipboardList, label: 'Mis servicios', sub: 'Historial y valoraciones', path: '/my-services' },
              { icon: Heart, label: 'Favoritos', sub: `${favorites?.length || 0} guardados`, path: '/favorites' },
            ].map(({ icon: Icon, label, sub, path }) => (
              <button key={label} className={styles.menuItem} onClick={() => navigate(path)}>
                <div className={styles.menuIcon}><Icon size={18} strokeWidth={1.8} /></div>
                <div className={styles.menuLabel}>
                  <span className={styles.menuTitle}>{label}</span>
                  <span className={styles.menuSub}>{sub}</span>
                </div>
                <ChevronRight size={16} color="var(--ink-tertiary)" />
              </button>
            ))}
          </div>
        </div>

        {/* ── NIVEL 3: ACTIVIDAD ──────────────────────────── */}
        {searchHistory?.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Búsquedas recientes</p>
            <div className={styles.card}>
              {[...new Set(searchHistory.map(s => typeof s === 'string' ? s : s.query))].slice(0,3).map((q, i) => (
                <button key={i} className={styles.activityItem} onClick={() => navigate('/')}>
                  <span className={styles.activityDot} />
                  <span className={styles.activityText}>"{q}"</span>
                  <ChevronRight size={14} color="var(--ink-tertiary)" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── LOGOUT ──────────────────────────────────────── */}
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={16} /> Cerrar sesión
        </button>

        <p className={styles.version}>Nüra · v1.0</p>

      </div>
    </div>
  )
}