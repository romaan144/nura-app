import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Shield, MapPin, MessageCircle, Zap, TrendingUp, Clock, CheckCircle, Award, Brain, Globe, Building2, BookOpen, ChevronRight } from 'lucide-react'
import { HELPERS } from '../data/helpers'
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

function EvolutionDot({ point, max }) {
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
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <span className={styles.headerTitle}>Perfil Nüra</span>
        <div style={{width:36}} />
      </header>

      <div className={styles.content}>

        {/* ── HERO DEL PERFIL ── */}
        <div className={styles.heroCard}>
          <div className={styles.avatar} style={{ background: h.avatarColor }}>{h.avatar}</div>
          <h1 className={styles.name}>{h.name}</h1>

          <div className={styles.metaRow}>
            <span className={styles.ratingBig}>
              <Star size={15} fill="#F59E0B" color="#F59E0B" /> {h.rating}
            </span>
            <span className={styles.metaDot} />
            <span className={styles.metaItem}><MapPin size={12} /> {h.zone}, {h.city}</span>
            <span className={styles.metaDot} />
            <span className={styles.metaItem}>{h.distance} km</span>
          </div>

          <div className={styles.badges}>
            {h.dniVerified && (
              <span className={styles.badge} style={{color:'#059669',background:'#ECFDF5'}}>
                <Shield size={11} /> DNI Verificado
              </span>
            )}
            {h.criminalRecordClear && (
              <span className={styles.badge} style={{color:'#1E40AF',background:'#EFF6FF'}}>
                <CheckCircle size={11} /> Antecedentes limpios
              </span>
            )}
            {h.founder && (
              <span className={styles.badge} style={{color:'#92400E',background:'#FEF3C7'}}>
                <Award size={11} /> Helper Fundador
              </span>
            )}
            {h.urgent && (
              <span className={styles.badge} style={{color:'#DC2626',background:'#FEF2F2'}}>
                <Zap size={11} /> Urgencias
              </span>
            )}
            <span className={styles.badge} style={{color:'var(--blue)',background:'var(--blue-soft)'}}>
              {levelLabel}
            </span>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className={styles.stats}>
          {[
            { icon: <Star size={14} />, val: h.rating, lbl: 'Valoración media', color: '#F59E0B' },
            { icon: <CheckCircle size={14} />, val: `${h.services}`, lbl: 'Servicios', color: '#059669' },
            { icon: <Clock size={14} />, val: h.responseTime, lbl: 'Respuesta', color: '#1A56DB' },
            { icon: <TrendingUp size={14} />, val: `${h.completionRate}%`, lbl: 'Completados', color: '#7C3AED' },
          ].map((s,i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statIcon} style={{color:s.color}}>{s.icon}</span>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLbl}>{s.lbl}</span>
            </div>
          ))}
        </div>

        {/* ── PRECIO Y MODALIDAD ── */}
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

        {/* ── BIO ── */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}><Brain size={14} /> Sobre {h.name.split(' ')[0]}</h3>
          <p className={styles.bio}>{h.bio}</p>
        </section>

        {/* ── FORMACIÓN ── */}
        {h.education && h.education.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><BookOpen size={14} /> Formación académica verificada</h3>
            <p className={styles.sectionNote}>Nüra ha buscado y verificado el plan de estudios específico de cada institución</p>
            {h.education.map((ed, i) => (
              <div key={i} className={styles.eduCard}>
                <div className={styles.eduHeader}>
                  <div>
                    <div className={styles.eduTitle}>{ed.title}</div>
                    <div className={styles.eduInstitution}>{ed.institution} · {ed.year}</div>
                  </div>
                  {ed.verified && <span className={styles.verifiedTag}><Shield size={10} /> Verificado</span>}
                </div>
                <p className={styles.eduDetails}>{ed.details}</p>
              </div>
            ))}
          </section>
        )}

        {/* ── EXPERIENCIA ── */}
        {h.experience && h.experience.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><Building2 size={14} /> Experiencia laboral</h3>
            {h.experience.map((ex, i) => (
              <div key={i} className={styles.expCard}>
                <div className={styles.expHeader}>
                  <div>
                    <div className={styles.expRole}>{ex.role}</div>
                    <div className={styles.expCompany}>{ex.company} · {ex.period}</div>
                  </div>
                  {ex.verifiedByCompany && (
                    <span className={styles.verifiedTag} style={{background:'#EFF6FF',color:'#1E40AF'}}>
                      <Building2 size={10} /> Verificado por empresa
                    </span>
                  )}
                </div>
                <div className={styles.competencies}>
                  {ex.competencies.map((c, j) => (
                    <span key={j} className={styles.competency}>{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── IDIOMAS ── */}
        {h.languages && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><Globe size={14} /> Idiomas</h3>
            <div className={styles.langRow}>
              {h.languages.map((l, i) => (
                <span key={i} className={styles.langTag}>{l}</span>
              ))}
            </div>
          </section>
        )}

        {/* ── HABILIDADES ── */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}><CheckCircle size={14} /> Habilidades verificadas</h3>
          <div className={styles.skillsGrid}>
            {h.skills.map((s, i) => (
              <span key={i} className={styles.skill}>{s}</span>
            ))}
          </div>
          {h.hiddenSkills && h.hiddenSkills.length > 0 && (
            <div className={styles.hiddenSkills}>
              <span className={styles.hiddenLabel}><Brain size={11} /> Detectadas por Nüra</span>
              {h.hiddenSkills.map((s, i) => (
                <span key={i} className={styles.hiddenSkill}>{s}</span>
              ))}
            </div>
          )}
        </section>

        {/* ── PERSONALIDAD ── */}
        {h.personality && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><Brain size={14} /> Análisis de personalidad</h3>
            <p className={styles.sectionNote}>Basado en comportamiento real en conversaciones y servicios completados</p>
            <div className={styles.personality}>
              {[
                ['Paciencia', h.personality.patience],
                ['Empatía', h.personality.empathy],
                ['Comunicación', h.personality.communication],
                ['Puntualidad', h.personality.punctuality],
                ['Autonomía', h.personality.autonomy],
              ].map(([label, val]) => (
                <PersonalityBar key={label} label={label} value={val} />
              ))}
            </div>
          </section>
        )}

        {/* ── LO QUE DICEN ── */}
        {h.qualitativeComments && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><Star size={14} /> Lo que dicen de {h.name.split(' ')[0]}</h3>
            <p className={styles.sectionNote}>Nüra analiza semánticamente cada valoración para construir el perfil</p>
            {h.qualitativeComments.map((c, i) => (
              <div key={i} className={styles.comment}>
                <Star size={11} fill="#F59E0B" color="#F59E0B" style={{flexShrink:0, marginTop:2}} />
                <div>
                  <p className={styles.commentText}>"{c.text}"</p>
                  <span className={styles.commentMeta}>{c.user} · {c.date}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── EVOLUCIÓN ── */}
        {h.evolution && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><TrendingUp size={14} /> Evolución del perfil</h3>
            <p className={styles.sectionNote}>La consistencia vale más que los picos aislados</p>
            <div className={styles.evolution}>
              {h.evolution.map((pt, i) => <EvolutionDot key={i} point={pt} />)}
            </div>
          </section>
        )}

        {/* ── SELLO NÜRA ── */}
        <div className={styles.nuraNote}>
          <Shield size={13} />
          <span>Perfil construido y verificado por Nüra · DNI confirmado · Historial de {h.services} servicios reales</span>
        </div>
      </div>

      {/* CTA fijo */}
      <div className={styles.cta}>
        <button className={styles.ctaBtn} onClick={() => navigate(`/chat/${h.id}`)}>
          <MessageCircle size={18} />
          Contactar a {h.name.split(' ')[0]}
        </button>
      </div>
    </div>
  )
}
