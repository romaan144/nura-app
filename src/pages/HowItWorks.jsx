import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Star, Zap, Heart, MapPin, MessageCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import styles from './HowItWorks.module.css'

const STEPS = [
  {
    n: '01',
    title: 'Cuéntale qué necesitas',
    desc: 'Escribe en lenguaje natural. "Necesito una cuidadora para mi madre con Alzheimer en el Eixample" — Nüra entiende el contexto completo.',
    example: '"Mi hijo de 5 años tiene problemas con la pronunciación, busco logopeda esta semana"',
    color: '#7B2FFF',
  },
  {
    n: '02',
    title: 'Nüra analiza y selecciona',
    desc: 'La IA evalúa más de 1.200 perfiles verificados. Filtra por especialidad, zona, disponibilidad, valoraciones y compatibilidad con tu caso.',
    example: 'En segundos te presenta las personas más adecuadas — no una lista genérica.',
    color: '#059669',
  },
  {
    n: '03',
    title: 'Contacta directamente',
    desc: 'Escribe al profesional, pregunta lo que necesites y solicita el servicio. Nüra te ayuda a cerrar el acuerdo en el chat.',
    example: 'Sin intermediarios. Sin comisiones ocultas. Tú y el profesional.',
    color: '#1A56DB',
  },
]

const TRUST = [
  { icon: <Shield size={20} />, title: 'Identidad verificada', desc: 'Cada helper verifica su DNI. Una persona, un perfil. Sin duplicados.' },
  { icon: <Star size={20} />, title: 'Valoraciones auténticas', desc: 'Solo pueden valorar quienes han contratado. Sin reseñas falsas.' },
  { icon: <MapPin size={20} />, title: 'Cerca de ti', desc: 'Profesionales en tu zona. Presencial cuando lo necesites.' },
  { icon: <Zap size={20} />, title: 'Respuesta rápida', desc: 'La mayoría responde en menos de 1 hora. Urgencias disponibles.' },
]

const DIFFERENCE = [
  { label: 'Buscadores', pro: false, desc: 'Te dan una lista de páginas' },
  { label: 'Directorios', pro: false, desc: 'Te dan una lista de profesionales' },
  { label: 'Nüra', pro: true, desc: 'Entiende lo que necesitas y selecciona quién puede ayudarte' },
]

export default function HowItWorks() {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>

        {/* Header */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>CÓMO FUNCIONA</p>
          <h1 className={styles.heroTitle}>La IA que conecta<br/>personas reales</h1>
          <p className={styles.heroDesc}>No es un buscador. No es un directorio. Es una inteligencia artificial que entiende lo que necesitas y encuentra a la persona exacta que puede ayudarte.</p>
        </div>

        {/* Steps */}
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepNum} style={{color: s.color}}>{s.n}</div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
                <div className={styles.stepExample}>{s.example}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Diferenciador */}
        <div className={styles.diffCard}>
          <h3 className={styles.sectionTitle}>¿En qué se diferencia Nüra?</h3>
          {DIFFERENCE.map((d, i) => (
            <div key={i} className={styles.diffRow}>
              <span className={d.pro ? styles.diffPro : styles.diffCon}>{d.pro ? '✓' : '×'}</span>
              <div>
                <span className={styles.diffLabel}>{d.label}</span>
                <span className={styles.diffDesc}> — {d.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div className={styles.trustGrid}>
          {TRUST.map((t, i) => (
            <div key={i} className={styles.trustCard}>
              <div className={styles.trustIcon}>{t.icon}</div>
              <div className={styles.trustTitle}>{t.title}</div>
              <div className={styles.trustDesc}>{t.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={styles.ctaCard}>
          <img src="/logo-iso.png" alt="Nüra" className={styles.ctaIso} />
          <h3 className={styles.ctaTitle}>¿Qué necesitas hoy?</h3>
          <p className={styles.ctaDesc}>Cuéntaselo a Nüra. En menos de un minuto tienes candidatos.</p>
          <button className={styles.ctaBtn} onClick={() => navigate('/')}>
            Hablar con Nüra <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  )
}
