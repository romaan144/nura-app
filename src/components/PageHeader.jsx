import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import styles from './PageHeader.module.css'

export default function PageHeader({ showBack, onBack, title, rightEl }) {
  const navigate = useNavigate()
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        {showBack
          ? <button className={styles.circleBtn} onClick={() => onBack ? onBack() : navigate(-1)}><ArrowLeft size={18} /></button>
          : <button className={styles.circleBtn} onClick={() => window.__openDrawer?.()}>
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                <rect width="18" height="2" rx="1" fill="rgba(0,0,0,0.65)"/>
                <rect y="5" width="14" height="2" rx="1" fill="rgba(0,0,0,0.65)"/>
                <rect y="10" width="18" height="2" rx="1" fill="rgba(0,0,0,0.65)"/>
              </svg>
            </button>
        }
      </div>
      <div className={styles.center}>
        <div className={styles.logoPill}><img src="/logo-text.png" alt="Nüra" className={styles.logo} /></div>
      </div>
      <div className={styles.right}>
        {rightEl || <div className={styles.placeholder} />}
      </div>
    </div>
  )
}
