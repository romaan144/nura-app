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

/* ── SUB-COMPONENTS ───────────────────────────────────── */

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
        <button
          className={`${styles.postAction} ${liked ? styles.postActionActive : ''}`}
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
              setComments(c => [...c, { text: comment, user: 'Tú' }]),
              setComment(''), setShowComment(false)
            )} />
          <button className={styles.commentSubmit}
            disabled={!comment.trim()}
            onClick={() => {
              setComments(c => [...c, { text: comment, user: 'Tú' }])
              setComment(''); setShowComment(false)
            }}>→</button>
        </div>
      )}

      {comments.map((c, i) => (
        <div key={i} className={styles.userComment}>
          <div className={styles.commentDot}>T</div>
          <div className={styles.commentBubble}>
            <span className={styles.commentUser}>{c.user}</span>
            <p className={styles.commentText}>{c.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ExperienceCard({ exp }) {
  return (
    <div>
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

/* ── MAIN COMPONENT ───────────────────────────────────── */

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
      <AlertCircle size={40} color="var(--rule)" />
      <p>Perfil no encontrado.</p>
      <button onClick={() => navigate(-1)}>Volver</button>
    </div>
  )

  function handleShare() {
    if (navigator.share) navigator.share({ title: h.name, text: `${h.specialty} en Nüra`, url: window.location.href })
    else { navigator.clipboard?.writeText(window.location.href); setShared(true); setTimeout(() => setShared(false), 2000) }
  }

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: <Brain size={12} /> },
    { id: 'empresas', label: 'Laboral', icon: <Building2 size={12} /> },
    { id: 'feed', label: 'Publicaciones', icon: <MessageSquare size={12} /> },
    { id: 'reputacion', label: 'Reputación', icon: <BarChart2 size={12} /> },
  ]

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <div className={styles.headerActions}>
          <button className={styles.shareBtn} onClick={handleShare}>
            {shared ? <span className={styles.copiedLabel}>✓ Copiado</span> : <Share2 size={15} />}
          </button>
          {!hasRated(h.id) && (
            <button className={styles.rateBtn} onClick={() => setShowRating(true)}>
              <Star size={13} /> Valorar
            </button>
          )}
        </div>
      </header>

      <div className={styles.content}>

        {/* ── HERO ── */}
        <div className={styles.hero}>
          {/* Gradient background from logo colors */}
          <div className={styles.heroBg} />

          <div className={styles.heroInner}>
            {h.avatarUrl
              ? <img src={h.avatarUrl} alt={h.name} className={styles.heroAvatar} />
              : <div className={styles.heroAvatarFallback} style={{ background: h.avatarColor }}>{h.avatar}</div>
            }

            <h1 className={styles.heroName}>{h.name}</h1>
            <p className={styles.heroSpecialty}>{h.specialty || h.tags?.[0]}</p>

            {/* Key info row */}
            <div className={styles.heroMeta}>
              <div className={styles.heroMetaItem}>
                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                <strong>{h.rating}</strong>
                <span>({h.reviews} val.)</span>
              </div>
              <div className={styles.heroMetaSep} />
              <div className={styles.heroMetaItem}>
                <MapPin size={12} />
                <span>{h.zone} · {h.distance}km</span>
              </div>
              <div className={styles.heroMetaSep} />
              <div className={styles.heroMetaItem}>
                <Clock size={12} />
                <span>{h.responseTime}</span>
              </div>
            </div>

            {/* Modality */}
            <div className={styles.heroModes}>
              {h.presential && <span className={styles.heroMode}>📍 Presencial</span>}
              {h.online && <span className={styles.heroMode}>💻 Online</span>}
            </div>

            {/* Trust badges — only most important */}
            <div className={styles.heroBadges}>
              {h.dniVerified && (
                <span className={styles.badgePrimary}><Shield size={10} /> DNI Verificado</span>
              )}
              {h.criminalRecordClear && (
                <span className={styles.badgeSecondary}><CheckCircle size={10} /> Sin antecedentes</span>
              )}
              {h.founder && (
                <span className={styles.badgeFounder}><Award size={10} /> Fundador</span>
              )}
              {h.urgent && (
                <span className={styles.badgeUrgent}><Zap size={10} /> Urgencias</span>
              )}
            </div>
          </div>
        </div>

        {/* ── QUICK STATS ── */}
        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <span className={styles.statNum} style={{color:'#059669'}}>{h.services}</span>
            <span className={styles.statLbl}>Servicios</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statNum} style={{color:'var(--purple)'}}>{h.completionRate}%</span>
            <span className={styles.statLbl}>Completados</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statNum} style={{color:'#D97706'}}>{h.reviews}</span>
            <span className={styles.statLbl}>Valoraciones</span>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className={styles.tabsWrap}>
          <div className={styles.tabs}>
            {tabs.map(tab => (
              <button key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}>
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* TAB: PERFIL VIVO                              */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === 'perfil' && (
          <>
            {/* Bio — first, prominent */}
            <div className={styles.bioCard}>
              <p className={styles.bioText}>{h.bio}</p>
            </div>

            {/* Nüra-detected skills — the key differentiator, shown prominently */}
            {h.hiddenSkills?.length > 0 && (
              <div className={styles.nuraDetectedCard}>
                <div className={styles.nuraDetectedHeader}>
                  <Sparkles size={14} color="var(--purple)" />
                  <span>Detectado por Nüra</span>
                </div>
                <p className={styles.nuraDetectedDesc}>
                  Habilidades que Nüra ha identificado a partir del comportamiento y valoraciones reales — no declaradas por el helper.
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
                <h3 className={styles.sectionTitle}><CheckCircle size={13} /> Especialidades</h3>
                <div className={styles.skillsGrid}>
                  {h.skills.map((s, i) => <span key={i} className={styles.skill}>{s}</span>)}
                </div>
              </section>
            )}

            {/* Education — timeline */}
            {h.education?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><BookOpen size={13} /> Formación académica verificada</h3>
                <div className={styles.sectionNote}>Plan de estudios verificado por Nüra en las webs oficiales de cada institución</div>
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

            {/* Reviews */}
            {h.qualitativeComments?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Heart size={13} /> Valoraciones reales</h3>
                <p className={styles.sectionNote}>
                  Nüra analiza el texto semánticamente — los adjetivos construyen el perfil de personalidad
                </p>
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

        {/* ══════════════════════════════════════════════ */}
        {/* TAB: HISTORIAL LABORAL                        */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === 'empresas' && (
          <>
            {h.experience?.length > 0
              ? (
                <div className={styles.expTimeline}>
                  {h.experience.map((ex, i) => (
                    <div key={i} className={styles.expCardFull}>
                      <div className={styles.expTimelineLeft}>
                        <div className={styles.expLogo}>{ex.companyLogo}</div>
                      </div>
                      <div className={styles.expBody}>
                        <ExperienceCard exp={ex} />
                      </div>
                    </div>
                  ))}
                </div>
              )
              : (
                <div className={styles.emptyTab}>
                  <Building2 size={32} color="var(--rule)" />
                  <p>Sin historial laboral todavía.</p>
                </div>
              )
            }

            {/* Company CTA */}
            <div className={styles.companyCta}>
              <Lock size={16} color="var(--soft)" />
              <div>
                <p className={styles.companyCtaTitle}>¿Has trabajado con {h.name.split(' ')[0]}?</p>
                <p className={styles.companyCtaDesc}>Las empresas pueden añadir experiencias verificadas al perfil. Disponible en Fase 3.</p>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* TAB: PUBLICACIONES                            */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === 'feed' && (
          <>
            {h.posts?.length > 0
              ? h.posts.map(post => <PostCard key={post.id} post={post} helper={h} />)
              : (
                <div className={styles.emptyTab}>
                  <MessageSquare size={32} color="var(--rule)" />
                  <p>{h.name.split(' ')[0]} aún no ha publicado nada.</p>
                </div>
              )
            }
          </>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* TAB: REPUTACIÓN                               */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === 'reputacion' && (
          <>
            {/* Score card */}
            {(() => {
              const score = Math.round(
                (h.rating / 5) * 40 +
                (Math.min(h.services, 100) / 100) * 30 +
                (h.completionRate / 100) * 20 +
                (h.dniVerified ? 10 : 0)
              )
              const level = score >= 90
                ? { label: 'Experto verificado', color: '#059669', bg: '#ECFDF5' }
                : score >= 75
                ? { label: 'Referente de confianza', color: '#1A56DB', bg: '#EFF6FF' }
                : { label: 'Con historial', color: '#D97706', bg: '#FFFBEB' }
              return (
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
                      Construida con {h.services} servicios reales, {h.reviews} valoraciones y comportamiento en plataforma.
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Personality */}
            {h.personality && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Brain size={13} /> Análisis de personalidad</h3>
                <p className={styles.sectionNote}>Derivado del comportamiento en {h.services} servicios — no de un test de personalidad</p>
                <div className={styles.personality}>
                  {[
                    ['Paciencia', h.personality.patience],
                    ['Empatía', h.personality.empathy],
                    ['Comunicación', h.personality.communication],
                    ['Puntualidad', h.personality.punctuality],
                    ['Autonomía', h.personality.autonomy],
                  ].map(([l, v]) => <PersonalityBar key={l} label={l} value={v} />)}
                </div>
              </section>
            )}

            {/* Evolution — redesigned as a clean line */}
            {h.evolution?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><TrendingUp size={13} /> Evolución del perfil</h3>
                <p className={styles.sectionNote}>La consistencia importa más que los picos aislados</p>
                <div className={styles.evoList}>
                  {h.evolution.map((pt, i) => (
                    <div key={i} className={styles.evoRow}>
                      <span className={styles.evoPeriod}>{pt.period}</span>
                      <div className={styles.evoBar}>
                        <div className={styles.evoFill}
                          style={{ width: `${((pt.rating - 4.0) / 1.0) * 100}%` }} />
                      </div>
                      <span className={styles.evoRating}>★ {pt.rating}</span>
                      <span className={styles.evoServices}>{pt.services} serv.</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Nüra seal */}
            <div className={styles.nuraSeal}>
              <Shield size={13} color="var(--purple)" />
              <span>Perfil verificado por Nüra · DNI confirmado · {h.services} servicios reales · Se actualiza automáticamente</span>
            </div>
          </>
        )}

      </div>

      {/* ── CTA FIXED ── */}
      <div className={styles.ctaBar}>
        <button className={styles.ctaBtn} onClick={() => navigate(`/chat/${h.id}`)}>
          <MessageCircle size={16} /> Contactar a {h.name.split(' ')[0]}
        </button>
      </div>

      {showRating && <RatingModal helper={h} onClose={() => setShowRating(false)} />}
    </div>
  )
}
