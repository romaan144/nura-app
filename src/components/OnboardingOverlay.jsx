import { useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './OnboardingOverlay.module.css'

const STEPS = [
  {
    emoji: '✨',
    eyebrow: 'BIENVENIDO A NÜRA',
    title: 'La IA que conecta\npersonas reales',
    desc: 'Dile a Nüra lo que necesitas. En segundos te presenta al profesional ideal verificado cerca de ti.',
  },
  {
    emoji: '🛡️',
    eyebrow: 'CONFIANZA REAL',
    title: 'Cada perfil,\nverificado por Nüra',
    desc: 'DNI comprobado. Valoraciones auténticas. Experiencia real. Nüra construye el perfil — no el propio profesional.',
  },
  {
    emoji: '⚡',
    eyebrow: 'EN TU ZONA',
    title: 'Presencial o online,\ncuando lo necesites',
    desc: 'Cuidadoras, técnicos, logopedas, entrenadores, clases. Más de 1.200 profesionales en Barcelona.',
  },
]

export default function OnboardingOverlay({ onComplete }) {
  const [step, setStep] = useState(0)
  const [showName, setShowName] = useState(false)
  const [name, setName] = useState('')
  const { login } = useUser()

  const isLast = step === STEPS.length - 1

  function finish() {
    localStorage.setItem('nura_onboarded', '1')
    if (name.trim()) {
      login({ name: name.trim(), joined: new Date().toISOString() })
    }
    onComplete()
  }

  function skip() {
    localStorage.setItem('nura_onboarded', '1')
    onComplete()
  }

  if (showName) return (
    <div className={styles.overlay}>
      <button className={styles.skip} onClick={skip}>Saltar</button>
      <div className={styles.namePage}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.nameIso} />
        <h2 className={styles.nameTitle}>¿Cómo te llamas?</h2>
        <p className={styles.nameDesc}>Para que Nüra pueda saludarte. Es opcional.</p>
        <input
          className={styles.nameInput}
          placeholder="Tu nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && finish()}
          autoFocus
          maxLength={40}
        />
        <button className={styles.primary} onClick={finish}>
          {name.trim() ? 'Empezar' : 'Continuar sin nombre'} <ArrowRight size={16} />
        </button>
        <button className={styles.helperLink} onClick={() => { skip(); window.location.href = '/register-helper' }}>
          Soy profesional y quiero ofrecer servicios →
        </button>
      </div>
    </div>
  )

  const s = STEPS[step]

  return (
    <div className={styles.overlay}>
      <button className={styles.skip} onClick={skip}>Saltar</button>

      <div className={styles.content} key={step}>
        <div className={styles.emoji}>{s.emoji}</div>
        <p className={styles.eyebrow}>{s.eyebrow}</p>
        <h1 className={styles.title}>{s.title}</h1>
        <p className={styles.desc}>{s.desc}</p>
      </div>

      <div className={styles.bottom}>
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i === step ? styles.dotActive : i < step ? styles.dotDone : ''}`} />
          ))}
        </div>
        <button className={styles.primary}
          onClick={() => isLast ? setShowName(true) : setStep(i => i + 1)}>
          {isLast ? 'Comenzar' : 'Continuar'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
