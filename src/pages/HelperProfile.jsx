import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Shield, MapPin, MessageCircle, Zap } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import styles from './HelperProfile.module.css'

export default function HelperProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const helper = HELPERS.find(h => h.id === parseInt(id))

  if (!helper) return (
    <div className={styles.notFound}>
      <p>Perfil no encontrado.</p>
      <button onClick={() => navigate('/')}>Volver</button>
    </div>
  )

  const levelLabel = {
    student: 'Estudiante',
    experienced: 'Con experiencia',
    professional: 'Profesional titulado',
  }[helper.qualificationLevel]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <span className={styles.headerTitle}>Perfil</span>
        <div style={{width:36}} />
      </header>

      <div className={styles.content}>
        {/* Top section */}
        <div className={styles.profileTop}>
          <div className={styles.avatar} style={{ background: helper.avatarColor }}>
            {helper.avatar}
          </div>
          <h1 className={styles.name}>{helper.name}</h1>
          <div className={styles.meta}>
            <span className={styles.rating}>
              <Star size={14} fill="#F59E0B" color="#F59E0B" />
              {helper.rating} · {helper.reviews} valoraciones
            </span>
            <span className={styles.dot} />
            <span className={styles.location}>
              <MapPin size={13} /> {helper.zone}, {helper.city}
            </span>
          </div>
          <div className={styles.badges}>
            {helper.verified && (
              <span className={styles.badge} style={{color:'#059669',background:'#ECFDF5'}}>
                <Shield size={12} /> Verificado
              </span>
            )}
            {helper.urgent && (
              <span className={styles.badge} style={{color:'#92400E',background:'#FEF3C7'}}>
                <Zap size={12} /> Urgencias disponible
              </span>
            )}
            <span className={styles.badge} style={{color:'var(--blue)',background:'var(--paper2)'}}>
              {levelLabel}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{helper.services}</span>
            <span className={styles.statLbl}>Servicios</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{helper.rating}</span>
            <span className={styles.statLbl}>Valoración</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{helper.distance}km</span>
            <span className={styles.statLbl}>Distancia</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{helper.price}</span>
            <span className={styles.statLbl}>Precio</span>
          </div>
        </div>

        {/* Bio */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Sobre mí</h3>
          <p className={styles.bio}>{helper.bio}</p>
        </div>

        {/* Tags */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Especialidades</h3>
          <div className={styles.tags}>
            {helper.tags.map((t, i) => (
              <span key={i} className={styles.tag}>{t}</span>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Modalidad</h3>
          <div className={styles.modes}>
            {helper.presential && <span className={styles.mode}>📍 Presencial</span>}
            {helper.online && <span className={styles.mode}>💻 Online</span>}
          </div>
        </div>

        {/* Comments */}
        {helper.comments && helper.comments.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Lo que dicen de él/ella</h3>
            <div className={styles.comments}>
              {helper.comments.map((c, i) => (
                <div key={i} className={styles.comment}>
                  <Star size={11} fill="#F59E0B" color="#F59E0B" />
                  <span>"{c}"</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile badge */}
        <div className={styles.profileNote}>
          <Shield size={14} />
          <span>Perfil verificado por Nüra · Identidad confirmada · Historial real</span>
        </div>
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <button className={styles.ctaBtn} onClick={() => navigate(`/chat/${helper.id}`)}>
          <MessageCircle size={18} />
          Contactar a {helper.name.split(' ')[0]}
        </button>
      </div>
    </div>
  )
}
