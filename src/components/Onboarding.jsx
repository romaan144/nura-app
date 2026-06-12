import { useState, useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'
import styles from './Onboarding.module.css'

const STEPS = [
  {
    icon: '💬',
    title: 'Describe lo que necesitas',
    desc: 'Con tus propias palabras, sin categorías ni formularios. Igual que se lo contarías a un amigo.',
  },
  {
    icon: '🧠',
    title: 'Nüra lo entiende todo',
    desc: 'Detecta si es presencial, urgente, qué nivel de cualificación hace falta y quién está cerca.',
  },
  {
    icon: '🤝',
    title: 'Conectas con una persona real',
    desc: 'Perfiles verificados con historial real. No anuncios, no CVs inventados. Evidencia de verdad.',
  },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('nura_onboarding_seen')
    if (!seen) setVisible(true)
  }, [])

  function finish() {
    localStorage.setItem('nura_onboarding_seen', '1')
    setVisible(false)
    onDone?.()
  }

  if (!visible) return null

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button className={styles.skip} onClick={finish}><X size={16} /></button>

        <div className={styles.icon}>{s.icon}</div>
        <h2 className={styles.title}>{s.title}</h2>
        <p className={styles.desc}>{s.desc}</p>

        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i === step ? styles.dotActive : ''}`} />
          ))}
        </div>

        <button
          className={styles.btn}
          onClick={() => isLast ? finish() : setStep(s => s + 1)}
        >
          {isLast ? 'Empezar' : <><span>Siguiente</span> <ArrowRight size={15} /></>}
        </button>
      </div>
    </div>
  )
}
