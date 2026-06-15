import { useNavigate } from 'react-router-dom'
import { MessageCircle, Search, Shield, Star, Cpu, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import styles from './HowItWorks.module.css'

const STEPS = [
  {
    icon: <MessageCircle size={28} />,
    color: '#7B2FFF',
    bg: 'rgba(123,47,255,0.08)',
    title: 'Cuéntale a Nüra qué necesitas',
    desc: 'Escribe con tus palabras. No hay formularios ni categorías. Nüra entiende el contexto, la urgencia y el tipo de ayuda que necesitas.',
    example: '"Busco logopeda para mi hijo de 6 años, tiene problemas con la R"',
  },
  {
    icon: <Search size={28} />,
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    title: 'Nüra encuentra a la persona ideal',
    desc: 'En segundos analiza perfiles verificados, distancia, disponibilidad, especialización y reputación real para mostrarte las mejores opciones.',
    example: 'Resultados ordenados por compatibilidad, distancia y valoración',
  },
  {
    icon: <Shield size={28} />,
    color: '#1C1C1E',
    bg: 'rgba(28,28,30,0.06)',
    title: 'Perfiles verificados e imposibles de falsificar',
    desc: 'Nüra verifica la identidad con DNI, busca el historial académico en internet y obtiene opiniones directas de empresas y compañeros de trabajo.',
    example: 'Ningún helper escribe su propio perfil. Nüra lo construye.',
  },
  {
    icon: <Cpu size={28} />,
    color: '#7B2FFF',
    bg: 'rgba(123,47,255,0.08)',
    title: 'El perfil vive y crece solo',
    desc: 'Con cada servicio, valoración y conversación, Nüra actualiza el perfil automáticamente. Detecta habilidades que el helper ni sabe que tiene.',
    example: '"Detectado por Nüra: alta empatía en situaciones de crisis"',
  },
  {
    icon: <Star size={28} />,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    title: 'Valora después de cada servicio',
    desc: 'Cuando termina el servicio y pagas, puedes valorar. Esa valoración se convierte automáticamente en datos del perfil del helper.',
    example: 'Las valoraciones no son solo estrellas — son atributos verificados',
  },
  {
    icon: <TrendingUp size={28} />,
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    title: 'El futuro: currículum vivo universal',
    desc: 'Nüra construirá el currículum más fiable del mundo — no lo que la gente dice de sí misma, sino lo que realmente ha demostrado.',
    example: 'Fase 3: Las empresas podrán verificar retroactivamente',
  },
]

export default function HowItWorks() {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <div className={styles.hero}>
          <img src="/logo-iso.png" alt="Nüra" className={styles.heroIso} />
          <h1 className={styles.heroTitle}>¿Cómo funciona Nüra?</h1>
          <p className={styles.heroDesc}>La IA que conecta personas con necesidades reales a profesionales verificados cerca de ti.</p>
        </div>

        <div className={styles.steps}>
          {STEPS.map((step, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepLeft}>
                <div className={styles.stepIconWrap} style={{background: step.bg, color: step.color}}>
                  {step.icon}
                </div>
                {i < STEPS.length - 1 && <div className={styles.stepLine} />}
              </div>
              <div className={styles.stepBody}>
                <span className={styles.stepNum}>Paso {i + 1}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
                <div className={styles.stepExample} style={{borderColor: step.color + '33', color: step.color}}>
                  <span>💬</span> {step.example}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>¿Listo para probar?</h2>
          <p className={styles.ctaDesc}>Miles de helpers verificados en Barcelona esperan tu mensaje.</p>
          <button className={styles.ctaBtn} onClick={() => navigate('/')}>
            Hablar con Nüra →
          </button>
        </div>
      </div>
    </div>
  )
}
