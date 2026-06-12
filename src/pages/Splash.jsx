import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Splash.module.css'

export default function Splash() {
  const navigate = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => navigate('/', { replace: true }), 2200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.iso} />
        <img src="/logo-text.png" alt="Nüra" className={styles.wordmark} />
        <p className={styles.tagline}>La IA que conecta personas</p>
      </div>
      <div className={styles.bar} />
    </div>
  )
}
