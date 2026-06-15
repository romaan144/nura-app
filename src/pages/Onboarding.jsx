import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import styles from './Onboarding.module.css'

const STEPS = [
  {
    emoji: '✨',
    title: 'Bienvenido a Nüra',
    desc: 'La IA que conecta personas con necesidades reales a profesionales verificados cerca de ti.',
    cta: 'Continuar',
  },
  {
    emoji: '🔍',
    title: 'Habla con naturalidad',
    desc: 'Cuéntale a Nüra lo que necesitas con tus palabras. Ella entiende el contexto y encuentra a la persona adecuada.',
    cta: 'Continuar',
  },
  {
    emoji: '🛡️',
    title: 'Perfiles verificados',
    desc: 'Cada helper tiene su identidad verificada. El perfil lo construye Nüra sola — con valoraciones reales, historial laboral y habilidades detectadas.',
    cta: 'Continuar',
  },
  {
    emoji: '🚀',
    title: 'Listo para empezar',
    desc: '¿Eres alguien que busca ayuda o un profesional que quiere ofrecer sus servicios?',
    cta: null,
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const { login } = useUser()

  function finish(isHelper) {
    login({ name: 'Usuario', isHelper })
    navigate('/')
  }

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className={styles.page}>
      <div className={styles.dots}>
        {STEPS.map((_, i) => <div key={i} className={`${styles.dot} ${i === step ? styles.dotActive : ''}`} />)}
      </div>

      <div className={styles.content}>
        <div className={styles.emoji}>{s.emoji}</div>
        <h1 className={styles.title}>{s.title}</h1>
        <p className={styles.desc}>{s.desc}</p>
      </div>

      <div className={styles.actions}>
        {!isLast ? (
          <>
            <button className={styles.primary} onClick={() => setStep(i => i + 1)}>{s.cta}</button>
            <button className={styles.skip} onClick={() => finish(false)}>Saltar</button>
          </>
        ) : (
          <>
            <button className={styles.primary} onClick={() => finish(false)}>Busco ayuda</button>
            <button className={styles.secondary} onClick={() => navigate('/register-helper')}>Soy un profesional</button>
          </>
        )}
      </div>
    </div>
  )
}
