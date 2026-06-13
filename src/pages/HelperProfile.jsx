import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Star, Shield, MapPin, MessageCircle, Zap,
  TrendingUp, Clock, CheckCircle, Award, Brain, Globe,
  Building2, BookOpen, Share2, Lock, Heart, Sparkles,
  ThumbsUp, MessageSquare, AlertCircle, BarChart2, ChevronRight
} from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import RatingModal from '../components/RatingModal'
import styles from './HelperProfile.module.css'

function PersonalityBar({ label, value }) {
  return (
    <div className={styles.pBar}>
      <span className={styles.pBarLabel}>{label}</span>
      <div className={styles.pBarTrack}>
        <div className={styles.pBarFill} style={{ width: `${value * 10}%` }} />
      </div>
      <span className={styles.pBarVal}>{value.toFixed(1)}</span>
    </div>
  )
}

function ReputationScore({ helper }) {
  const score = Math.round(
    (helper.rating / 5) * 40 +
    (Math.min(helper.services, 100) / 100) * 30 +
    (helper.completionRate / 100) * 20 +
    (helper.dniVerified ? 10 : 0)
  )
  const level = score >= 90 ? { label: 'Experto verificado', color: '#059669', bg: '#ECFDF5' }
    : score >= 75 ? { label: 'Referente', color: '#1A56DB', bg: '#EFF6FF' }
    : score >= 60 ? { label: 'Con historial', color: '#D97706', bg: '#FFFBEB' }
    : { label: 'Nuevo', color: '#6B7280', bg: '#F9FAFB' }
  return (
    <div className={styles.reputationCard}>
      <div className={styles.reputationLeft}>
        <div className={styles.reputationScore} style={{ color: level.color }}>{score}</div>
        <div className={styles.reputationMax}>/100</div>
      </div>
      <div className={styles.reputationRight}>
        <span className={styles.reputationLevel} style={{ color: level.color, background: level.bg }}>
          <Sparkles size={11} /> {level.label}
        </span>
        <p className={styles.reputationDesc}>
          Puntuación construida automáticamente con {helper.services} servicios reales, valoraciones verificadas y comportamiento en la plataforma.
        </p>
      </div>
    </div>
  )
}

