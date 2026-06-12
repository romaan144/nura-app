import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Shield, MapPin, MessageCircle, Zap, TrendingUp, Clock, CheckCircle, Award, Brain, Globe, Building2, BookOpen, Share2 } from 'lucide-react'
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

function EvoDot({ point }) {
  const h = (point.rating - 4.0) / 1.0 * 100
  return (
    <div className={styles.evoItem}>
      <div className={styles.evoBarWrap}>
        <div className={styles.evoBar} style={{ height: `${Math.max(h, 8)}%` }} />
      </div>
      <span className={styles.evoPeriod}>{point.period}</span>
      <span className={styles.evoRating}>{point.rating}</span>
    </div>
  )
}

export default function HelperProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRated } = useUser()
  const [showRating, setShowRating] = useState(false)
  const [shared, setShared] = useState(false)
  const h = HELPERS.find(x => x.id === parseInt(id))

  if (!h) return (
    <div className={styles.notFound}>
      <p>Perfil no encontrado.</p>
      <button onClick={() => navigate('/')}>Volver al inicio</button>
    </div>
  )

  const levelLabel = { student: 'Estudiante', experienced: 'Con experiencia', professional: 'Profesional titulado' }[h.qualificationLevel]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <img src="/logo-text.png" alt="Nüra" className={styles.logoText} />
        <button className={styles.shareBtn} onClick={() => {
          if (navigator.share) {
            navigator.share({ title: h.name, text: h.bio, url: window.location.href })
          } else {
            navigator.clipboard?.writeText(window.location.href)
            setShared(true)
            setTimeout(() => setShared(false), 2000)
          }
        }}>
          {shared ? '✓ Copiado' : <Share2 size={14} />}
        </button>
        {!hasRated(h.id) && (
          <button className={styles.rateHeaderBtn} onClick={() => setShowRating(true)}>
            <Star size={13} /> Valorar
          </button>
        )}
      </header>

      <div className={styles.content}>

        {/* Hero */}
        <div className={styles.heroCard}>
          {h.avatarUrl
            ? <img src={h.avatarUrl} alt={h.name} className={styles.avatarImg} />
            : <div className={styles.avatar} style={{ background: h.avatarColor }}>{h.avatar}</div>
          }
          <h1 className={styles.name}>{h.name}</h1>
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

        {/* Bio */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}><Brain size={13} /> Sobre {h.name.split(' ')[0]}</h3>
          <p className={styles.bio}>{h.bio}</p>
        </section>

        {/* Education */}
        {h.education?.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><BookOpen size={13} /> Formación verificada por Nüra</h3>
            <p className={styles.sectionNote}>Plan de estudios buscado y verificado en internet, asignatura por asignatura</p>
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
                  {ex.verifiedByCompany && <span className={styles.verifiedTag} style={{background:'#EFF6FF',color:'#1E40AF'}}><Building2 size={9} /> Empresa verificada</span>}
                </div>
                <div className={styles.competencies}>
                  {ex.competencies.map((c, j) => <span key={j} className={styles.competency}>{c}</span>)}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Languages */}
        {h.languages && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><Globe size={13} /> Idiomas</h3>
            <div className={styles.langRow}>
              {h.languages.map((l, i) => <span key={i} className={styles.langTag}>{l}</span>)}
            </div>
          </section>
        )}

        {/* Skills */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}><CheckCircle size={13} /> Habilidades verificadas</h3>
          <div className={styles.skillsGrid}>
            {h.skills.map((s, i) => <span key={i} className={styles.skill}>{s}</span>)}
          </div>
          {h.hiddenSkills?.length > 0 && (
            <div className={styles.hiddenSkills}>
              <span className={styles.hiddenLabel}><Brain size={10} /> Detectadas por Nüra sin que el helper las declarara</span>
              {h.hiddenSkills.map((s, i) => <span key={i} className={styles.hiddenSkill}>{s}</span>)}
            </div>
          )}
        </section>

        {/* Personality */}
        {h.personality && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><Brain size={13} /> Análisis de personalidad</h3>
            <p className={styles.sectionNote}>Construido a partir de comportamiento real en {h.services} servicios — no de un test</p>
            <div className={styles.personality}>
              {[['Paciencia', h.personality.patience], ['Empatía', h.personality.empathy], ['Comunicación', h.personality.communication], ['Puntualidad', h.personality.punctuality], ['Autonomía', h.personality.autonomy]].map(([l, v]) => (
                <PersonalityBar key={l} label={l} value={v} />
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        {h.qualitativeComments && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><Star size={13} /> Lo que dicen de {h.name.split(' ')[0]}</h3>
            <p className={styles.sectionNote}>Analizadas semánticamente por Nüra para construir el perfil</p>
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

        {/* Evolution */}
        {h.evolution && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><TrendingUp size={13} /> Evolución del perfil</h3>
            <p className={styles.sectionNote}>La consistencia vale más que los picos aislados</p>
            <div className={styles.evolution}>
              {h.evolution.map((pt, i) => <EvoDot key={i} point={pt} />)}
            </div>
          </section>
        )}

        {/* Nüra seal */}
        <div className={styles.nuraNote}>
          <Shield size={12} />
          <span>Perfil verificado por Nüra · DNI confirmado · {h.services} servicios reales · Perfil vivo actualizado automáticamente</span>
        </div>
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
