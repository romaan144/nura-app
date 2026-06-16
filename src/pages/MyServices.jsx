import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle, ChevronRight } from 'lucide-react'
import { useUser } from '../context/UserContext'
import PageHeader from '../components/PageHeader'
import styles from './MyServices.module.css'

// Demo services for realistic preview
const DEMO_SERVICES = [
  {
    id: 'demo1',
    helperId: 5,
    helperName: 'Elena Fernández Ros',
    specialty: 'Auxiliar de geriatría',
    avatarUrl: 'https://api.dicebear.com/9.x/personas/svg?seed=ElenaFernandez',
    avatarColor: '#059669',
    avatar: 'EF',
    date: (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0] })(),
    time: '09:30',
    note: 'Cuidado matutino, acompañamiento y medicación',
    price: '14€/h',
    status: 'confirmed',
    isDemo: true,
  },
  {
    id: 'demo2',
    helperId: 1,
    helperName: 'Carlos Martínez Vidal',
    specialty: 'Logopeda',
    avatarUrl: 'https://api.dicebear.com/9.x/personas/svg?seed=CarlosMartinez',
    avatarColor: '#1A56DB',
    avatar: 'CM',
    date: (() => { const d = new Date(); d.setDate(d.getDate()+3); return d.toISOString().split('T')[0] })(),
    time: '17:00',
    note: 'Primera sesión de evaluación — Sofía',
    price: '50€/sesión',
    status: 'pending',
    isDemo: true,
  },
  {
    id: 'demo3',
    helperId: 3,
    helperName: 'Roberto Sánchez Ferrer',
    specialty: 'Técnico de calderas',
    avatarUrl: 'https://api.dicebear.com/9.x/personas/svg?seed=RobertoSanchez',
    avatarColor: '#1E40AF',
    avatar: 'RS',
    date: (() => { const d = new Date(); d.setDate(d.getDate()-2); return d.toISOString().split('T')[0] })(),
    time: '11:00',
    note: 'Revisión caldera — reparación válvula expansión',
    price: '65€',
    status: 'completed',
    isDemo: true,
    rated: true,
  },
]

const STATUS = {
  pending:   { label: 'Pendiente',   color: '#D97706', bg: '#FFFBEB' },
  confirmed: { label: 'Confirmado',  color: '#059669', bg: '#ECFDF5' },
  completed: { label: 'Completado',  color: '#6B7280', bg: '#F9FAFB' },
  cancelled: { label: 'Cancelado',   color: '#EF4444', bg: '#FEF2F2' },
}

const TABS = ['Todos', 'Próximos', 'Completados']

