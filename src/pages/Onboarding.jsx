import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { ArrowRight, MessageCircle, Brain, Users, Sparkles, Shield, Zap } from 'lucide-react'
import styles from './Onboarding.module.css'

const STEPS = [
  {
    Visual: Sparkles,
    eyebrow: 'BIENVENIDO',
    title: 'La IA que conecta\npersonas reales',
    desc: 'Cuéntale a Nüra lo que necesitas con tus palabras. En segundos encuentra al profesional ideal cerca de ti.',
  },
  {
    Visual: Shield,
    eyebrow: 'PERFILES VERIFICADOS',
    title: 'Identidad real,\nresultados reales',
    desc: 'Cada profesional verifica su identidad con DNI. El perfil lo construye Nüra — no el propio profesional.',
  },
  {
    Visual: Zap,
    eyebrow: 'CERCANO A TI',
    title: 'Presencial o online,\ncomo tú necesites',
    desc: 'Desde cuidadoras de mayores a técnicos de calderas. En tu zona, cuando lo necesites.',
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [showName, setShowName] = useState(false)
  const navigate = useNavigate()
  const { login } = useUser()

  function finish(isHelper) {
    localStorage.setItem('nura_onboarded', '1')
    login({ name: name.trim() || 'Usuario', isHelper })
    navigate('/')
  }

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  if (showName) return (
    <div className={styles.page}>
      <div className={styles.namePage}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.nameIso} />
        <h1 className={styles.nameTitle}>¿Cómo te llamas?</h1>
        <p className={styles.nameDesc}>Para que Nüra pueda saludarte.</p>
        <input className={styles.nameInput} placeholder="Tu nombre"
          value={name} onChange={e => setName(e.target.value)} autoFocus
          onKeyDown={e => e.key === 'Enter' && finish(false)} />
        <button className={styles.primary} onClick={() => finish(false)}>
          Empezar <ArrowRight size={17} />
        </button>
        <button className={styles.helperCta} onClick={() => navigate('/register-helper')}>
          Soy profesional y quiero ofrecer mis servicios →
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.skip}>
        <button className={styles.skipBtn} onClick={() => setShowName(true)}>Saltar</button>
      </div>

      <div className={styles.content} key={step}>
        <div className={styles.visual}>{s.Visual && <s.Visual size={36} strokeWidth={1.4} color='var(--purple)' />}</div>
        <span className={styles.eyebrow}>{s.eyebrow}</span>
        <h1 className={styles.title}>{s.title}</h1>
        <p className={styles.desc}>{s.desc}</p>
      </div>

      <div className={styles.bottom}>
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i === step ? styles.dotActive : i < step ? styles.dotDone : ''}`} />
          ))}
        </div>
        <button className={styles.primary} onClick={() => isLast ? setShowName(true) : setStep(i => i + 1)}>
          {isLast ? 'Comenzar' : 'Continuar'} <ArrowRight size={17} />
        </button>
      </div>
    </div>
  )
}