function PostCard({ post, helperName, helperAvatar, helperColor }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])

  function handleLike() {
    setLiked(l => !l)
    setLikes(n => liked ? n - 1 : n + 1)
  }

  function submitComment() {
    if (!comment.trim()) return
    setComments(c => [...c, { text: comment, user: 'Tú', date: 'Ahora' }])
    setComment('')
    setShowComment(false)
  }

  return (
    <div className={styles.postCard}>
      {/* Post header */}
      <div className={styles.postHeader}>
        <div className={styles.postAvatar} style={{ background: helperColor }}>{helperAvatar}</div>
        <div className={styles.postMeta}>
          <span className={styles.postName}>{helperName}</span>
          <span className={styles.postDate}>{post.date}</span>
        </div>
        {post.verifiedWork && (
          <span className={styles.verifiedWorkBadge}><Shield size={10} /> Trabajo verificado</span>
        )}
      </div>

      {/* Post content */}
      <p className={styles.postText}>{post.text}</p>

      {post.badge && (
        <div className={styles.postBadge}>{post.badge}</div>
      )}

      {/* Actions */}
      <div className={styles.postActions}>
        <button className={`${styles.postAction} ${liked ? styles.postActionActive : ''}`} onClick={handleLike}>
          <ThumbsUp size={14} /> {likes}
        </button>
        <button className={styles.postAction} onClick={() => setShowComment(s => !s)}>
          <MessageSquare size={14} /> {post.comments + comments.length}
        </button>
      </div>

      {/* Comment input */}
      {showComment && (
        <div className={styles.commentInput}>
          <input
            placeholder="Escribe un comentario..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitComment()}
            className={styles.commentField}
            autoFocus
          />
          <button className={styles.commentSubmit} onClick={submitComment} disabled={!comment.trim()}>
            Publicar
          </button>
        </div>
      )}

      {/* User comments */}
      {comments.map((c, i) => (
        <div key={i} className={styles.userComment}>
          <div className={styles.commentAvatar}>T</div>
          <div className={styles.commentBubble}>
            <span className={styles.commentUser}>{c.user}</span>
            <p className={styles.commentText}>{c.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ExperienceCard({ exp, helperName }) {
  return (
    <div className={styles.expCardFull}>
      {/* Company header */}
      <div className={styles.expCompanyHeader}>
        <div className={styles.expLogo}>{exp.companyLogo}</div>
        <div className={styles.expInfo}>
          <div className={styles.expRole}>{exp.role}</div>
          <div className={styles.expCompanyName}>{exp.company}</div>
          <div className={styles.expPeriodLoc}>{exp.period} · {exp.location}</div>
        </div>
        {exp.verifiedByCompany && (
          <span className={styles.verifiedTag} style={{background:'#EFF6FF',color:'#1E40AF'}}>
            <Building2 size={9} /> Verificado
          </span>
        )}
      </div>

      {/* Competencies */}
      <div className={styles.competencies}>
        {exp.competencies?.map((c, i) => <span key={i} className={styles.competency}>{c}</span>)}
      </div>

      {/* Manager opinion */}
      {exp.managerOpinion && (
        <div className={styles.managerOpinion}>
          <div className={styles.opinionHeader}>
            <div className={styles.opinionAvatar}>{exp.managerOpinion.avatar}</div>
            <div>
              <div className={styles.opinionName}>{exp.managerOpinion.name}</div>
              <div className={styles.opinionRole}>{exp.managerOpinion.role} · {exp.company}</div>
            </div>
            <div className={styles.opinionStars}>
              {[1,2,3,4,5].map(n => <Star key={n} size={10} fill="#F59E0B" color="#F59E0B" />)}
            </div>
          </div>
          <p className={styles.opinionText}>"{exp.managerOpinion.text}"</p>
          <div className={styles.opinionBadge}><Shield size={10} /> Opinión verificada — añadida por la empresa en Nüra</div>
        </div>
      )}

      {/* Colleague opinions */}
      {exp.colleagueOpinions?.length > 0 && (
        <div className={styles.colleagueOpinions}>
          <div className={styles.colleagueTitle}>Compañeros de trabajo</div>
          {exp.colleagueOpinions.map((c, i) => (
            <div key={i} className={styles.colleagueCard}>
              <div className={styles.colleagueAvatar}>{c.avatar}</div>
              <div>
                <div className={styles.colleagueName}>{c.name} · <span className={styles.colleagueRole}>{c.role}</span></div>
                <p className={styles.colleagueText}>"{c.text}"</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HelperProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRated, helpersCache } = useUser()
  const [showRating, setShowRating] = useState(false)
  const [shared, setShared] = useState(false)
  const [activeTab, setActiveTab] = useState('perfil')

  const h = helpersCache?.[parseInt(id)] || helpersCache?.[id] || HELPERS.find(x => x.id === parseInt(id))

  if (!h) return (
    <div className={styles.notFound}>
      <AlertCircle size={48} color="var(--rule)" />
      <p>Perfil no encontrado.</p>
      <button onClick={() => navigate(-1)}>Volver</button>
    </div>
  )

  const levelLabel = { student: 'Estudiante', experienced: 'Con experiencia', professional: 'Profesional titulado' }[h.qualificationLevel] || 'Con experiencia'

  function handleShare() {
    if (navigator.share) navigator.share({ title: h.name, text: `${h.specialty} verificado en Nüra`, url: window.location.href })
    else { navigator.clipboard?.writeText(window.location.href); setShared(true); setTimeout(() => setShared(false), 2000) }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <img src="/logo-text.png" alt="Nüra" className={styles.logoText} />
        <div className={styles.headerActions}>
          <button className={styles.shareBtn} onClick={handleShare}>{shared ? '✓' : <Share2 size={15} />}</button>
          {!hasRated(h.id) && <button className={styles.rateHeaderBtn} onClick={() => setShowRating(true)}><Star size={12} /> Valorar</button>}
        </div>
      </header>

      <div className={styles.content}>
        {/* Hero */}
        <div className={styles.heroCard}>
          {h.avatarUrl
            ? <img src={h.avatarUrl} alt={h.name} className={styles.avatarImg} />
            : <div className={styles.avatar} style={{ background: h.avatarColor }}>{h.avatar}</div>
          }
          <h1 className={styles.name}>{h.name}</h1>
          <p className={styles.specialty}>{h.specialty || h.tags?.[0]}</p>
          <div className={styles.metaRow}>
            <span className={styles.ratingBig}><Star size={14} fill="#F59E0B" color="#F59E0B" /> {h.rating}</span>
            <span className={styles.metaDot} />
            <span className={styles.metaItem}><MapPin size={12} /> {h.zone}</span>
            <span className={styles.metaDot} />
            <span className={styles.metaItem}>{h.distance} km</span>
          </div>
          <div className={styles.badges}>
            {h.dniVerified && <span className={styles.badge} style={{color:'#059669',background:'#ECFDF5'}}><Shield size={10} /> DNI Verificado</span>}
            {h.criminalRecordClear && <span className={styles.badge} style={{color:'#1E40AF',background:'#EFF6FF'}}><CheckCircle size={10} /> Sin antecedentes</span>}
            {h.founder && <span className={styles.badge} style={{color:'#92400E',background:'#FEF3C7'}}><Award size={10} /> Fundador</span>}
            {h.urgent && <span className={styles.badge} style={{color:'#DC2626',background:'#FEF2F2'}}><Zap size={10} /> Urgencias</span>}
            <span className={styles.badge} style={{color:'var(--purple)',background:'rgba(123,47,255,0.08)'}}>{levelLabel}</span>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {[
            { icon: <Star size={13} />, val: h.rating, lbl: 'Valoración', color: '#F59E0B' },
            { icon: <CheckCircle size={13} />, val: h.services, lbl: 'Servicios', color: '#059669' },
            { icon: <Clock size={13} />, val: h.responseTime, lbl: 'Respuesta', color: 'var(--purple)' },
            { icon: <TrendingUp size={13} />, val: `${h.completionRate}%`, lbl: 'Completados', color: 'var(--cyan2)' },
          ].map((s, i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statIcon} style={{color:s.color}}>{s.icon}</span>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLbl}>{s.lbl}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className={styles.priceRow}>
          <div className={styles.priceBox}>
            <span className={styles.priceVal}>{h.price}</span>
            <span className={styles.priceLbl}>Precio</span>
          </div>
          <div className={styles.modalBox}>
            {h.presential && <span className={styles.modal}>📍 Presencial</span>}
            {h.online && <span className={styles.modal}>💻 Online</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {[
            { id: 'perfil', label: 'Perfil vivo', icon: <Brain size={12} /> },
            { id: 'empresas', label: 'Historial laboral', icon: <Building2 size={12} /> },
            { id: 'feed', label: 'Publicaciones', icon: <MessageSquare size={12} /> },
            { id: 'reputacion', label: 'Reputación', icon: <BarChart2 size={12} /> },
          ].map(tab => (
            <button key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── PERFIL VIVO ── */}
        {activeTab === 'perfil' && (
          <>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><Brain size={13} /> Sobre {h.name.split(' ')[0]}</h3>
              <p className={styles.bio}>{h.bio}</p>
            </section>

            {h.education?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><BookOpen size={13} /> Formación académica verificada</h3>
                <p className={styles.sectionNote}>Plan de estudios buscado en internet por Nüra — asignatura por asignatura</p>
                {h.education.map((ed, i) => (
                  <div key={i} className={styles.eduCard}>
                    <div className={styles.eduHeader}>
                      <div>
                        <div className={styles.eduTitle}>{ed.title}</div>
                        <div className={styles.eduInstitution}>{ed.institution} · {ed.year}</div>
                      </div>
                      {ed.verified && <span className={styles.verifiedTag}><Shield size={9} /> Verificado</span>}
                    </div>
                    <p className={styles.eduDetails}>{ed.details}</p>
                  </div>
                ))}
              </section>
            )}

            {h.languages?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Globe size={13} /> Idiomas</h3>
                <div className={styles.langRow}>
                  {h.languages.map((l, i) => <span key={i} className={styles.langTag}>{l}</span>)}
                </div>
              </section>
            )}

            {(h.skills?.length > 0 || h.hiddenSkills?.length > 0) && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><CheckCircle size={13} /> Habilidades</h3>
                <div className={styles.skillsGrid}>
                  {(h.skills || []).map((s, i) => <span key={i} className={styles.skill}>{s}</span>)}
                </div>
                {h.hiddenSkills?.length > 0 && (
                  <div className={styles.hiddenSkills}>
                    <span className={styles.hiddenLabel}><Brain size={10} /> Detectadas por Nüra — no declaradas por el helper</span>
                    {h.hiddenSkills.map((s, i) => <span key={i} className={styles.hiddenSkill}>{s}</span>)}
                  </div>
                )}
              </section>
            )}

            {h.qualitativeComments?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Heart size={13} /> Lo que dicen de {h.name.split(' ')[0]}</h3>
                <p className={styles.sectionNote}>Analizadas semánticamente — los adjetivos se convierten en atributos verificados del perfil</p>
                {h.qualitativeComments.map((c, i) => (
                  <div key={i} className={styles.comment}>
                    <div className={styles.commentAvatarSmall}>{c.avatar || c.user?.[0]}</div>
                    <div>
                      <p className={styles.commentText}>"{c.text}"</p>
                      <span className={styles.commentMeta}>{c.user} · {c.date} · <Star size={9} fill="#F59E0B" color="#F59E0B" /> 5</span>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        {/* ── HISTORIAL LABORAL (Para empresas) ── */}
        {activeTab === 'empresas' && (
          <>
            <div className={styles.empresasIntro}>
              <Shield size={16} color="var(--purple)" />
              <p>El historial laboral de {h.name.split(' ')[0]} está verificado por las empresas que lo han contratado. No lo escribe él — lo escriben ellas.</p>
            </div>

            {h.experience?.length > 0 && h.experience.map((ex, i) => (
              <ExperienceCard key={i} exp={ex} helperName={h.name} />
            ))}

            {/* Company verification CTA */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}><Building2 size={13} /> ¿Has trabajado con {h.name.split(' ')[0]}?</h3>
              <p className={styles.sectionNote}>Las empresas pueden añadir verificaciones al perfil — tiempo trabajado, proyectos completados, competencias demostradas.</p>
              <div className={styles.companyVerifyBox}>
                <Lock size={18} color="var(--soft)" />
                <div>
                  <div className={styles.companyVerifyTitle}>Verificación empresarial disponible en Fase 3</div>
                  <div className={styles.companyVerifyDesc}>Contacta con nosotros en nura.app/empresas</div>
                </div>
              </div>
            </div>

            {/* Evidence summary */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><CheckCircle size={13} /> Evidencia objetiva</h3>
              <div className={styles.proofGrid}>
                <div className={styles.proofItem}>
                  <span className={styles.proofVal}>{h.rating}/5</span>
                  <span className={styles.proofLbl}>Valoración media de {h.reviews} personas reales</span>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofVal}>{h.completionRate}%</span>
                  <span className={styles.proofLbl}>Servicios sin incidencias</span>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofVal}>{h.services}</span>
                  <span className={styles.proofLbl}>Servicios completados en Nüra</span>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofVal}>{h.responseTime}</span>
                  <span className={styles.proofLbl}>Tiempo de respuesta</span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── FEED PUBLICACIONES ── */}
        {activeTab === 'feed' && (
          <>
            <div className={styles.feedIntro}>
              <Sparkles size={14} color="var(--purple)" />
              <p>Solo los trabajos verificados tienen el badge de Nüra. El resto son publicaciones propias del helper.</p>
            </div>
            {h.posts?.length > 0 ? (
              h.posts.map(post => (
                <PostCard key={post.id} post={post}
                  helperName={h.name} helperAvatar={h.avatar} helperColor={h.avatarColor} />
              ))
            ) : (
              <div className={styles.emptyFeed}>
                <MessageSquare size={32} color="var(--rule)" />
                <p>{h.name.split(' ')[0]} aún no ha publicado nada.</p>
              </div>
            )}
          </>
        )}

        {/* ── REPUTACIÓN ── */}
        {activeTab === 'reputacion' && (
          <>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><Sparkles size={13} /> Puntuación de reputación Nüra</h3>
              <p className={styles.sectionNote}>Se construye sola. No la escribe el helper — la construyen sus acciones reales.</p>
              <ReputationScore helper={h} />
            </section>

            {h.personality && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Brain size={13} /> Análisis de personalidad</h3>
                <p className={styles.sectionNote}>Derivado del comportamiento en {h.services} servicios — no de un test</p>
                <div className={styles.personality}>
                  {[['Paciencia', h.personality.patience],['Empatía', h.personality.empathy],['Comunicación', h.personality.communication],['Puntualidad', h.personality.punctuality],['Autonomía', h.personality.autonomy]].map(([l, v]) => (
                    <PersonalityBar key={l} label={l} value={v} />
                  ))}
                </div>
              </section>
            )}

            {h.evolution?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><TrendingUp size={13} /> Evolución del perfil</h3>
                <p className={styles.sectionNote}>La consistencia en el tiempo vale más que los picos aislados</p>
                <div className={styles.evoChart}>
                  {h.evolution.map((pt, i) => (
                    <div key={i} className={styles.evoItem}>
                      <div className={styles.evoBarWrap}>
                        <div className={styles.evoBar} style={{ height: `${Math.max((pt.rating - 4.0) * 100, 8)}%` }} />
                      </div>
                      <span className={styles.evoPeriod}>{pt.period}</span>
                      <span className={styles.evoRating}>{pt.rating}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className={styles.nuraNote}>
              <Shield size={12} />
              <span>Perfil verificado · DNI confirmado · {h.services} servicios reales · Se actualiza automáticamente</span>
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <button className={styles.ctaBtn} onClick={() => navigate(`/chat/${h.id}`)}>
          <MessageCircle size={17} /> Contactar a {h.name.split(' ')[0]}
        </button>
      </div>

      {showRating && <RatingModal helper={h} onClose={() => setShowRating(false)} />}
    </div>
  )
}
