import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, CheckCircle, XCircle, ChevronRight, Star } from 'lucide-react'
import { useUser } from '../context/UserContext'
import PageHeader from '../components/PageHeader'
import styles from './MyServices.module.css'

const MOCK = [
  { id: 1, helperName: 'Carlos Martínez', specialty: 'Logopeda infantil', date: '18 Jun 2026', time: '17:00', status: 'confirmed', price: '50€', avatarUrl: 'https://api.dicebear.com/9.x/personas/svg?seed=carlos', helperId: 1 },
  { id: 2, helperName: 'Elena Fernández', specialty: 'Auxiliar de geriatría', date: '12 Jun 2026', time: '10:00', status: 'completed', price: '12€/h', avatarUrl: 'https://api.dicebear.com/9.x/personas/svg?seed=elena', helperId: 5 },
  { id: 3, helperName: 'Roberto Sánchez', specialty: 'Técnico de calderas', date: '5 Jun 2026', time: '09:30', status: 'completed', price: '60€', avatarUrl: 'https://api.dicebear.com/9.x/personas/svg?seed=roberto', helperId: 3 },
]

const STATUS = {
  confirmed: { label: 'Confirmado', color: '#059669', bg: '#ECFDF5' },
  pending:   { label: 'Pendiente',  color: '#D97706', bg: '#FFFBEB' },
  completed: { label: 'Completado', color: '#6B7280', bg: '#F9FAFB' },
  cancelled: { label: 'Cancelado',  color: '#EF4444', bg: '#FEF2F2' },
}

const TABS = ['Todos', 'Próximos', 'Completados']

export default function MyServices() {
  const navigate = useNavigate()
  const { ratings, addRating, hasRated } = useUser()
  const [activeTab, setActiveTab] = useState('Todos')
  const [ratingModal, setRatingModal] = useState(null)
  const [ratingVal, setRatingVal] = useState(5)
  const [ratingText, setRatingText] = useState('')
  const [done, setDone] = useState(false)

  const filtered = MOCK.filter(s => {
    if (activeTab === 'Próximos') return s.status === 'confirmed' || s.status === 'pending'
    if (activeTab === 'Completados') return s.status === 'completed'
    return true
  })

  function submitRating() {
    addRating(ratingModal.helperId, ratingVal, ratingText)
    setDone(true)
    setTimeout(() => { setRatingModal(null); setDone(false); setRatingText('') }, 1500)
  }

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <h2 className={styles.title}>Mis servicios</h2>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t} className={`${styles.tab} ${activeTab===t ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Calendar size={48} color="var(--rule)" />
            <h3>Sin servicios</h3>
            <p>Aquí aparecerán tus servicios contratados.</p>
            <button className={styles.emptyBtn} onClick={() => navigate('/')}>Buscar ayuda</button>
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map(s => {
              const st = STATUS[s.status]
              const rated = hasRated(s.helperId)
              return (
                <div key={s.id} className={styles.card} onClick={() => navigate(`/helper/${s.helperId}`)}>
                  <div className={styles.cardLeft}>
                    <img src={s.avatarUrl} alt="" className={styles.avatar} />
                    <div>
                      <div className={styles.helperName}>{s.helperName}</div>
                      <div className={styles.specialty}>{s.specialty}</div>
                      <div className={styles.when}><Calendar size={11} /> {s.date} · {s.time}</div>
                    </div>
                  </div>
                  <div className={styles.cardRight}>
                    <span className={styles.price}>{s.price}</span>
                    <span className={styles.status} style={{color: st.color, background: st.bg}}>{st.label}</span>
                    {s.status === 'completed' && !rated && (
                      <button className={styles.rateBtn}
                        onClick={e => { e.stopPropagation(); setRatingModal(s); setRatingVal(5) }}>
                        <Star size={11} /> Valorar
                      </button>
                    )}
                    {s.status === 'completed' && rated && (
                      <span className={styles.ratedBadge}>✓ Valorado</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Rating modal */}
      {ratingModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:'24px 24px 0 0',padding:'24px',width:'100%',maxWidth:'500px'}}>
            {done ? (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:'48px',marginBottom:'12px'}}>⭐</div>
                <h3 style={{fontSize:'18px',fontWeight:800,color:'var(--ink)'}}>¡Gracias por valorar!</h3>
                <p style={{color:'var(--soft)',fontSize:'13px'}}>Tu valoración ayuda a otros usuarios.</p>
              </div>
            ) : (
              <>
                <div style={{width:'36px',height:'4px',background:'var(--rule)',borderRadius:'2px',margin:'0 auto 20px'}} />
                <h3 style={{fontSize:'16px',fontWeight:800,marginBottom:'4px'}}>Valorar a {ratingModal.helperName.split(' ')[0]}</h3>
                <p style={{fontSize:'13px',color:'var(--soft)',marginBottom:'20px'}}>{ratingModal.specialty}</p>
                <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'16px'}}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRatingVal(n)}
                      style={{fontSize:'32px',background:'none',border:'none',cursor:'pointer',opacity:n<=ratingVal?1:0.3,transition:'opacity 0.15s'}}>⭐</button>
                  ))}
                </div>
                <textarea value={ratingText} onChange={e=>setRatingText(e.target.value)}
                  placeholder="¿Qué destacarías? (opcional)"
                  rows={3}
                  style={{width:'100%',padding:'12px',border:'1.5px solid var(--rule)',borderRadius:'14px',fontSize:'14px',outline:'none',resize:'none',fontFamily:'inherit',boxSizing:'border-box',marginBottom:'12px'}} />
                <div style={{display:'flex',gap:'10px'}}>
                  <button onClick={() => setRatingModal(null)}
                    style={{flex:1,padding:'13px',background:'var(--paper)',border:'none',borderRadius:'18px',fontSize:'14px',fontWeight:600,color:'var(--mid)'}}>Cancelar</button>
                  <button onClick={submitRating}
                    style={{flex:2,padding:'13px',background:'var(--grad-main)',border:'none',borderRadius:'18px',fontSize:'14px',fontWeight:700,color:'white',boxShadow:'0 4px 14px rgba(123,47,255,0.3)'}}>Enviar valoración</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
