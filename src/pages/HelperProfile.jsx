import PageHeader from '../components/PageHeader'
import ErrorBoundary from '../components/ErrorBoundary'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Star, Shield, MapPin, MessageCircle, Calendar,
         Share2, Heart, Briefcase, BookOpen, Award,
         CheckCircle, Globe, Zap, ChevronRight } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import RatingModal from '../components/RatingModal'
import styles from './HelperProfile.module.css'
import { showToast } from '../components/Toast'
import RegisterGate from '../components/RegisterGate'
import { getHelperById } from '../utils/supabase'

// ── HELPERS ─────────────────────────────────────────────────────────────────

function PostCard({ post }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes || 0)
  return (
    <div className={styles.postCard}>
      <p className={styles.postText}>{post.text}</p>
      <div className={styles.postMeta}>
        <span className={styles.postDate}>{post.date}</span>
        <button className={`${styles.postLike} ${liked ? styles.postLikeActive : ''}`}
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n-1 : n+1) }}>
          <Heart size={12} fill={liked ? 'var(--red)' : 'none'}
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
  const { id }     = useParams()
  const navigate   = useNavigate()
  const location   = useLocation()
  const { user, addService } = useUser()

  const [h, setH]             = useState(location.state?.helper || null)
  const [loading, setLoading] = useState(!h)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showRating, setShowRating]   = useState(false)
  const [showGate, setShowGate]       = useState(false)
  const [shared, setShared]           = useState(false)
  const [fav, setFav]                 = useState(false)

  useEffect(() => {
    if (!h) {
      const local = HELPERS.find(x => String(x.id) === String(id))
      if (local) { setH(local); setLoading(false); return }
      getHelperById(id).then(r => { if (r) setH(r); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [id])

  if (loading) return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.loadingWrap}><div className={styles.loadingPulse} /></div>
    </div>
  )
  if (!h) return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.notFound}>Perfil no encontrado.</div>
    </div>
  )

  const firstName = h.name?.split(' ')?.[0] || ''

  // Primary education for hero display
  const mainEdu = h.education?.[0]

  function handleContact() {
    if (!user) {
      try {
        sessionStorage.setItem('nura_pending_chat', JSON.stringify({ helperId: h.id, helperName: h.name }))
        sessionStorage.setItem('nura_return_to', `/chat/${h.id}`)
      } catch {}
      setShowGate(true); return
    }
    navigate(`/chat/${h.id}`, { state: { helper: h, userQuery: location.state?.userQuery } })
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href)
      .then(() => { setShared(true); showToast('Enlace copiado') })
  }

  return (
    <div className={styles.page}>
      <PageHeader showBack rightEl={
        <button className={styles.shareBtn} onClick={handleShare}>
          {shared
            ? <span style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--green)'}}>✓</span>
            : <Share2 size={17} color="rgba(0,0,0,0.55)" />}
        </button>
      } />

      <div className={styles.scroll}>

        {/* ══════════════════════════════════════════════════
            HERO — quien es esta persona en 5 segundos
            ══════════════════════════════════════════════════ */}
        <div className={styles.hero}>

          {/* Avatar + availability */}
          <div className={styles.avatarWrap}>
            {h.avatarUrl
              ? <img src={h.avatarUrl} alt={h.name} className={styles.avatar} />
              : <div className={styles.avatarFallback} style={{background: h.avatarColor || 'var(--purple)'}}>
                  {h.name?.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() || h.avatar}
                </div>
            }
            {h.available && <span className={styles.availDot} />}
          </div>

          {/* Name */}
          <h1 className={styles.name}>{h.name}</h1>

          {/* Specialty + verified */}
          <div className={styles.specialty}>
            {h.specialty}
            {h.dniVerified && (
              <span className={styles.verifiedBadge}>
                <Shield size={10} color="var(--green)" /> Verificado
              </span>
            )}
          </div>

          {/* Education headline — the most trust-building line */}
          {mainEdu && (
            <div className={styles.eduHeadline}>
              <BookOpen size={11} color="rgba(0,0,0,0.35)" />
              <span>{mainEdu.title} · {mainEdu.institution?.split('—')[0].trim()}</span>
            </div>
          )}

          {/* Location */}
          {(h.zone || h.city) && (
            <div className={styles.location}>
              <MapPin size={11} color="rgba(0,0,0,0.35)" />
              <span>{h.zone}{h.city && h.zone !== h.city ? `, ${h.city}` : ''}</span>
              {h.distance && <span className={styles.locationDist}> · {h.distance} km de ti</span>}
            </div>
          )}

          {/* Availability status — simple, no day grid */}
          {h.available && (
            <div className={styles.availStatus}>
              <span className={styles.availDotInline} />
              Disponible
            </div>
          )}

          {/* Stats row */}
          <div className={styles.statsRow}>
            {h.rating && (
              <div className={styles.stat}>
                <Star size={12} fill="var(--amber)" color="var(--amber)" />
                <strong>{h.rating}</strong>
                {h.reviews > 0 && <span>({h.reviews})</span>}
              </div>
            )}
            {h.price && h.price !== 'Consultar' && (
              <div className={styles.stat}>
                <strong>{h.price}</strong>
              </div>
            )}
            {h.responseTime && (
              <div className={styles.stat}>
                <span style={{color:'rgba(0,0,0,0.38)'}}>Responde en {h.responseTime}</span>
              </div>
            )}
            {h.urgent && (
              <div className={`${styles.stat} ${styles.statUrgent}`}>
                <Zap size={10} /> Urgencias
              </div>
            )}
          </div>

          {/* Bio */}
          {h.bio && (
            <p className={styles.bio}>{h.bio}</p>
          )}

          {/* CTA */}
          <button className={styles.ctaPrimary} onClick={handleContact}>
            <MessageCircle size={15} /> Escribir a {firstName}
          </button>
          <button className={styles.ctaSecondary}
            onClick={() => user ? setShowConfirm(true) : setShowGate(true)}>
            <Calendar size={14} /> Ver disponibilidad
          </button>

        </div>

        {/* ══════════════════════════════════════════════════
            CONTENIDO — flujo continuo, sin tabs
            La persona es la protagonista
            ══════════════════════════════════════════════════ */}

        {/* ── Cómo puedo ayudarte ── */}
        {(h.tags?.length > 0 || h.specialty) && (
          <section className={`${styles.section} ${styles.sectionFirst}`}>
            <h2 className={styles.sectionHeading}>Puedo ayudarte con</h2>
            <div className={styles.ayudaList}>
              {(() => {
                // Build deduplicated list of real capabilities
                const MODAL_KEYWORDS = ['presencial','online','a domicilio','domicilio','sesion','visita','videollamada','disponib']
                const isModal = s => MODAL_KEYWORDS.some(k => s.toLowerCase().includes(k))
                const isSimilar = (a, b) => {
                  const x = a.toLowerCase().trim(), y = b.toLowerCase().trim()
                  if (x === y) return true
                  if (x.includes(y) || y.includes(x)) return true
                  const stem = Math.min(x.length, y.length) - 2
                  return stem >= 5 && x.slice(0, stem) === y.slice(0, stem)
                }
                const raw = [h.specialty, ...(h.tags || [])].filter(Boolean)
                const accepted = []
                const items = raw.filter(s => {
                  if (isModal(s)) return false
                  if (accepted.some(a => isSimilar(a, s))) return false
                  accepted.push(s)
                  return true
                }).slice(0, 8)
                return items.map((item, i) => (
                  <div key={i} className={styles.ayudaItem}>
                    <span className={styles.ayudaCheck}>✓</span>
                    <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                  </div>
                ))
              })()}
              {h.presential && (
                <div className={styles.ayudaItem}>
                  <span className={styles.ayudaCheck}>✓</span>
                  <span>Sesiones presenciales</span>
                </div>
              )}
              {h.online && (
                <div className={styles.ayudaItem}>
                  <span className={styles.ayudaCheck}>✓</span>
                  <span>Sesiones online</span>
                </div>
              )}
            </div>
          </section>
        )}

