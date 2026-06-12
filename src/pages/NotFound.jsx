import { useNavigate } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <div className={styles.icon}>🔍</div>
      <h1 className={styles.code}>404</h1>
      <h2 className={styles.title}>Página no encontrada</h2>
      <p className={styles.desc}>La página que buscas no existe. Pero Nüra sí puede encontrar lo que necesitas.</p>
      <button className={styles.btn} onClick={() => navigate('/')}>Volver al inicio</button>
    </div>
  )
}
