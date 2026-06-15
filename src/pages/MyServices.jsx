import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import styles from './MyServices.module.css'

const MOCK_SERVICES = [
  { id: 1, helperName: 'Carlos Martínez', specialty: 'Logopedia', date: '18 Jun 2026', time: '17:00', status: 'confirmed', price: '50€', avatar: '👨‍⚕️' },
  { id: 2, helperName: 'Elena Fernández', specialty: 'Geriatría', date: '12 Jun 2026', time: '10:00', status: 'completed', price: '12€/h', avatar: '👩‍⚕️' },
  { id: 3, helperName: 'Roberto Sánchez', specialty: 'Técnico calderas', date: '5 Jun 2026', time: '09:30', status: 'completed', price: '60€', avatar: '🔧' },
]

const STATUS = {
  confirmed: { label: 'Confirmado', color: '#059669', bg: '#ECFDF5', icon: <CheckCircle size={12} /> },
  pending: { label: 'Pendiente', color: '#D97706', bg: '#FFFBEB', icon: <Clock size={12} /> },
  completed: { label: 'Completado', color: '#6B7280', bg: '#F9FAFB', icon: <CheckCircle size={12} /> },
  cancelled: { label: 'Cancelado', color: '#EF4444', bg: '#FEF2F2', icon: <XCircle size={12} /> },
}

export default function MyServices() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <h2 className={styles.title}>Mis servicios</h2>
        <p className={styles.sub}>Servicios contratados y completados</p>

        {MOCK_SERVICES.length === 0 ? (
          <div className={styles.empty}>
            <Calendar size={48} color="var(--rule)" />
            <h3>Sin servicios todavía</h3>
            <p>Cuando contrates a alguien aparecerá aquí.</p>
            <button className={styles.emptyBtn} onClick={() => navigate('/')}>Buscar ayuda</button>
          </div>
        ) : (
          <div className={styles.list}>
            {MOCK_SERVICES.map(s => {
              const st = STATUS[s.status]
              return (
                <div key={s.id} className={styles.card}>
                  <div className={styles.cardLeft}>
                    <div className={styles.avatar}>{s.avatar}</div>
                    <div>
                      <div className={styles.helperName}>{s.helperName}</div>
                      <div className={styles.specialty}>{s.specialty}</div>
                      <div className={styles.when}><Calendar size={11} /> {s.date} · {s.time}</div>
                    </div>
                  </div>
                  <div className={styles.cardRight}>
                    <span className={styles.price}>{s.price}</span>
                    <span className={styles.status} style={{color: st.color, background: st.bg}}>
                      {st.icon} {st.label}
                    </span>
                    {s.status === 'completed' && (
                      <button className={styles.rateBtn}>Valorar</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
