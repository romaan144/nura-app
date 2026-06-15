import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { MenuButton } from './NavBar'
import styles from './PageHeader.module.css'

export default function PageHeader({ showBack, rightEl }) {
  const navigate = useNavigate()
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        {showBack
          ? <button className={styles.circleBtn} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          : <MenuButton />
        }
      </div>
      <div className={styles.center}>
        <img src="/nura-wordmark.png" alt="Nüra" className={styles.logo} />
      </div>
      <div className={styles.right}>
        {rightEl || <div className={styles.placeholder} />}
      </div>
    </div>
  )
}
