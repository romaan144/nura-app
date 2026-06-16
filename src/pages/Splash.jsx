import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Splash.module.css'

export default function Splash() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('logo') // logo → tagline → done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 600)
    const t2 = setTimeout(() => setPhase('done'), 1400)
    const t3 = setTimeout(() => navigate('/', { replace: true }), 1800)
    return () => [t1,t2,t3].forEach(clearTimeout)
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={`${styles.isoWrap} ${phase !== 'logo' ? styles.isoSmall : ''}`}>
          <img src="/logo-iso.png" alt="Nüra" className={styles.iso} />
        </div>
        <div className={`${styles.wordmarkWrap} ${phase === 'tagline' || phase === 'done' ? styles.show : ''}`}>
          <img src="/logo-text.png" alt="Nüra" className={styles.wordmark} />
        </div>
      </div>
      <div className={`${styles.footer} ${phase === 'tagline' || phase === 'done' ? styles.show : ''}`}>
        <div className={styles.loadBar}>
          <div className={styles.loadFill} />
        </div>
        <p className={styles.tagline}>La IA que conecta personas</p>
      </div>
    </div>
  )
}
