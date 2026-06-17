import { useState } from 'react'
import { ArrowRight, X, MessageCircle, Shield, Users } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './OnboardingOverlay.module.css'

const STEPS = [
  {
    Icon: MessageCircle,
    eyebrow: 'NUEVA FORMA DE BUSCAR',
    title: 'Cuéntalo con\ntus palabras',
    desc: '"Necesito una cuidadora para mi madre los martes por la mañana en el Eixample." Así de fácil. Nüra entiende.',
  },
  {
    Icon: Shield,
    eyebrow: 'CONFIANZA TOTAL',
    title: 'Cada perfil,\nconstruido por IA',
    desc: 'DNI verificado, valoraciones reales, historial comprobado. Nüra construye el perfil del profesional — no él mismo.',
  },
  {
    Icon: Users,
    eyebrow: '1.200+ PROFESIONALES',
    title: 'La persona exacta,\nen minutos',
    desc: 'Logopedas, cuidadoras, técnicos, profesores, entrenadores, psicólogos. En Barcelona y expandiendo.',
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
      sessionStorage.setItem('nura_just_onboarded', name.trim())
    }
    onComplete()
  }

  function skip() {
    localStorage.setItem('nura_onboarded', '1')
    onComplete()
  }

  if (showName) return (
    <div className={styles.overlay}>
      <div className={styles.topRow}>
        <button className={styles.skip} onClick={skip}>Saltar</button>
        <button className={styles.loginLink} onClick={() => { skip(); window.location.href = '/login' }}>
          Ya tengo cuenta
        </button>
      </div>
      <div className={styles.namePage}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.nameIso} />
        <h2 className={styles.nameTitle}>¿Cómo te llamas?</h2>
        <p className={styles.nameDesc}>Para que Nüra pueda saludarte. Es opcional.</p>
        <input
          className={styles.nameInput}
          placeholder="Escribe tu nombre..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && finish()}
          autoFocus
          maxLength={40}
        />
        <button className={styles.primary} onClick={finish}>
          {name.trim() ? `¡Empezar, ${name.split(' ')[0]}!` : 'Empezar sin nombre'} <ArrowRight size={16} />
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
      <div className={styles.topRow}>
        <button className={styles.skip} onClick={skip}>Saltar</button>
        <button className={styles.loginLink} onClick={() => { skip(); window.location.href = '/login' }}>
          Ya tengo cuenta
        </button>
      </div>

      <div className={styles.content} key={step}>
        <div className={styles.emoji}>{s.Icon && <s.Icon size={40} strokeWidth={1.5} color='var(--purple)' />}</div>
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
          {isLast ? '¡Empezar con Nüra!' : 'Continuar'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
