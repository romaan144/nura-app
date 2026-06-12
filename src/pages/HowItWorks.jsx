import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import styles from './HowItWorks.module.css'

const STEPS = [
  { icon: '💬', title: 'Describes lo que necesitas', desc: 'Con tus propias palabras, sin categorías ni formularios. Igual que se lo contarías a un amigo de confianza.' },
  { icon: '🧠', title: 'Nüra lo entiende todo', desc: 'La IA detecta automáticamente si es presencial, si es urgente, qué nivel de cualificación hace falta y calcula la distancia en tiempo real.' },
  { icon: '🔍', title: 'Busca entre personas reales', desc: 'Filtra la red de helpers verificados y encuentra los perfiles más compatibles con tu situación concreta.' },
  { icon: '👤', title: 'Ves perfiles con evidencia real', desc: 'No anuncios. No CVs inventados. Historial real de servicios, valoraciones de personas reales y verificación de identidad por DNI.' },
  { icon: '💬', title: 'Contactas de forma segura', desc: 'El primer mensaje lo sugiere Nüra. Tu información personal solo se comparte cuando tú decides.' },
  { icon: '⭐', title: 'Valoras la experiencia', desc: 'Tu valoración entrena a la IA y mejora el perfil del helper automáticamente. Cada interacción hace a Nüra más inteligente para todos.' },
]

const FAQS = [
  { q: '¿Es gratis para quien busca ayuda?', a: 'Sí. La persona que busca ayuda nunca paga nada. Es completamente gratuito, siempre.' },
  { q: '¿Cómo se verifican los helpers?', a: 'Verificamos su identidad con el DNI, comprobamos referencias y, en servicios con menores o mayores, pedimos certificado de antecedentes.' },
  { q: '¿Qué es el perfil vivo?', a: 'Es el currículum más honesto que existe. Se construye solo con cada servicio completado, cada valoración recibida y el análisis de comportamiento real. No lo escribe el helper — lo escriben los demás.' },
  { q: '¿Por qué confiar más que en Milanuncios?', a: 'Milanuncios son anuncios que alguien escribe sobre sí mismo. Nüra muestra historial real verificado por personas reales.' },
]

export default function HowItWorks() {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <span className={styles.title}>Cómo funciona</span>
        <div style={{width:36}} />
      </header>

      <div className={styles.content}>
        <div className={styles.hero}>
          <img src="/logo-iso.png" alt="Nüra" className={styles.heroLogo} />
          <h1 className={styles.heroTitle}>Tan simple como<br/>enviar un mensaje.</h1>
          <p className={styles.heroDesc}>Nüra entiende lo que necesitas y encuentra a la persona adecuada en segundos.</p>
        </div>

        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepLeft}>
                <div className={styles.stepIcon}>{s.icon}</div>
                {i < STEPS.length - 1 && <div className={styles.stepLine} />}
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.faqSection}>
          <h2 className={styles.faqTitle}>Preguntas frecuentes</h2>
          {FAQS.map((f, i) => (
            <div key={i} className={styles.faq}>
              <h4 className={styles.faqQ}>{f.q}</h4>
              <p className={styles.faqA}>{f.a}</p>
            </div>
          ))}
        </div>

        <button className={styles.ctaBtn} onClick={() => navigate('/')}>
          Probar Nüra <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
