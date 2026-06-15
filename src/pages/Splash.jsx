import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Splash.module.css'

export default function Splash() {
  const navigate = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => navigate('/', { replace: true }), 2600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.isoWrap}>
          <img src="/logo-iso.png" alt="Nüra" className={styles.iso} />
        </div>
        <img src="/logo-text.png" alt="Nüra" className={styles.wordmark} />
        <p className={styles.tagline}>La IA que conecta personas</p>
      </div>
      <div className={styles.footer}>
        <div className={styles.loadBar}>
          <div className={styles.loadBarFill} />
        </div>
        <p className={styles.footerText}>Barcelona · 2026</p>
      </div>
    </div>
  )
}