export default function MyServices() {
  const navigate = useNavigate()
  const { services, addRating, hasRated, updateService } = useUser()
  const [tab, setTab] = useState('Todos')
  const [ratingModal, setRatingModal] = useState(null)
  const [ratingVal, setRatingVal] = useState(5)
  const [ratingText, setRatingText] = useState('')
  const [ratingSent, setRatingSent] = useState(false)

  // Merge real + demo (real take priority by helperId)
  const realIds = new Set((services||[]).map(s => String(s.helperId)))
  const demosToShow = DEMO_SERVICES.filter(d => !realIds.has(String(d.helperId)))
  const allServices = [...(services||[]), ...demosToShow]

  const filtered = allServices.filter(s => {
    if (tab === 'Próximos')   return s.status === 'pending' || s.status === 'confirmed'
    if (tab === 'Completados') return s.status === 'completed'
    return true
  })

  function submitRating() {
    if (!ratingModal) return
    addRating(ratingModal.helperId, ratingVal, ratingText)
    updateService(ratingModal.id, { status: 'completed', rated: true })
    setRatingSent(true)
    setTimeout(() => { setRatingModal(null); setRatingSent(false); setRatingText('') }, 1800)
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    } catch { return dateStr }
  }

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <h2 className={styles.title}>Mis servicios</h2>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}>
              {t}
              {t === 'Próximos' && tab !== 'Próximos' && (services||[]).filter(s => s.status === 'pending' || s.status === 'confirmed').length > 0 && (
                <span className={styles.tabBadge}>
                  {(services||[]).filter(s => s.status === 'pending' || s.status === 'confirmed').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <span style={{fontSize:'48px',display:'block',marginBottom:'8px'}}>
              {tab === 'Completados' ? '✅' : tab === 'Próximos' ? '📅' : '📋'}
            </span>
            <strong style={{fontSize:'16px',color:'rgba(0,0,0,0.7)',letterSpacing:'-0.2px'}}>
              {tab === 'Todos' ? 'Aún no has contratado nada'
               : tab === 'Próximos' ? 'No tienes servicios próximos'
               : 'Sin servicios completados'}
            </strong>
            <p style={{fontSize:'13px',color:'rgba(0,0,0,0.4)',margin:'4px 0 16px',lineHeight:1.6,textAlign:'center',maxWidth:'220px'}}>
              {tab === 'Todos'
                ? 'Cuando contactes con un helper y concretes una cita, aparecerá aquí.'
                : tab === 'Próximos'
                ? 'Cuando contrates un servicio lo verás aquí con los detalles.'
                : 'Tus servicios completados y valoraciones aparecerán aquí.'}
            </p>
            <button className={styles.emptyBtn} onClick={() => navigate('/')}>
              Buscar con Nüra
            </button>
          </div>
        )}

        {/* Service list */}
        <div className={styles.list}>
          {filtered.map(s => {
            const st = STATUS[s.status] || STATUS.pending
            const rated = hasRated(s.helperId) || s.rated
            return (
              <div key={s.id} className={styles.card}
                onClick={() => navigate(`/helper/${s.helperId}`)}>
                <div className={styles.cardMain}>
                  {/* Avatar */}
                  {s.avatarUrl
                    ? <img src={s.avatarUrl} alt="" className={styles.avatar} />
                    : <div className={styles.avatarFallback} style={{background: s.avatarColor || '#7B2FFF'}}>
                        {s.avatar || s.helperName?.[0] || '?'}
                      </div>
                  }

                  {/* Info */}
                  <div className={styles.info}>
                    <div className={styles.helperName}>{s.helperName}</div>
                    <div className={styles.specialty}>{s.specialty}</div>
                    <div className={styles.meta}>
                      <Calendar size={11} />
                      <span>{formatDate(s.date)}{s.time ? ` · ${s.time}` : ''}</span>
                    </div>
                    {s.note && <div className={styles.note}>"{s.note}"</div>}
                  </div>

                  {/* Right */}
                  <div className={styles.right}>
                    {s.price && <span className={styles.price}>{s.price}</span>}
                    <span className={styles.statusBadge}
                      style={{color: st.color, background: st.bg}}>
                      {st.label}
                    </span>
                    <ChevronRight size={14} color="rgba(0,0,0,0.25)" />
                  </div>
                </div>

                {/* Rate CTA */}
                {(s.status === 'pending' || s.status === 'confirmed') && !rated && (
                  <div style={{display:'flex',gap:'6px',padding:'0 0 2px'}}>
                    <button className={styles.rateBtn}
                      onClick={e => { e.stopPropagation(); updateService(s.id, { status: 'completed' }); setRatingModal({...s, status:'completed'}); setRatingVal(5) }}
                      style={{flex:1}}>
                      <CheckCircle size={13} /> Marcar completado y valorar
                    </button>
                  </div>
                )}
                {rated && (
                  <div className={styles.ratedRow}>
                    <CheckCircle size={13} color="#059669" />
                    <span>Valorado · Gracias por tu opinión</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Rating modal */}
      {ratingModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(8px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:'rgba(255,255,255,0.96)',backdropFilter:'blur(32px)',borderRadius:'24px 24px 0 0',padding:'24px 20px 36px',width:'100%',maxWidth:'500px'}}>
            <div style={{width:'36px',height:'4px',background:'rgba(0,0,0,0.1)',borderRadius:'2px',margin:'0 auto 20px'}} />
            {ratingSent ? (
              <div style={{textAlign:'center',padding:'20px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}}>
                <span style={{fontSize:'52px'}}>⭐</span>
                <h3 style={{fontSize:'18px',fontWeight:800,color:'rgba(0,0,0,0.85)',margin:0,letterSpacing:'-0.3px'}}>¡Gracias por valorar!</h3>
                <p style={{fontSize:'13px',color:'rgba(0,0,0,0.45)',margin:0}}>Tu valoración ayuda a toda la comunidad.</p>
              </div>
            ) : (
              <>
                <h3 style={{fontSize:'17px',fontWeight:800,margin:'0 0 4px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>
                  Valorar a {ratingModal.helperName?.split(' ')?.[0]}
                </h3>
                <p style={{fontSize:'13px',color:'rgba(0,0,0,0.4)',margin:'0 0 20px'}}>{ratingModal.specialty}</p>
                <div style={{display:'flex',gap:'6px',justifyContent:'center',marginBottom:'16px'}}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRatingVal(n)}
                      style={{fontSize:'34px',background:'none',border:'none',cursor:'pointer',opacity:n<=ratingVal?1:0.25,transition:'opacity 0.15s'}}>
                      ⭐
                    </button>
                  ))}
                </div>
                <textarea value={ratingText} onChange={e=>setRatingText(e.target.value)}
                  placeholder="¿Qué destacarías? (opcional)" rows={3}
                  style={{width:'100%',padding:'12px 16px',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'14px',fontSize:'15px',outline:'none',resize:'none',fontFamily:'-apple-system,Inter,sans-serif',background:'rgba(0,0,0,0.03)',boxSizing:'border-box',marginBottom:'12px'}} />
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={() => setRatingModal(null)}
                    style={{flex:1,padding:'13px',background:'rgba(0,0,0,0.05)',color:'rgba(0,0,0,0.55)',border:'none',borderRadius:'100px',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>
                    Cancelar
                  </button>
                  <button onClick={submitRating}
                    style={{flex:2,padding:'13px',background:'#1C1C1E',color:'white',border:'none',borderRadius:'100px',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
                    Enviar valoración
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