{/* ── Valoraciones ── */}
        {h.reviews > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>
              <Star size={14} fill="var(--amber)" color="var(--amber)" /> Lo que dicen de {firstName}
            </h2>
            <div className={styles.ratingRow}>
              <span className={styles.ratingBig}>{h.rating}</span>
              <div>
                <div className={styles.ratingStars}>
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={13}
                      fill={n <= Math.round(h.rating) ? 'var(--amber)' : 'rgba(0,0,0,0.1)'}
                      color={n <= Math.round(h.rating) ? 'var(--amber)' : 'rgba(0,0,0,0.1)'} />
                  ))}
                </div>
                <span className={styles.ratingCount}>{h.reviews} valoraciones</span>
              </div>
            </div>
            {h.qualitativeComments?.length > 0 && (
              <div className={styles.reviewList}>
                {h.qualitativeComments.slice(0,3).map((c, i) => (
                  <div key={i} className={styles.reviewItem}>
                    <p>"{typeof c === 'string' ? c : c.text}"</p>
                    {c.user && <span>— {c.user}</span>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Experiencia ── */}
        {h.experience?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>
              <Briefcase size={14} /> Trayectoria profesional
            </h2>
            <div className={styles.expList}>
              {h.experience.map((exp, i) => (
                <div key={i} className={styles.expItem}>
                  <div className={styles.expDot} />
                  {i < h.experience.length - 1 && <div className={styles.expLine} />}
                  <div className={styles.expContent}>
                    <div className={styles.expRole}>{exp.role}</div>
                    <div className={styles.expCompany}>
                      {exp.company}
                      {exp.verifiedByCompany && (
                        <span className={styles.expVerified}>
                          <CheckCircle size={9} color="var(--green)" /> Verificado
                        </span>
                      )}
                    </div>
                    <div className={styles.expPeriod}>{exp.period}{exp.location ? ` · ${exp.location}` : ''}</div>
                    {exp.description && <p className={styles.expDesc}>{exp.description}</p>}
                    {exp.achievements?.length > 0 && (
                      <ul className={styles.expAchievements}>
                        {exp.achievements.slice(0,3).map((a,j) => <li key={j}>{a}</li>)}
                      </ul>
                    )}
                    {exp.competencies?.length > 0 && (
                      <div className={styles.expTags}>
                        {exp.competencies.slice(0,4).map((c,j) => (
                          <span key={j} className={styles.expTag}>{c}</span>
                        ))}
                      </div>
                    )}
                    {exp.managerOpinion && (
                      <div className={styles.quote}>
                        <p>"{exp.managerOpinion.text?.slice(0,120)}{exp.managerOpinion.text?.length > 120 ? '…' : ''}"</p>
                        <span>— {exp.managerOpinion.name}, {exp.managerOpinion.role}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Formación ── */}
        {h.education?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>
              <BookOpen size={14} /> Formación académica
            </h2>
            <div className={styles.expList}>
              {h.education.map((edu, i) => (
                <div key={i} className={styles.expItem}>
                  <div className={styles.expDot} />
                  {i < h.education.length - 1 && <div className={styles.expLine} />}
                  <div className={styles.expContent}>
                    <div className={styles.expRole}>{edu.title || edu.degree}</div>
                    <div className={styles.expCompany}>{edu.institution || edu.school}</div>
                    {edu.year && <div className={styles.expPeriod}>{edu.year}</div>}
                    {edu.details && (
                      <p className={styles.expDesc}>{edu.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Habilidades ── */}
        {h.skills?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>En qué destaca</h2>
            <div className={styles.tags}>
              {h.skills.map((s, i) => (
                <span key={i} className={styles.tag}>{s}</span>
              ))}
            </div>
          </section>
        )}

        {/* ── Idiomas ── */}
        {h.languages?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>
              <Globe size={14} /> Idiomas
            </h2>
            <div className={styles.tags}>
              {h.languages.map((l, i) => (
                <span key={i} className={`${styles.tag} ${styles.tagIdioma}`}>{l}</span>
              ))}
            </div>
          </section>
        )}

        {/* ── Publicaciones ── */}
        {h.posts?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Publicaciones</h2>
            {h.posts.slice(0,2).map((post, i) => (
              <PostCard key={i} post={post} />
            ))}
          </section>
        )}

        {/* Bottom padding */}
        <div style={{height: '80px'}} />

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
