import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Star, Shield, MapPin, MessageCircle, Zap,
  TrendingUp, Clock, CheckCircle, Award, Brain, Globe,
  Building2, BookOpen, Share2, Lock, ChevronRight,
  BarChart2, Heart, Sparkles, AlertCircle
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

function TimelineItem({ point, isLast }) {
  return (
    <div className={styles.timelineItem}>
      <div className={styles.timelineDot} />
      {!isLast && <div className={styles.timelineLine} />}
      <div className={styles.timelineContent}>
        <span className={styles.timelinePeriod}>{point.period}</span>
        <div className={styles.timelineStats}>
          <span className={styles.timelineRating}>★ {point.rating}</span>
          <span className={styles.timelineServices}>{point.services} servicios</span>
        </div>
      </div>
    </div>
  )
}

function ReputationScore({ helper }) {
  // Calculate a composite score
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
        <div className={styles.reputationScore} style={{ color: level.color }}>
          {score}
        </div>
        <div className={styles.reputationMax}>/100</div>
      </div>
      <div className={styles.reputationRight}>
        <span className={styles.reputationLevel} style={{ color: level.color, background: level.bg }}>
          <Sparkles size={11} /> {level.label}
        </span>
        <p className={styles.reputationDesc}>
          Puntuación construida automáticamente por Nüra basada en {helper.services} servicios reales,
          valoraciones verificadas y comportamiento en la plataforma.
        </p>
      </div>
    </div>
  )
}

