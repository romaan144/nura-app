import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Phone } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './Login.module.css'

export default function Login() {
  const [step, setStep] = useState('phone') // phone | code | name
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useUser()
  const navigate = useNavigate()

  function handlePhone() {
    if (phone.length < 9) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep('code') }, 800)
  }

  function handleCode() {
    if (code.length < 4) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep('name') }, 600)
  }

  function handleName() {
    if (!name.trim()) return
    login({ name: name.trim(), phone, avatar: name[0].toUpperCase(), joined: new Date().toISOString() })
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.logo} />
        <h1 className={styles.title}>Nüra</h1>
        <p className={styles.subtitle}>La IA que conecta personas</p>
      </div>

      <div className={styles.card}>
        {step === 'phone' && (
          <>
            <h2 className={styles.cardTitle}>¿Cuál es tu número?</h2>
            <p className={styles.cardDesc}>Te enviamos un código de verificación.</p>
            <div className={styles.phoneWrap}>
              <span className={styles.flag}>🇪🇸 +34</span>
              <input className={styles.input} type="tel" placeholder="612 345 678"
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                maxLength={9} autoFocus />
            </div>
            <button className={styles.btn} onClick={handlePhone} disabled={phone.length < 9 || loading}>
              {loading ? <div className={styles.spinner} /> : <><ArrowRight size={17} /> Continuar</>}
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <h2 className={styles.cardTitle}>Código de verificación</h2>
            <p className={styles.cardDesc}>Hemos enviado un SMS al +34 {phone}<br/><span className={styles.demoHint}>Demo: usa cualquier 4 dígitos</span></p>
            <input className={`${styles.input} ${styles.codeInput}`} type="tel"
              placeholder="1234" value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g,''))}
              maxLength={4} autoFocus />
            <button className={styles.btn} onClick={handleCode} disabled={code.length < 4 || loading}>
              {loading ? <div className={styles.spinner} /> : <><ArrowRight size={17} /> Verificar</>}
            </button>
            <button className={styles.link} onClick={() => setStep('phone')}>Cambiar número</button>
          </>
        )}

        {step === 'name' && (
          <>
            <h2 className={styles.cardTitle}>¿Cómo te llamas?</h2>
            <p className={styles.cardDesc}>Para que los helpers sepan quién les contacta.</p>
            <input className={styles.input} placeholder="Tu nombre"
              value={name} onChange={e => setName(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleName()} />
            <button className={styles.btn} onClick={handleName} disabled={!name.trim()}>
              <ArrowRight size={17} /> Empezar
            </button>
          </>
        )}
      </div>

      <p className={styles.terms}>Al continuar aceptas los <span>Términos de uso</span> y la <span>Política de privacidad</span> de Nüra</p>
    </div>
  )
}
