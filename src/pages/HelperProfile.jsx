import PageHeader from '../components/PageHeader'
import ErrorBoundary from '../components/ErrorBoundary'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Star, Shield, MapPin, MessageCircle, Clock, CheckCircle, Award,
         Share2, Heart, Sparkles, Calendar, Briefcase, BookOpen,
         ChevronRight, Zap } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import RatingModal from '../components/RatingModal'
import styles from './HelperProfile.module.css'
import { showToast } from '../components/Toast'
import RegisterGate from '../components/RegisterGate'
import { getHelperById } from '../utils/supabase'

// ── EXPERIENCE CARD ─────────────────────────────────────────
function ExperienceCard({ exp }) {
  return (
    <div className={styles.expCard}>
      <div className={styles.expHeader}>
        <div className={styles.expRole}>{exp.role}</div>
        <div className={styles.expCompany}>{exp.company}</div>
        <div className={styles.expPeriod}>{exp.period}</div>
      </div>
      {exp.description && (
        <p className={styles.expDesc}>{exp.description}</p>
      )}
      {exp.achievements?.length > 0 && (
        <ul className={styles.expAchievements}>
          {exp.achievements.slice(0,3).map((a,i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── POST CARD ────────────────────────────────────────────────
function PostCard({ post, helper }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes || 0)
  return (
    <div className={styles.postCard}>
      <p className={styles.postText}>{post.text}</p>
      {post.badge && <div className={styles.postBadge}>{post.badge}</div>}
      <div className={styles.postMeta}>
        <span>{post.date}</span>
        <button
          className={`${styles.postLike} ${liked ? styles.postLikeActive : ''}`}
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n-1 : n+1) }}>
          <Heart size={13} fill={liked ? 'var(--red)' : 'none'}
            color={liked ? 'var(--red)' : 'rgba(0,0,0,0.3)'} />
          <span>{likes}</span>
        </button>
      </div>
    </div>
  )
}

function BookingModal({ helper, onClose, onBook, onNavigate }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const name = helper?.name?.split(' ')?.[0] || helper?.name || ''

  function confirm() {
    onBook?.(helper, date, time, note)
    setDone(true)
  }

  const style = {
    overlay: {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',WebkitBackdropFilter: 'blur(8px)', backdropFilter:'blur(8px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'},
    sheet: {background:'rgba(255,255,255,0.96)',WebkitBackdropFilter: 'blur(32px)', backdropFilter:'blur(32px)',borderRadius:'24px 24px 0 0',padding:'24px 20px 36px',width:'100%',maxWidth:'500px'},
    handle: {width:'36px',height:'4px',background:'rgba(0,0,0,0.1)',borderRadius:'2px',margin:'0 auto 20px'},
    input: {width:'100%',padding:'12px 16px',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'14px',fontSize:'var(--text-base)',outline:'none',fontFamily:'-apple-system,Inter,sans-serif',background:'rgba(0,0,0,0.03)',boxSizing:'border-box'},
    btnPrimary: {width:'100%',padding:'14px',background:'var(--purple)',color:'white',border:'none',borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:700,cursor:'pointer',transition:'opacity 0.2s'},
    btnSecondary: {width:'100%',padding:'12px',background:'rgba(0,0,0,0.05)',color:'rgba(0,0,0,0.55)',border:'none',borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:600,cursor:'pointer'},
  }

  return (
    <div style={style.overlay}>
      <div style={style.sheet}>
        <div style={style.handle} />
        {done ? (
          <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',padding:'16px 0'}}>
            {/* Helper avatar */}
            <div style={{position:'relative'}}>
              {helper?.avatarUrl
                ? <img src={helper.avatarUrl} alt={name}
                    style={{width:'68px',height:'68px',borderRadius:'50%',border:'3px solid var(--green-dot)'}} />
                : <div style={{width:'68px',height:'68px',borderRadius:'50%',background:helper?.avatarColor||'#7B2FFF',
                    display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'24px',fontWeight:700,
                    border:'3px solid var(--green-dot)'}}>
                    {helper?.avatar||name?.[0]}
                  </div>
              }
              <span style={{position:'absolute',bottom:-2,right:-2,width:'22px',height:'22px',background:'var(--green-dot)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width='12' height='12' viewBox='0 0 12 12' fill='none'><path d='M2 6l3 3 5-5' stroke='white' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/></svg></span>
            </div>
            <div>
              <h3 style={{fontSize:'19px',fontWeight:800,margin:'0 0 4px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>
                ¡Solicitud enviada!
              </h3>
              <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.5)',margin:0,lineHeight:1.6}}>
                {name} recibirá tu solicitud y confirmará en breve.
              </p>
            </div>
            {/* Booking summary */}
            {(date || time) && (
              <div style={{background:'rgba(0,0,0,0.03)',border:'1px solid rgba(0,0,0,0.06)',
                borderRadius:'14px',padding:'12px 16px',width:'100%',textAlign:'left'}}>
                {date && <p style={{margin:'0 0 4px',fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.6)'}}>
                  {new Date(date).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}
                </p>}
                {time && <p style={{margin:0,fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.6)'}}><Clock size={12} style={{marginRight:'4px',verticalAlign:'middle'}}/>{time}h</p>}
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'8px',width:'100%',marginTop:'4px'}}>
              <button onClick={() => { onClose(); onNavigate('/my-services') }} style={style.btnPrimary}>
                Ver Mis servicios
              </button>
              <button onClick={onClose} style={style.btnSecondary}>Volver al perfil</button>
            </div>
          </div>
        ) : (
          <>
            <h3 style={{fontSize:'var(--text-md)',fontWeight:800,margin:'0 0 4px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>Solicitar servicio</h3>
            <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.4)',margin:'0 0 20px'}}>{name} · {helper?.price || 'Precio a consultar'}</p>
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
              {/* Day pills */}
              <div>
                <p style={{fontSize:'var(--text-xs)',fontWeight:700,color:'rgba(0,0,0,0.4)',margin:'0 0 8px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Fecha</p>
                <div className={styles.rowScroll}>
                  {Array.from({length:7},(_,i)=>{
                    const d=new Date(); d.setDate(d.getDate()+i)
                    const iso=d.toISOString().split('T')[0]
                    const lbl=i===0?'Hoy':i===1?'Mañana':d.toLocaleDateString('es-ES',{weekday:'short',day:'numeric'})
                    return (
                      <button key={i} onClick={()=>setDate(iso)} style={{
                        flexShrink:0,padding:'8px 14px',
                        background:date===iso?'var(--purple)':'rgba(0,0,0,0.05)',
                        color:date===iso?'white':'rgba(0,0,0,0.6)',
                        border:'none',borderRadius:'100px',fontSize:'var(--text-xs)',fontWeight:600,
                        cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                        whiteSpace:'nowrap',
                      }}>{lbl}</button>
                    )
                  })}
                </div>
              </div>
              {/* Time pills */}
              <div>
                <p style={{fontSize:'var(--text-xs)',fontWeight:700,color:'rgba(0,0,0,0.4)',margin:'0 0 8px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Hora</p>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {['9:00','10:00','11:00','12:00','16:00','17:00','18:00','19:00'].map(t=>(
                    <button key={t} onClick={()=>setTime(t)} style={{
                      padding:'7px 12px',
                      background:time===t?'var(--purple)':'rgba(0,0,0,0.05)',
                      color:time===t?'white':'rgba(0,0,0,0.6)',
                      border:'none',borderRadius:'100px',fontSize:'var(--text-xs)',fontWeight:600,
                      cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder="Detalles adicionales (opcional)..." rows={3}
                style={{...style.input, resize:'none'}} />
            </div>
            <div className={styles.rowGap8}>
              <button onClick={onClose} style={{...style.btnSecondary,flex:1}}>Cancelar</button>
              <button onClick={confirm} disabled={!date}
                style={{...style.btnPrimary,flex:2,opacity:date?1:0.4}}>
                Enviar solicitud
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── MAIN PROFILE COMPONENT ──────────────────────────────────
function HelperProfileInner() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const location     = useLocation()
  const { user, addService, addRating } = useUser()

  const [h, setH]               = useState(location.state?.helper || null)
  const [loading, setLoading]   = useState(!h)
  const [activeTab, setActiveTab] = useState('perfil')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showRating, setShowRating]   = useState(false)
  const [showGate, setShowGate]       = useState(false)
  const [shared, setShared]           = useState(false)
  const [fav, setFav]                 = useState(false)

  const matchReason = location.state?.matchReason
    || window.__nuraMatchReasons?.[String(id)] || null

  useEffect(() => {
    if (!h) {
      const local = HELPERS.find(x => String(x.id) === String(id))
      if (local) { setH(local); setLoading(false); return }
      getHelperById(id).then(r => { if (r) setH(r); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [id])

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href)
      .then(() => { setShared(true); showToast('Enlace copiado') })
      .catch(() => {})
  }

  function handleContact(e) {
    e?.stopPropagation()
    if (!user) { setShowGate(true); return }
    navigate(`/chat/${h.id}`, { state: { helper: h, userQuery: location.state?.userQuery } })
  }

  if (loading) return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.loadingWrap}>
        <div className={styles.loadingPulse} />
      </div>
    </div>
  )

  if (!h) return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.empty}>Perfil no encontrado.</div>
    </div>
  )

  const firstName = h.name?.split(' ')?.[0] || h.name || ''
  const isVerified = h.dniVerified || h.verified

  // Clean matchReason text
  const cleanReason = matchReason
    ? matchReason
        .replace(/^\*\*[^*]+\*\*[^:]*:\s*/, '')
        .replace(/\*\*/g, '')
        .replace(/^(Nüra la recomienda|Por qué Nüra)[^:]*:\s*/i, '')
        .trim()
    : null

  return (
    <div className={styles.page}>
      {/* Header */}
      <PageHeader showBack rightEl={
        <button className={styles.shareBtn} onClick={handleShare}>
          {shared
            ? <span style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--green)'}}>✓</span>
            : <Share2 size={17} color="rgba(0,0,0,0.6)" />}
        </button>
      } />

      {/* ══════════════════════════════════════════════════
          PRIMER NIVEL — Hero: decide en menos de 5s
          ══════════════════════════════════════════════════ */}
      <div className={styles.hero}>

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          {h.avatarUrl
            ? <img src={h.avatarUrl} alt={h.name} className={styles.avatar} />
            : <div className={styles.avatarFallback} style={{background: h.avatarColor || 'var(--purple)'}}>
                {h.avatar || h.name?.[0]}
              </div>
          }
          {h.available && <span className={styles.availDot} />}
        </div>

        {/* Name + specialty */}
        <h1 className={styles.heroName}>{h.name}</h1>
        <p className={styles.heroSpecialty}>{h.specialty || h.tags?.[0]}</p>

        {/* Key facts row */}
        <div className={styles.heroFacts}>
          {h.rating && (
            <span className={styles.fact}>
              <Star size={11} fill="var(--amber)" color="var(--amber)" />
              {h.rating}
              {h.reviews > 0 && <span className={styles.factMuted}> ({h.reviews})</span>}
            </span>
          )}
          {h.distance && (
            <span className={styles.factDot}>·</span>
          )}
          {h.distance && (
            <span className={styles.fact}>
              <MapPin size={11} color="rgba(0,0,0,0.35)" />
              {h.distance} km
            </span>
          )}
          {h.price && h.price !== 'Consultar' && (
            <span className={styles.factDot}>·</span>
          )}
          {h.price && h.price !== 'Consultar' && (
            <span className={styles.factPrice}>{h.price}</span>
          )}
        </div>

        {/* Verification + availability */}
        <div className={styles.heroBadges}>
          {isVerified && (
            <span className={styles.badge}>
              <Shield size={10} color="var(--green)" /> Verificado
            </span>
          )}
          {h.available
            ? <span className={`${styles.badge} ${styles.badgeAvail}`}>Disponible</span>
            : <span className={`${styles.badge} ${styles.badgeBusy}`}>Ocupado</span>
          }
          {h.urgent && (
            <span className={`${styles.badge} ${styles.badgeUrgent}`}>
              <Zap size={9} /> Urgencias
            </span>
          )}
        </div>

        {/* Short bio */}
        {h.bio && (
          <p className={styles.heroBio}>
            {h.bio.length > 140 ? h.bio.slice(0, 140).trim() + '…' : h.bio}
          </p>
        )}

        {/* Nüra recommendation — clean, one line */}
        {cleanReason && (
          <div className={styles.recommendBadge}>
            <Sparkles size={10} color="var(--purple)" />
            <span>
              <strong>Recomendado por Nüra · </strong>
              {cleanReason.charAt(0).toUpperCase() + cleanReason.slice(1)}
            </span>
          </div>
        )}

        {/* Primary CTA */}
        <button className={styles.ctaPrimary} onClick={handleContact}>
          <MessageCircle size={15} /> Escribir a {firstName}
        </button>
        <button className={styles.ctaSecondary}
          onClick={() => user ? setShowConfirm(true) : setShowGate(true)}>
          <Calendar size={14} /> Contratar
        </button>

      </div>

      {/* ══════════════════════════════════════════════════
          SEGUNDO NIVEL — Tabs: profundiza
          ══════════════════════════════════════════════════ */}
      <div className={styles.tabNav}>
        {[
          { id: 'perfil',         label: 'Perfil',         icon: null },
          { id: 'trayectoria',    label: 'Trayectoria',    icon: null },
          { id: 'publicaciones',  label: 'Publicaciones',  icon: null },
        ].map(t => (
          <button key={t.id}
            className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>

        {/* ── TAB: PERFIL ──────────────────────────────── */}
        {activeTab === 'perfil' && (
          <div className={styles.tab}>

            {/* Bio completa */}
            {h.bio && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Sobre {firstName}</h3>
                <p className={styles.bioText}>{h.bio}</p>
              </section>
            )}

            {/* Servicios */}
            {(h.specialty || (h.tags?.length > 0)) && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Servicios</h3>
                <div className={styles.chipRow}>
                  {[h.specialty, ...(h.tags || [])
                    .filter(t => t && t !== h.specialty && t !== h.zone)
                    .slice(0, 5)
                  ].filter(Boolean).map((s, i) => (
                    <span key={i} className={styles.chip}>{s}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Disponibilidad */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Disponibilidad</h3>
              <div className={styles.availRow}>
                {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((day, i) => {
                  const avail = h.available && i < 5
                  return (
                    <div key={day} className={`${styles.dayPill} ${avail ? styles.dayPillOn : styles.dayPillOff}`}>
                      <span className={styles.dayLabel}>{day}</span>
                      <span className={styles.dayStatus}>{avail ? '✓' : '–'}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Zona de trabajo */}
            {h.zone && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Zona de trabajo</h3>
                <div className={styles.chipRow}>
                  <span className={styles.chip}>
                    <MapPin size={11} color="rgba(0,0,0,0.4)" /> {h.zone}
                  </span>
                  {h.distance && (
                    <span className={styles.chipMuted}>
                      Radio hasta {h.distance < 5 ? '5' : h.distance < 10 ? '10' : '15'} km
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* Reconocimientos */}
            {(h.founder || h.urgent || h.completionRate >= 90) && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Reconocimientos</h3>
                <div className={styles.badgeRow}>
                  {h.founder && (
                    <div className={styles.recognitionBadge}>
                      <Award size={14} color="#92400E" />
                      <span>Profesional fundador de Nüra</span>
                    </div>
                  )}
                  {h.completionRate >= 90 && (
                    <div className={styles.recognitionBadge}>
                      <CheckCircle size={14} color="var(--green)" />
                      <span>{h.completionRate}% de servicios completados</span>
                    </div>
                  )}
                  {h.urgent && (
                    <div className={styles.recognitionBadge}>
                      <Zap size={14} color="var(--purple)" />
                      <span>Acepta urgencias</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Valoraciones */}
            {h.reviews > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Valoraciones</h3>
                <div className={styles.ratingHero}>
                  <span className={styles.ratingBig}>{h.rating}</span>
                  <div className={styles.ratingStars}>
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={14}
                        fill={n <= Math.round(h.rating) ? 'var(--amber)' : 'rgba(0,0,0,0.1)'}
                        color={n <= Math.round(h.rating) ? 'var(--amber)' : 'rgba(0,0,0,0.1)'} />
                    ))}
                  </div>
                  <span className={styles.ratingCount}>{h.reviews} valoraciones</span>
                </div>
                {h.qualitativeComments?.length > 0 && (
                  <div className={styles.reviewList}>
                    {h.qualitativeComments.slice(0, 3).map((c, i) => (
                      <div key={i} className={styles.reviewItem}>
                        <span className={styles.reviewQuote}>"</span>
                        <p>{c}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

          </div>
        )}

        {/* ── TAB: TRAYECTORIA ─────────────────────────── */}
        {activeTab === 'trayectoria' && (
          <div className={styles.tab}>

            {/* Nota verificación */}
            <div className={styles.verifyNote}>
              <Shield size={13} color="var(--green)" />
              <p>Historial verificado por terceros. No lo ha escrito {firstName}.</p>
            </div>

            {/* Experiencia laboral */}
            {h.experience?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Briefcase size={13} /> Experiencia
                </h3>
                <div className={styles.timeline}>
                  {h.experience.map((exp, i) => (
                    <div key={i} className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      {i < h.experience.length - 1 && <div className={styles.timelineLine} />}
                      <div className={styles.timelineBody}>
                        <ExperienceCard exp={exp} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Formación */}
            {h.education?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <BookOpen size={13} /> Formación
                </h3>
                <div className={styles.timeline}>
                  {h.education.map((edu, i) => (
                    <div key={i} className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      {i < h.education.length - 1 && <div className={styles.timelineLine} />}
                      <div className={styles.timelineBody}>
                        <div className={styles.eduCard}>
                          <div className={styles.eduTitle}>{edu.title || edu.degree}</div>
                          <div className={styles.eduInst}>{edu.institution || edu.school}</div>
                          {edu.year && <div className={styles.eduYear}>{edu.year}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Idiomas */}
            {h.languages?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Idiomas</h3>
                <div className={styles.chipRow}>
                  {h.languages.map((l, i) => (
                    <span key={i} className={styles.chip}>{l}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Skills / especialidades */}
            {h.skills?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Especialidades</h3>
                <div className={styles.chipRow}>
                  {h.skills.map((s, i) => (
                    <span key={i} className={`${styles.chip} ${styles.chipSubtle}`}>{s}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {!h.experience?.length && !h.education?.length && (
              <div className={styles.emptyTab}>
                <p>La trayectoria de {firstName} se irá completando.</p>
              </div>
            )}

          </div>
        )}

        {/* ── TAB: PUBLICACIONES ───────────────────────── */}
        {activeTab === 'publicaciones' && (
          <div className={styles.tab}>
            {h.posts?.length > 0
              ? h.posts.map((post, i) => (
                  <PostCard key={i} post={post} helper={h} />
                ))
              : (
                <div className={styles.emptyTab}>
                  <p>Cuando {firstName} publique contenido aparecerá aquí.</p>
                </div>
              )
            }
          </div>
        )}

      </div>

      {/* Modals */}
      {showGate && <RegisterGate reason="contact" onClose={() => setShowGate(false)} />}
      {showRating && <RatingModal helper={h} onClose={() => setShowRating(false)} />}
      {showConfirm && (
        <BookingModal
          helper={h}
          onClose={() => setShowConfirm(false)}
          onBook={addService}
          onNavigate={navigate}
        />
      )}
    </div>
  )
}

export default function HelperProfile() {
  return (
    <ErrorBoundary>
      <HelperProfileInner />
    </ErrorBoundary>
  )
}
