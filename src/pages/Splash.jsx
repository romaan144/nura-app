import { useEffect, useState } from 'react'
import styles from './Splash.module.css'

export default function Splash({ onFinish }) {
  const [phase, setPhase] = useState('enter') // enter → arc → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('arc'),  500)
    const t2 = setTimeout(() => setPhase('exit'), 1400)
    const t3 = setTimeout(() => onFinish?.(),     1800)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])

  return (
    <div className={`${styles.page} ${phase === 'exit' ? styles.exit : ''}`}>
      <div className={styles.center}>

        {/* Arc spinner */}
        <div className={`${styles.arcWrap} ${phase === 'arc' || phase === 'exit' ? styles.arcVisible : ''}`}>
          <svg className={styles.arc} viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
            <circle cx="40" cy="40" r="36"
              stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="56 170"
              className={styles.arcSpin}
            />
          </svg>
        </div>

        {/* Logo */}
        <div className={`${styles.isoWrap} ${phase !== 'enter' ? styles.isoIn : ''}`}>
          <img src="/logo-iso.png" alt="Nüra" className={styles.iso} />
        </div>

        {/* Wordmark */}
        <div className={`${styles.wordmarkWrap} ${phase === 'arc' || phase === 'exit' ? styles.wordmarkIn : ''}`}>
          <img src="/logo-text-white.png" alt="Nüra" className={styles.wordmark}
            onError={e => { e.target.style.filter = 'brightness(0) invert(1)' }} />
        </div>

      </div>
    </div>
  )
}
