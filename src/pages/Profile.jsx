import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronRight, Award, Edit2, Check, X } from 'lucide-react'
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
          <Sparkles size={14} strokeWidth={1.8} style={{marginRight:'6px'}} /> Quiero ser Helper
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
    ...(user?.isHelper ? [{ icon: User, label: 'Mi perfil público', sub: 'Cómo te ven los usuarios', action: () => navigate('/explore') }] : [{ icon: Sparkles, label: 'Ofrecer mis servicios', sub: 'Únete como helper en Nüra', action: () => navigate('/register-helper') }]),
    { icon: MessageCircle, label: 'Mis conversaciones', sub: `${chats?.length || 0} activas`, action: () => navigate('/chats') },
    { icon: Heart, label: 'Favoritos', sub: `${favorites?.length || 0} guardados`, action: () => navigate('/favorites') },
    { icon: ClipboardList, label: 'Mis servicios', sub: 'Historial y valoraciones', action: () => navigate('/my-services') },
    { icon: HelpCircle, label: 'Cómo funciona Nüra', sub: 'Guía rápida', action: () => navigate('/how-it-works') },
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
              <span className={styles.founderBadge}><Award size={11} /> Helper en Nüra</span>
            </div>
          )}
          {daysSince > 0 && (
            <p className={styles.memberSince}>En Nüra desde hace {daysSince} días</p>
          )}
        </div>

        {/* ── Activity stats ──────────────────────────────────────────── */}
        <div className={styles.statsRow}>
          {[
            { n: searchHistory?.length || 0, l: 'Búsquedas', path: '/' },
            { n: chats?.length || 0, l: 'Contactos', path: '/chats' },
            { n: favorites?.length || 0, l: 'Favoritos', path: '/favorites' },
          ].map(({ n, l, path }, i) => (
            <div key={l} className={styles.statItem}
              style={{borderRight: i<2 ? '1px solid rgba(0,0,0,0.06)' : 'none', cursor:'pointer'}}
              onClick={() => navigate(path)}>
              <span className={styles.statNum}>{n}</span>
              <span className={styles.statLbl}>{l}</span>
            </div>
          ))}
        </div>

        {/* ── Activity context message ──────────────────────────────────── */}
        {(chats?.length > 0 || (services||[]).length > 0) && (
          <div style={{
            background:'rgba(123,47,255,0.04)',border:'1px solid rgba(123,47,255,0.08)',
            borderRadius:'16px',padding:'14px 16px',fontSize:'13px',
            color:'rgba(0,0,0,0.5)',lineHeight:1.6,
          }}>
            {services?.length > 0
              ? `Tienes ${services.length} servicio${services.length>1?'s':''} registrado${services.length>1?'s':''}. Nüra construye tu historial automáticamente.`
              : `Has contactado con ${chats.length} profesional${chats.length>1?'es':''}. Cada conversación mejora tu experiencia en Nüra.`
            }
          </div>
        )}

        {/* ── First use guidance ───────────────────────────────────────── */}
        {!searchHistory?.length && !chats?.length && !favorites?.length && (
          <div style={{
            background:'rgba(123,47,255,0.04)',border:'1px solid rgba(123,47,255,0.1)',
            borderRadius:'16px',padding:'16px',
            display:'flex',alignItems:'flex-start',gap:'12px'
          }}>
            <span style={{fontSize:'22px',flexShrink:0}}>💡</span>
            <div>
              <div style={{fontSize:'13px',fontWeight:700,color:'rgba(0,0,0,0.7)',marginBottom:'4px'}}>
                Empieza buscando con Nüra
              </div>
              <div style={{fontSize:'12px',color:'rgba(0,0,0,0.45)',lineHeight:1.6}}>
                Cuéntale qué necesitas en la pantalla principal. Encontrará al profesional ideal en segundos.
              </div>
            </div>
          </div>
        )}

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
              <span className={styles.actionIcon}>{typeof a.icon === 'string' ? a.icon : <a.icon size={17} strokeWidth={1.8} />}</span>
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

        {/* Demo reset — hidden, long-press accessible */}
        <button
          onDoubleClick={() => {
            if (window.confirm('¿Resetear demo? Se borrarán todos los datos locales.')) {
              localStorage.clear()
              sessionStorage.clear()
              window.location.href = '/'
            }
          }}
          style={{background:'none',border:'none',color:'transparent',padding:'12px',cursor:'default',userSelect:'none',fontSize:'1px'}}>
          reset
        </button>
      </div>
    </div>
  )
}