export default function HelperProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRated, helpersCache } = useUser()
  const [showRating, setShowRating] = useState(false)
  const [shared, setShared] = useState(false)
  const [activeTab, setActiveTab] = useState('perfil') // perfil | reputacion | empresas

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
    if (navigator.share) {
      navigator.share({ title: h.name, text: `${h.specialty} verificado en Nüra`, url: window.location.href })
    } else {
      navigator.clipboard?.writeText(window.location.href)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <img src="/logo-text.png" alt="Nüra" className={styles.logoText} />
        <div className={styles.headerActions}>
          <button className={styles.shareBtn} onClick={handleShare}>
            {shared ? '✓' : <Share2 size={15} />}
          </button>
          {!hasRated(h.id) && (
            <button className={styles.rateHeaderBtn} onClick={() => setShowRating(true)}>
              <Star size={12} /> Valorar
            </button>
          )}
        </div>
      </header>

      <div className={styles.content}>

        {/* Hero Card */}
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
            {h.founder && <span className={styles.badge} style={{color:'#92400E',background:'#FEF3C7'}}><Award size={10} /> Helper Fundador</span>}
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

        {/* Price + modality */}
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
            { id: 'perfil', label: 'Perfil vivo', icon: <Brain size={13} /> },
            { id: 'reputacion', label: 'Reputación', icon: <BarChart2 size={13} /> },
            { id: 'empresas', label: 'Para empresas', icon: <Building2 size={13} /> },
          ].map(tab => (
            <button key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PERFIL VIVO ── */}
        {activeTab === 'perfil' && (
          <>
            {/* Bio */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><Brain size={13} /> Sobre {h.name.split(' ')[0]}</h3>
              <p className={styles.bio}>{h.bio}</p>
            </section>

            {/* Education */}
            {h.education?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><BookOpen size={13} /> Formación académica</h3>
                <p className={styles.sectionNote}>Plan de estudios buscado y verificado por Nüra en internet, asignatura por asignatura</p>
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

            {/* Experience */}
            {h.experience?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Building2 size={13} /> Experiencia laboral</h3>
                {h.experience.map((ex, i) => (
                  <div key={i} className={styles.expCard}>
                    <div className={styles.expHeader}>
                      <div>
                        <div className={styles.expRole}>{ex.role}</div>
                        <div className={styles.expCompany}>{ex.company} · {ex.period}</div>
                      </div>
                      {ex.verifiedByCompany && <span className={styles.verifiedTag} style={{background:'#EFF6FF',color:'#1E40AF'}}><Building2 size={9} /> Empresa</span>}
                    </div>
                    <div className={styles.competencies}>
                      {ex.competencies?.map((c, j) => <span key={j} className={styles.competency}>{c}</span>)}
                    </div>
                  </div>
                ))}
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

            {/* Skills */}
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

            {/* Comments */}
            {h.qualitativeComments?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Heart size={13} /> Lo que dicen de {h.name.split(' ')[0]}</h3>
                <p className={styles.sectionNote}>Analizadas semánticamente por Nüra — los adjetivos se convierten en atributos verificados del perfil</p>
                {h.qualitativeComments.map((c, i) => (
                  <div key={i} className={styles.comment}>
                    <Star size={10} fill="#F59E0B" color="#F59E0B" style={{flexShrink:0,marginTop:2}} />
                    <div>
                      <p className={styles.commentText}>"{c.text}"</p>
                      <span className={styles.commentMeta}>{c.user} · {c.date}</span>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        {/* ── TAB: REPUTACIÓN ── */}
        {activeTab === 'reputacion' && (
          <>
            {/* Reputation score */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><Sparkles size={13} /> Puntuación de reputación Nüra</h3>
              <p className={styles.sectionNote}>La reputación se construye sola. No la escribe el helper — la construyen sus acciones reales.</p>
              <ReputationScore helper={h} />
            </section>

            {/* Personality analysis */}
            {h.personality && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Brain size={13} /> Análisis de personalidad</h3>
                <p className={styles.sectionNote}>Derivado del comportamiento real en {h.services} servicios — no de un test</p>
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

            {/* Evolution timeline */}
            {h.evolution?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><TrendingUp size={13} /> Evolución del perfil</h3>
                <p className={styles.sectionNote}>La consistencia en el tiempo vale más que los picos aislados</p>
                <div className={styles.timeline}>
                  {h.evolution.map((pt, i) => (
                    <TimelineItem key={i} point={pt} isLast={i === h.evolution.length - 1} />
                  ))}
                </div>
              </section>
            )}

            {/* Nüra seal */}
            <div className={styles.nuraNote}>
              <Shield size={12} />
              <span>Perfil verificado · DNI confirmado · {h.services} servicios reales · Se actualiza automáticamente con cada interacción</span>
            </div>
          </>
        )}

        {/* ── TAB: PARA EMPRESAS ── */}
        {activeTab === 'empresas' && (
          <>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><Building2 size={13} /> Por qué contratar a través de Nüra</h3>
              <p className={styles.bio}>
                Este perfil no es un CV que {h.name.split(' ')[0]} ha escrito sobre sí mismo.
                Es evidencia real verificada por {h.reviews} personas reales a lo largo de {h.services} servicios completados.
              </p>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><CheckCircle size={13} /> Qué ha demostrado en la práctica</h3>
              <div className={styles.proofGrid}>
                <div className={styles.proofItem}>
                  <span className={styles.proofVal}>{h.rating}/5</span>
                  <span className={styles.proofLbl}>Valoración media verificada por {h.reviews} personas</span>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofVal}>{h.completionRate}%</span>
                  <span className={styles.proofLbl}>Servicios completados sin incidencias</span>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofVal}>{h.responseTime}</span>
                  <span className={styles.proofLbl}>Tiempo de respuesta promedio</span>
                </div>
                <div className={styles.proofItem}>
                  <span className={styles.proofVal}>{h.services}</span>
                  <span className={styles.proofLbl}>Servicios reales completados en Nüra</span>
                </div>
              </div>
            </section>

            {/* Company verification */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><Building2 size={13} /> ¿Has trabajado con {h.name.split(' ')[0]}?</h3>
              <p className={styles.sectionNote}>
                Las empresas pueden añadir verificaciones al perfil de los profesionales que han contratado.
                Esa información se integra automáticamente en su historial.
              </p>
              <div className={styles.companyVerifyBox}>
                <Lock size={20} color="var(--soft)" />
                <div>
                  <div className={styles.companyVerifyTitle}>Verificación empresarial</div>
                  <div className={styles.companyVerifyDesc}>
                    Funcionalidad disponible en Fase 3 de Nüra. Las empresas podrán añadir tiempo trabajado,
                    proyectos completados y competencias demostradas directamente al perfil del profesional.
                  </div>
                </div>
              </div>
            </section>


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
