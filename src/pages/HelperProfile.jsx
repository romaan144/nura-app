import PageHeader from '../components/PageHeader'
import ErrorBoundary from '../components/ErrorBoundary'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Star, Shield, MapPin, MessageCircle, Zap,
  TrendingUp, Clock, CheckCircle, Award, Brain, Globe,
  Building2, BookOpen, Share2, Lock, Heart, Sparkles, Calendar,
  ThumbsUp, MessageSquare, AlertCircle, BarChart2, RefreshCw,
  Activity, Cpu, Eye, Layers
} from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import RatingModal from '../components/RatingModal'
import styles from './HelperProfile.module.css'
import { showToast } from '../components/Toast'
import { getHelperById } from '../utils/supabase'

/* ── LIVE PROFILE PULSE ───────────────────────────────────────────────────
   This is the core of Nüra's concept: the profile is alive, updating now.
   ──────────────────────────────────────────────────────────────────────── */

function LivePulse({ helper }) {
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2500)
    return () => clearInterval(t)
  }, [])

  const facts = [
    { icon: <Brain size={12} />, text: `Personalidad analizada en ${helper.services} servicios reales` },
    { icon: <Cpu size={12} />, text: `${helper.hiddenSkills?.length || 2} habilidades detectadas sin que ${helper.name?.split(' ')[0] || helper.name} las declarara` },
    { icon: <Activity size={12} />, text: `Reputación actualizada automáticamente tras cada valoración` },
    { icon: <MessageSquare size={12} />, text: `Comportamiento en chats analizado para construir el perfil` },
  ]

  return (
    <div className={styles.liveCard}>
      <div className={styles.liveHeader}>
        <span className={`${styles.liveDot} ${pulse ? styles.liveDotPulse : ''}`} />
        <span className={styles.liveLabel}>Perfil vivo — Nüra lo construye y actualiza sola</span>
      </div>
      <div className={styles.liveFacts}>
        {facts.map((f, i) => (
          <div key={i} className={styles.liveFact}>
            <span className={styles.liveFactIcon}>{f.icon}</span>
            <span className={styles.liveFactText}>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── NÜRA AI PROACTIVE QUESTION ────────────────────────────────────────── */
function NuraQuestion({ helperName }) {
  const [answered, setAnswered] = useState(false)
  const [answer, setAnswer] = useState('')
  const [sent, setSent] = useState(false)

  if (sent) return (
    <div className={styles.nuraQuestionSent}>
      <Sparkles size={14} color="var(--purple)" />
      <span>Respuesta enviada. Nüra actualizará el perfil de {helperName.split(' ')[0]} en breve.</span>
    </div>
  )

  return (
    <div className={styles.nuraQuestion}>
      <div className={styles.nuraQuestionHeader}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.nuraIso} />
        <div>
          <span className={styles.nuraQuestionFrom}>Nüra IA · Pregunta proactiva</span>
          <p className={styles.nuraQuestionText}>
            {helperName.split(' ')[0]}, ¿has completado alguna formación nueva o trabajado en un contexto diferente en los últimos 3 meses? Tu perfil se actualiza con lo que aprendes.
          </p>
        </div>
      </div>
      {!answered ? (
        <div className={styles.nuraQuestionActions}>
          <button className={styles.nuraQuestionBtn} onClick={() => setAnswered(true)}>
            Sí, cuéntaselo a Nüra
          </button>
          <button className={styles.nuraQuestionSkip} onClick={() => setSent(true)}>
            No por ahora
          </button>
        </div>
      ) : (
        <div className={styles.nuraQuestionInput}>
          <input
            placeholder="Cuéntale a Nüra qué has aprendido..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className={styles.nuraInput}
            autoFocus
          />
          <button
            className={styles.nuraInputSend}
            disabled={!answer.trim()}
            onClick={() => setSent(true)}
          >→</button>
        </div>
      )}
    </div>
  )
}

/* ── PERSONALITY CIRCLES ──────────────────────────────────────────────── */
function PersonalityCircle({ label, value, color }) {
  const pct = (value / 10) * 100
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className={styles.pCircle}>
      <svg width="58" height="58" viewBox="0 0 58 58">
        <circle cx="29" cy="29" r={r} fill="none" stroke="var(--rule2)" strokeWidth="4" />
        <circle cx="29" cy="29" r={r} fill="none" stroke={color}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 29 29)" />
        <text x="29" y="34" textAnchor="middle"
          fontSize="11" fontWeight="800" fill="var(--ink)"
          fontFamily="Inter, sans-serif">{value.toFixed(1)}</text>
      </svg>
      <span className={styles.pCircleLabel}>{label}</span>
    </div>
  )
}

/* ── EXPERIENCE CARD ──────────────────────────────────────────────────── */
function ExperienceCard({ exp }) {
  return (
    <div className={styles.expCard}>
      <div className={styles.expTop}>
        <div className={styles.expInfo}>
          <div className={styles.expRole}>{exp.role}</div>
          <div className={styles.expCompanyName}>{exp.company}</div>
          <div className={styles.expPeriodLoc}>{exp.period} · {exp.location}</div>
        </div>
        {exp.verifiedByCompany && (
          <span className={styles.expVerifiedTag}><Building2 size={9} /> Verificado</span>
        )}
      </div>

      {exp.competencies?.length > 0 && (
        <div className={styles.competencies}>
          {exp.competencies.map((c, i) => <span key={i} className={styles.competency}>{c}</span>)}
        </div>
      )}

      {exp.managerOpinion && (
        <div className={styles.managerBlock}>
          <div className={styles.managerHeader}>
            <div className={styles.managerAvatar}>{exp.managerOpinion.avatar}</div>
            <div className={styles.managerInfo}>
              <span className={styles.managerName}>{exp.managerOpinion.name}</span>
              <span className={styles.managerRole}>{exp.managerOpinion.role}</span>
            </div>
            <div className={styles.managerStars}>
              {[1,2,3,4,5].map(n => <Star key={n} size={10} fill="#F59E0B" color="#F59E0B" />)}
            </div>
          </div>
          <p className={styles.managerQuote}>"{exp.managerOpinion.text}"</p>
          <span className={styles.managerVerified}><Shield size={9} /> Opinión verificada por Nüra</span>
        </div>
      )}

      {exp.colleagueOpinions?.length > 0 && (
        <div className={styles.colleaguesBlock}>
          <p className={styles.colleaguesTitle}>Compañeros de trabajo</p>
          {exp.colleagueOpinions.map((c, i) => (
            <div key={i} className={styles.colleagueRow}>
              <div className={styles.colleagueAvatar}>{c.avatar}</div>
              <div>
                <span className={styles.colleagueName}>{c.name}</span>
                <span className={styles.colleagueRole}> · {c.role}</span>
                <p className={styles.colleagueQuote}>"{c.text}"</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── POST CARD ────────────────────────────────────────────────────────── */
function PostCard({ post, helper }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        {helper.avatarUrl
          ? <img src={helper.avatarUrl} alt="" className={styles.postAvatarImg} />
          : <div className={styles.postAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
        }
        <div className={styles.postMeta}>
          <span className={styles.postName}>{helper.name}</span>
          <span className={styles.postDate}>{post.date}</span>
        </div>
        {post.verifiedWork && (
          <span className={styles.verifiedWorkBadge}><Shield size={9} /> Verificado</span>
        )}
      </div>
      <p className={styles.postText}>{post.text}</p>
      {post.badge && <div className={styles.postBadge}>{post.badge}</div>}
      <div className={styles.postActions}>
        <button className={`${styles.postAction} ${liked ? styles.postActionActive : ''}`}
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1) }}>
          <ThumbsUp size={14} /> {likes}
        </button>
        <button className={styles.postAction} onClick={() => setShowComment(s => !s)}>
          <MessageSquare size={14} /> {post.comments + comments.length}
        </button>
      </div>
      {showComment && (
        <div className={styles.commentInputRow}>
          <input className={styles.commentField} placeholder="Escribe un comentario..."
            value={comment} onChange={e => setComment(e.target.value)} autoFocus
            onKeyDown={e => e.key === 'Enter' && comment.trim() && (
              setComments(c => [...c, { text: comment }]),
              setComment(''), setShowComment(false)
            )} />
          <button className={styles.commentSubmit} disabled={!comment.trim()}
            onClick={() => { setComments(c => [...c, { text: comment }]); setComment(''); setShowComment(false) }}>→</button>
        </div>
      )}
      {comments.map((c, i) => (
        <div key={i} className={styles.userComment}>
          <div className={styles.commentDot}>T</div>
          <div className={styles.commentBubble}>
            <span className={styles.commentUser}>Tú</span>
            <p className={styles.commentText}>{c.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── MAIN ─────────────────────────────────────────────────────────────── */
function HelperProfileInner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRated, helpersCache, toggleFavorite, isFavorite } = useUser()
  const [showRating, setShowRating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const [shared, setShared] = useState(false)
  const [faved, setFaved] = useState(false)
  // sync faved state
  // useEffect(() => { if(h) setFaved(isFavorite(h.id)) }, [h?.id])
  const [activeTab, setActiveTab] = useState('perfil')

  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [h, setH] = useState(null)

  useEffect(() => {
    // 1. Navigation state (fastest - passed from result card)
    if (location.state?.helper && String(location.state.helper.id) === String(id)) {
      setH(location.state.helper)
      return
    }
    // 2. Window cache (from search results)
    const winCached = window.__nuraHelperCache?.[id] || window.__nuraHelperCache?.[parseInt(id)] || window.__nuraHelperCache?.[String(id)]
    if (winCached) { setH(winCached); return }
    // 3. Context cache
    const cached = helpersCache?.[parseInt(id)] || helpersCache?.[id] || helpersCache?.[String(id)]
    if (cached) { setH(cached); return }
    // 4. Local
    const local = HELPERS.find(x => x && String(x.id) === String(id))
    if (local) { setH(local); return }
    // 5. Supabase
    setLoading(true)
    getHelperById(id)
      .then(remote => { if (remote) setH(remote) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',background:'#F8F8FA'}}>
      <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
        <img src="/logo-iso.png" alt="Nüra" style={{width:'48px',height:'48px',animation:'pulse 1.5s ease-in-out infinite'}} />
        <p style={{fontSize:'13px',color:'var(--soft)'}}>Cargando perfil...</p>
      </div>
    </div>
  )

  if (!h) return (
    <div className={styles.notFound}>
      <AlertCircle size={40} color="var(--rule)" />
      <p>Perfil no encontrado.</p>
      <button onClick={() => navigate(-1)}>Volver</button>
    </div>
  )

  function handleShare() {
    if (navigator.share) navigator.share({ title: h.name, text: `${h.specialty} en Nüra`, url: window.location.href })
    else { navigator.clipboard?.writeText(window.location.href); setShared(true); showToast('Enlace copiado al portapapeles'); setTimeout(() => setShared(false), 2000) }
  }

  const tabs = [
    { id: 'perfil', label: 'Perfil vivo', icon: <Activity size={12} /> },
    { id: 'empresas', label: 'Trayectoria', icon: <TrendingUp size={12} /> },
    { id: 'feed', label: 'Posts', icon: <MessageSquare size={12} /> },
    { id: 'reputacion', label: 'Reputación', icon: <BarChart2 size={12} /> },
  ]

  const score = Math.round(
    ((h.rating || 0) / 5) * 40 +
    (Math.min(h.services || 0, 100) / 100) * 30 +
    ((h.completionRate || 0) / 100) * 20 +
    (h.dniVerified ? 10 : 0)
  )
  const level = score >= 90 ? { label: 'Experto verificado', color: '#059669', bg: '#ECFDF5' }
    : score >= 75 ? { label: 'Referente de confianza', color: '#1A56DB', bg: '#EFF6FF' }
    : { label: 'Con historial', color: '#D97706', bg: '#FFFBEB' }

  return (
    <div className={styles.page}>
      {/* Header */}
      <PageHeader showBack rightEl={<button className={styles.shareBtn} onClick={handleShare}>{shared ? <span style={{fontSize:'14px',fontWeight:700,color:'#059669'}}>✓</span> : <Share2 size={17} color="#1a1a1a" />}</button>} />

      <div className={styles.content}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroInner}>
          {h.avatarUrl
            ? <img src={h.avatarUrl} alt={h.name} className={styles.heroAvatar} />
            : <div className={styles.heroAvatarFallback} style={{ background: h.avatarColor }}>{h.avatar}</div>
          }
          {/* Name */}
          <h1 className={styles.heroName}>
            {h.name}
            {h.founder && <Award size={13} color='#92400E' style={{marginLeft:'5px',verticalAlign:'middle'}} />}
          </h1>
          <p className={styles.heroSpecialty}>{h.specialty || h.tags?.[0]}</p>

          {/* One line: rating · distance · response time */}
          <div className={styles.heroMeta}>
            <Star size={12} fill="#F59E0B" color="#F59E0B" />
            <strong>{h.rating}</strong>
            <span className={styles.heroMetaDot}>·</span>
            <MapPin size={12} color="var(--soft)" />
            <span>{h.distance} km</span>
            <span className={styles.heroMetaDot}>·</span>
            <Clock size={12} color="var(--soft)" />
            <span>{h.responseTime}</span>
          </div>

          {/* Status + key badges — only non-obvious info */}
          <div className={styles.heroTags}>
            <span className={h.available ? styles.tagGreen : styles.tagGray}>
              <span className={styles.dot} />{h.available ? 'Disponible' : 'No disponible'}
            </span>
            {h.presential && h.online
              ? <span className={styles.tag}>Presencial · Online</span>
              : h.presential ? <span className={styles.tag}>Solo presencial</span>
              : <span className={styles.tag}>Solo online</span>}
            {h.urgent && <span className={styles.tagRed}><Zap size={10} /> Urgencias</span>}
            {h.dniVerified && <span className={styles.tagBlue}><Shield size={10} /> Verificado</span>}
          </div>

          <div className={styles.heroActions}>
            <button className={styles.heroCtaSecondary} onClick={() => navigate(`/chat/${h.id}`)}>
              <MessageCircle size={15} /> Preguntar
            </button>
            <button className={styles.heroCtaBtn} onClick={() => { setShowConfirm(true) }}>
              <Calendar size={15} /> Contratar
            </button>
          </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{h.services}</span>
            <span className={styles.statLbl}>Servicios</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statNum}>{h.completionRate}%</span>
            <span className={styles.statLbl}>Completados</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statNum}>{h.reviews}</span>
            <span className={styles.statLbl}>Valoraciones</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statNum}>{h.rating}</span>
            <span className={styles.statLbl}>Puntuación</span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsWrap}>
          <div className={styles.tabs}>
            {tabs.map(tab => (
              <button key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}>
                {tab.icon} <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB: PERFIL VIVO ── */}
        {activeTab === 'perfil' && (
          <>
            

            {/* Bio */}
            <div className={styles.bioCard}>
              <p className={styles.bioText}>{h.bio}</p>
            </div>


            {/* Achievement badges */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><Sparkles size={13} /> Reconocimientos</h3>
              <div className={styles.badgesGrid}>
                {(h.services || 0) >= 50 && (
                  <div className={styles.achieveBadge}>
                    <span className={styles.achieveEmoji}>🏆</span>
                    <span className={styles.achieveLabel}>+50 servicios</span>
                  </div>
                )}
                {h.rating >= 4.8 && (
                  <div className={styles.achieveBadge}>
                    <span className={styles.achieveEmoji}>⭐</span>
                    <span className={styles.achieveLabel}>Valoración top</span>
                  </div>
                )}
                {h.dniVerified && (
                  <div className={styles.achieveBadge}>
                    <span className={styles.achieveEmoji}>🛡️</span>
                    <span className={styles.achieveLabel}>Identidad verificada</span>
                  </div>
                )}
                {(h.completionRate || 0) >= 95 && (
                  <div className={styles.achieveBadge}>
                    <span className={styles.achieveEmoji}>✅</span>
                    <span className={styles.achieveLabel}>+95% completados</span>
                  </div>
                )}
                {h.urgent && (
                  <div className={styles.achieveBadge}>
                    <span className={styles.achieveEmoji}>⚡</span>
                    <span className={styles.achieveLabel}>Disponible urgencias</span>
                  </div>
                )}
                {h.founder && (
                  <div className={styles.achieveBadge} style={{background:'rgba(146,64,14,0.08)',borderColor:'rgba(146,64,14,0.2)'}}>
                    <span className={styles.achieveEmoji}>🌟</span>
                    <span className={styles.achieveLabel} style={{color:'#92400E'}}>Helper fundador</span>
                  </div>
                )}
              </div>
            </section>
            {/* Nüra-detected skills — THE differentiator */}
            {h.hiddenSkills?.length > 0 && (
              <div className={styles.nuraDetectedCard}>
                <div className={styles.nuraDetectedHeader}>
                  <Cpu size={14} color="var(--purple)" />
                  <span>Detectado por Nüra · no declarado por {h.name?.split(' ')?.[0] || h.name || ''}</span>
                </div>
                <p className={styles.nuraDetectedDesc}>
                  Nüra identificó estas capacidades analizando conversaciones, comportamiento y valoraciones reales. {h.name?.split(' ')?.[0] || h.name || ''} nunca las declaró explícitamente.
                </p>
                <div className={styles.nuraDetectedSkills}>
                  {h.hiddenSkills.map((s, i) => (
                    <span key={i} className={styles.nuraSkill}>{s}</span>
                  ))}
                </div>
              </div>
            )}



            {/* Declared skills */}
            {h.skills?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><CheckCircle size={13} /> Especialidades declaradas</h3>
                <div className={styles.skillsGrid}>
                  {h.skills.map((s, i) => <span key={i} className={styles.skill}>{s}</span>)}
                </div>
              </section>
            )}

            {/* Education */}
            {h.education?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><BookOpen size={13} /> Formación académica</h3>
                <div className={styles.nuraVerifyNote}>
                  <Cpu size={11} />
                  <span>Nüra buscó el plan de estudios en internet — asignatura por asignatura, universidad por universidad</span>
                </div>
                <div className={styles.eduTimeline}>
                  {h.education.map((ed, i) => (
                    <div key={i} className={styles.eduItem}>
                      <div className={styles.eduTimelineLeft}>
                        <div className={styles.eduIcon}>🎓</div>
                      </div>
                      <div className={styles.eduBody}>
                        <div className={styles.eduTitle}>{ed.title}</div>
                        <div className={styles.eduInstitution}>{ed.institution}</div>
                        <div className={styles.eduYear}>{ed.year}</div>
                        <p className={styles.eduDetails}>{ed.details}</p>
                        {ed.verified && (
                          <span className={styles.eduVerifiedBadge}><Shield size={9} /> Verificado por Nüra</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {h.languages?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Globe size={13} /> Idiomas</h3>
                <div className={styles.langRow}>
                  {h.languages.map((l, i) => <span key={i} className={styles.langTag}>{l}</span>)}
                </div>
              </section>
            )}

            {/* Reviews — semantic analysis */}
            {h.qualitativeComments?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Heart size={13} /> Valoraciones reales</h3>
                {/* Rating breakdown */}
                <div className={styles.ratingBreakdown}>
                  <div className={styles.ratingBig}>
                    <span className={styles.ratingBigNum}>{h.rating}</span>
                    <div className={styles.ratingStars}>{[1,2,3,4,5].map(n=><Star key={n} size={14} fill="#F59E0B" color="#F59E0B" />)}</div>
                    <span className={styles.ratingCount}>{h.reviews} valoraciones</span>
                  </div>
                  <div className={styles.ratingBars}>
                    {[5,4,3,2,1].map(n => (
                      <div key={n} className={styles.ratingBarRow}>
                        <span className={styles.ratingBarN}>{n}</span>
                        <div className={styles.ratingBarTrack}>
                          <div className={styles.ratingBarFill} style={{width: n===5?'70%':n===4?'20%':n===3?'7%':'3%'}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.nuraVerifyNote}>
                  <Cpu size={11} />
                  <span>Nüra analiza el texto semánticamente — los adjetivos se convierten en atributos del perfil</span>
                </div>
                <div className={styles.reviewsList}>
                  {h.qualitativeComments.map((c, i) => (
                    <div key={i} className={styles.reviewItem}>
                      <div className={styles.reviewAvatar}>{c.avatar?.[0] || c.user?.[0]}</div>
                      <div className={styles.reviewBody}>
                        <div className={styles.reviewTop}>
                          <span className={styles.reviewUser}>{c.user}</span>
                          <div className={styles.reviewStars}>
                            {[1,2,3,4,5].map(n => <Star key={n} size={9} fill="#F59E0B" color="#F59E0B" />)}
                          </div>
                          <span className={styles.reviewDate}>{c.date}</span>
                        </div>
                        <p className={styles.reviewText}>"{c.text}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── TAB: LABORAL ── */}
        {activeTab === 'empresas' && (
          <div>
            <div className={styles.empresasIntroCard}>
              <Shield size={16} color="var(--purple)" />
              <div>
                <p className={styles.empresasIntroTitle}>Historial verificado por terceros</p>
                <p className={styles.empresasIntroDesc}>
                  Lo que ves aquí no lo ha escrito {h.name?.split(' ')?.[0] || h.name || ''}. Lo han escrito las empresas y personas que han trabajado con él. Imposible de falsificar.
                </p>
              </div>
            </div>

            {h.experience?.length > 0 ? (
              <div className={styles.expTimeline}>
                {h.experience.map((ex, i) => (
                  <div key={i} className={styles.expTimelineItem}>
                    <div className={styles.expTimelineLeft}>
                      <div className={styles.expLogo}>{ex.companyLogo}</div>
                      {i < h.experience.length - 1 && <div className={styles.expConnector} />}
                    </div>
                    <div className={styles.expTimelineBody}>
                      <ExperienceCard exp={ex} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyTab}>
                <Building2 size={32} color="var(--rule)" />
                <p>Sin historial laboral todavía.</p>
              </div>
            )}

            <div className={styles.companyCta}>
              <Lock size={16} color="var(--soft)" />
              <div>
                <p className={styles.companyCtaTitle}>¿Has trabajado con {h.name?.split(' ')?.[0] || h.name || ''}?</p>
                <p className={styles.companyCtaDesc}>Las empresas pueden añadir verificaciones al perfil. Disponible en Fase 3.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: PUBLICACIONES ── */}
        {activeTab === 'feed' && (
          <div>
            {h.posts?.length > 0
              ? h.posts.map(post => <PostCard key={post.id} post={post} helper={h} />)
              : (
                <div className={styles.emptyTab}>
                  <MessageSquare size={32} color="var(--rule)" />
                  <p>{h.name?.split(' ')?.[0] || h.name || ''} aún no ha publicado nada.</p>
                </div>
              )
            }
          </div>
        )}

        {/* ── TAB: REPUTACIÓN ── */}
        {activeTab === 'reputacion' && (
          <div>
            {/* Score */}
            <div className={styles.scoreCard}>
              <div className={styles.scoreLeft}>
                <div className={styles.scoreNum} style={{ color: level.color }}>{score}</div>
                <div className={styles.scoreMax}>/100</div>
              </div>
              <div className={styles.scoreRight}>
                <span className={styles.scoreBadge} style={{ color: level.color, background: level.bg }}>
                  <Sparkles size={11} /> {level.label}
                </span>
                <p className={styles.scoreDesc}>
                  Construida con {h.services} servicios reales y {h.reviews} valoraciones. Se actualiza automáticamente.
                </p>
                <div className={styles.scoreComponents}>
                  <div className={styles.scoreComp}><span>Valoración</span><span>{Math.round((h.rating/5)*40)}/40</span></div>
                  <div className={styles.scoreComp}><span>Servicios</span><span>{Math.round((Math.min(h.services,100)/100)*30)}/30</span></div>
                  <div className={styles.scoreComp}><span>Completados</span><span>{Math.round((h.completionRate/100)*20)}/20</span></div>
                  <div className={styles.scoreComp}><span>Verificación</span><span>{h.dniVerified ? 10 : 0}/10</span></div>
                </div>
              </div>
            </div>

            {/* Personality */}
            {h.personality && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Brain size={13} /> Análisis de personalidad</h3>
                <div className={styles.nuraVerifyNote}>
                  <Cpu size={11} />
                  <span>Derivado del comportamiento en {h.services} servicios reales — no de un test de personalidad</span>
                </div>
                <div className={styles.personalityGrid}>
                  {[
                    ['Paciencia', h.personality.patience, 'var(--ink)'],
                    ['Empatía', h.personality.empathy, 'var(--mid)'],
                    ['Comunicación', h.personality.communication, 'var(--ink)'],
                    ['Puntualidad', h.personality.punctuality, 'var(--mid)'],
                    ['Autonomía', h.personality.autonomy, 'var(--ink)'],
                  ].map(([l, v, c]) => <PersonalityCircle key={l} label={l} value={v} color={c} />)}
                </div>
              </section>
            )}

            {/* Evolution */}
            {h.evolution?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><TrendingUp size={13} /> Trayectoria en Nüra</h3>
                <div className={styles.evoTimeline}>
                  {h.evolution.map((pt, i) => {
                    const isLast = i === h.evolution.length - 1
                    const prev = h.evolution[i - 1]
                    const improved = prev && pt.rating > prev.rating
                    return (
                      <div key={i} className={styles.evoPoint}>
                        <div className={styles.evoPointLeft}>
                          <div className={`${styles.evoDot} ${isLast ? styles.evoDotCurrent : ''}`} />
                          {!isLast && <div className={styles.evoConnector} />}
                        </div>
                        <div className={styles.evoContent}>
                          <div className={styles.evoYear}>{pt.period}{isLast ? ' · Ahora' : ''}</div>
                          <div className={styles.evoStats}>
                            <span className={styles.evoRatingPill}>★ {pt.rating}</span>
                            <span className={styles.evoServicesPill}>{pt.services} servicios</span>
                            {improved && <span className={styles.evoTrend}>↑ Mejora</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            <div className={styles.nuraSeal}>
              <Layers size={13} color="var(--purple)" />
              <span>Perfil construido por Nüra · No por {h.name?.split(' ')?.[0] || h.name || ''} · {h.services} servicios reales · Se actualiza solo</span>
            </div>
          </div>
        )}
      </div>

      {showRating && <RatingModal helper={h} onClose={() => setShowRating(false)} />}
      {showConfirm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:'24px 24px 0 0',padding:'24px 20px',width:'100%',maxWidth:'500px'}}>
            <div style={{width:'36px',height:'4px',background:'var(--rule)',borderRadius:'2px',margin:'0 auto 20px'}} />
            <h3 style={{fontSize:'17px',fontWeight:800,color:'var(--ink)',marginBottom:'6px'}}>Contratar a {h.name?.split(' ')?.[0] || h.name || ''}</h3>
            <p style={{fontSize:'13px',color:'var(--mid)',marginBottom:'20px'}}>{h.price && h.price !== 'Consultar' ? h.price : 'Precio a consultar'} · {h.zone}</p>
            <button onClick={() => { setShowConfirm(false); navigate(`/chat/${h.id}`) }}
              style={{width:'100%',padding:'14px',background:'var(--grad-main)',color:'white',border:'none',borderRadius:'18px',fontSize:'15px',fontWeight:700,boxShadow:'0 4px 16px rgba(123,47,255,0.3)',marginBottom:'10px'}}>
              Enviar solicitud de servicio
            </button>
            <button onClick={() => setShowConfirm(false)}
              style={{width:'100%',padding:'12px',background:'transparent',color:'var(--soft)',border:'none',fontSize:'14px'}}>
              Cancelar
            </button>
          </div>
        </div>
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
