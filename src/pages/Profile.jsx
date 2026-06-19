import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronRight, Award, Edit2, Check, X, User, MessageCircle, Heart, ClipboardList, HelpCircle, Info, Sparkles, AlertCircle, UserCheck } from 'lucide-react'
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

        <div style={{display:'flex',flexDirection:'column',gap:'10px',width:'100%',maxWidth:'280px',margin:'20px 0'}}>
          {[
            ['💬', 'Escribe a cualquier profesional'],
            ['❤️', 'Guarda tus profesionales favoritos'],
            ['📋', 'Consulta tu historial de búsquedas'],
            ['⭐', 'Valora a los profesionales que contratas'],
          ].map(([icon, text]) => (
            <div key={text} style={{display:'flex',alignItems:'center',gap:'12px',textAlign:'left'}}>
              <span style={{fontSize:'18px',flexShrink:0}}>{icon}</span>
              <span style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.65)',fontWeight:500}}>{text}</span>
            </div>
          ))}
        </div>

        <button className={styles.loginBtn} onClick={() => navigate('/login')}>
          Crear cuenta gratis
        </button>
        <button className={styles.registerBtn} onClick={() => navigate('/login')}>
          Crear cuenta
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
    ...(user?.isHelper ? [{ icon: User, label: 'Mi perfil público', sub: 'Cómo te ven los usuarios', action: () => navigate('/explore') }] : [{ icon: Sparkles, label: 'Ofrecer mis servicios', sub: 'Ofrece tus servicios en Nüra', action: () => navigate('/register-helper') }]),
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
              {user.isHelper ? <Award size={12} color="white" /> : <span style={{fontSize:'var(--text-xs)'}}>✓</span>}
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
              <span className={styles.founderBadge}><Award size={11} /> Profesional en Nüra</span>
            </div>
          )}
          {daysSince > 0 && (
            <p className={styles.memberSince}>En Nüra desde hace {daysSince} días</p>
          )}
        </div>

        {/* ── Activity stats ──────────────────────────────────────────── */}
        <div className={styles.statsRow}>
          {[
            { n: searchHistory?.length || 0,           l: 'Búsquedas',   path: '/' },
            { n: (services||[]).length || chats?.length || 0, l: (services||[]).length > 0 ? 'Servicios' : 'Chats', path: (services||[]).length > 0 ? '/my-services' : '/chats' },
            { n: favorites?.length || 0,               l: 'Favoritos',   path: '/favorites' },
            { n: ratings?.length || 0,                 l: 'Valoraciones',path: '/my-services' },
          ].map(({ n, l, path }, i) => (
            <div key={l} className={styles.statItem}
              style={{borderRight: i<3 ? '1px solid rgba(0,0,0,0.06)' : 'none', cursor:'pointer'}}
              onClick={() => navigate(path)}>
              <span className={styles.statNum}>{n}</span>
              <span className={styles.statLbl}>{l}</span>
            </div>
          ))}
        </div>

        {/* ── Activity context message ──────────────────────────────────── */}
        
        {/* ── Recent activity ─────────────────────────────────── */}
        {(searchHistory?.length > 0 || (services||[]).length > 0) && (
          <div className={styles.activityCard}>
            <p className={styles.activityTitle}>Tu actividad en Nüra</p>

            {/* Last searches */}
            {searchHistory?.slice(0, 3).map((s, i) => (
              <div key={i} className={styles.activityItem}
                onClick={() => navigate('/')}>
                <div className={styles.activityDot} style={{background:'var(--purple)'}} />
                <span className={styles.activityText}>
                  Buscaste <strong>"{s.query?.length > 30 ? s.query.slice(0,30)+'...' : s.query}"</strong>
                </span>
                <ChevronRight size={12} color="rgba(0,0,0,0.2)" />
              </div>
            ))}

            {/* Last service */}
            {(services||[]).slice(0, 1).map(s => (
              <div key={s.id} className={styles.activityItem}
                onClick={() => navigate('/my-services')}>
                <div className={styles.activityDot} style={{background: s.status==='completed' ? 'var(--green)' : 'var(--amber)'}} />
                <span className={styles.activityText}>
                  {s.status === 'completed' ? 'Completaste con' : 'Cita con'}{' '}
                  <strong>{s.helperName?.split(' ')?.[0]}</strong>
                  {s.date && ` · ${s.date}`}
                </span>
                <ChevronRight size={12} color="rgba(0,0,0,0.2)" />
              </div>
            ))}

            {/* Recent ratings given */}
            {(ratings||[]).slice(0, 1).map((r, i) => (
              <div key={i} className={styles.activityItem}
                onClick={() => navigate('/my-services')}>
                <div className={styles.activityDot} style={{background:'var(--amber)'}} />
                <span className={styles.activityText}>
                  Valoraste a <strong>{
                      (services||[]).find(s => String(s.helperId) === String(r.helperId))?.helperName?.split(' ')?.[0] ||
                      HELPERS.find(h => String(h.id) === String(r.helperId))?.name?.split(' ')?.[0] ||
                      'un profesional'
                    }</strong>
                  {r.rating && <> · {'⭐'.repeat(r.rating)}</>}
                </span>
                <ChevronRight size={12} color="rgba(0,0,0,0.2)" />
              </div>
            ))}
          </div>
        )}

        {/* ── ACTIONS menu ──────────────────────────────────────── */}
        <div className={styles.actions}>
          {ACTIONS.map(({ icon: Icon, label, sub, action }) => (
            <button key={label} className={styles.actionItem} onClick={action}>
              <div className={styles.actionIcon}><Icon size={18} strokeWidth={1.7} /></div>
              <div className={styles.actionText}>
                <span className={styles.actionLabel}>{label}</span>
                {sub && <span className={styles.actionSub}>{sub}</span>}
              </div>
              <ChevronRight size={16} color="rgba(0,0,0,0.2)" />
            </button>
          ))}
        </div>

        {/* ── Become pro CTA (non-helper) ──────────────────────── */}
        {!user.isHelper && (
          <button className={styles.becomeProCta}
            onClick={() => navigate('/register-helper')}>
            <span style={{width:'36px',height:'36px',borderRadius:'50%',
              background:'rgba(123,47,255,0.08)',display:'flex',alignItems:'center',
              justifyContent:'center',flexShrink:0}}>
              <Sparkles size={16} color="var(--purple)" strokeWidth={1.8} />
            </span>
            <div style={{flex:1,textAlign:'left'}}>
              <div style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--ink)'}}>
                Crea tu perfil profesional gratis
              </div>
              <div style={{fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.4)',marginTop:'2px'}}>
                Ofrece tus servicios en Nüra
              </div>
            </div>
            <ChevronRight size={16} color="var(--purple)" />
          </button>
        )}

      </div>
    </div>
  )
}
