import { useNavigate } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.logo} />
        <h1 className={styles.title}>Página no encontrada</h1>
        <p className={styles.desc}>La página que buscas no existe o ha sido movida.</p>
        <button className={styles.btn} onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    </div>
  )
}
