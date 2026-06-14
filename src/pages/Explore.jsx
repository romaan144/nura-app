import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Shield, Zap, TrendingUp, Search, Filter } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { MenuButton } from '../components/NavBar'
import styles from './Explore.module.css'

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '✨' },
  { id: 'tecnico', label: 'Técnicos', icon: '🔧' },
  { id: 'logopedia', label: 'Logopedia', icon: '🗣️' },
  { id: 'cuidado', label: 'Cuidados', icon: '❤️' },
  { id: 'limpieza', label: 'Limpieza', icon: '🧹' },
  { id: 'matematicas', label: 'Clases', icon: '📚' },
  { id: 'entrenador', label: 'Deporte', icon: '💪' },
  { id: 'mascotas', label: 'Mascotas', icon: '🐾' },
]

const RECENT_ACTIVITY = [
  { helper: 'Carlos M.', action: 'completó una sesión de logopedia', time: 'Hace 12 min', avatar: 'CM', color: '#1A56DB' },
  { helper: 'Roberto S.', action: 'resolvió una urgencia de caldera', time: 'Hace 28 min', avatar: 'RS', color: '#1E40AF' },
  { helper: 'Elena F.', action: 'recibió una valoración de 5⭐', time: 'Hace 45 min', avatar: 'EF', color: '#059669' },
  { helper: 'Lucía V.', action: 'completó clases de matemáticas', time: 'Hace 1h', avatar: 'LV', color: '#DB2777' },
  { helper: 'David M.', action: 'publicó un nuevo trabajo verificado', time: 'Hace 2h', avatar: 'DM', color: '#EA580C' },
  { helper: 'Marta P.', action: 'acogió 2 mascotas este fin de semana', time: 'Hace 3h', avatar: 'MP', color: '#D97706' },
]

function HelperCard({ helper, onNavigate }) {
  const [saved, setSaved] = useState(false)

  return (
    <div className={styles.card} onClick={() => onNavigate(`/helper/${helper.id}`)}>
      <div className={styles.cardTop}>
        {helper.avatarUrl
          ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatarImg} />
          : <div className={styles.avatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
        }
        <button className={`${styles.saveBtn} ${saved ? styles.saveBtnActive : ''}`}
          onClick={e => { e.stopPropagation(); setSaved(s => !s) }}>
          {saved ? '❤️' : '🤍'}
        </button>
        {helper.urgent && <div className={styles.urgentPill}><Zap size={9} /> Urgencias</div>}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{helper.name.split(' ')[0]} {helper.name.split(' ')[1]}</h3>
        <p className={styles.cardSpecialty}>{helper.specialty}</p>
        <div className={styles.cardMeta}>
          <span className={styles.rating}><Star size={11} fill="#F59E0B" color="#F59E0B" /> {helper.rating}</span>
          <span className={styles.dot} />
          <span className={styles.dist}><MapPin size={10} /> {helper.distance}km</span>
          {helper.dniVerified && <><span className={styles.dot} /><Shield size={10} color="#059669" /></>}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.price}>{helper.price}</span>
        <button className={styles.contactBtn} onClick={e => { e.stopPropagation(); onNavigate(`/chat/${helper.id}`) }}>
          Contactar
        </button>
      </div>
    </div>
  )
}

export default function Explore() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchText, setSearchText] = useState('')

  const filtered = HELPERS.filter(h => {
    const catMatch = activeCategory === 'all' || h.category === activeCategory
    const textMatch = !searchText || h.name.toLowerCase().includes(searchText.toLowerCase()) ||
      h.specialty.toLowerCase().includes(searchText.toLowerCase()) ||
      h.zone.toLowerCase().includes(searchText.toLowerCase())
    return catMatch && textMatch
  })

  const topRated = [...HELPERS].sort((a, b) => b.rating - a.rating).slice(0, 3)
  const newest = [...HELPERS].sort((a, b) => a.services - b.services).slice(0, 3)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <MenuButton />
          <div>
            <h1 className={styles.title}>Explorar</h1>
            <p className={styles.subtitle}>Barcelona · {HELPERS.length} helpers activos</p>
          </div>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span>En vivo</span>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <Search size={14} color="var(--soft)" />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre, especialidad o zona..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
      </header>

      <div className={styles.content}>
        {/* Activity feed */}
        {!searchText && activeCategory === 'all' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><TrendingUp size={14} /> Actividad reciente</h2>
            <div className={styles.activityFeed}>
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className={styles.activityItem}>
                  <div className={styles.activityAvatar} style={{ background: item.color }}>{item.avatar}</div>
                  <div className={styles.activityText}>
                    <span className={styles.activityHelper}>{item.helper}</span>
                    {' '}{item.action}
                  </div>
                  <span className={styles.activityTime}>{item.time}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <div className={styles.categories}>
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              className={`${styles.catChip} ${activeCategory === cat.id ? styles.catActive : ''}`}
              onClick={() => setActiveCategory(cat.id)}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Top rated — only shown when no filter */}
        {!searchText && activeCategory === 'all' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>⭐ Mejor valorados</h2>
            <div className={styles.horizontalScroll}>
              {topRated.map(h => (
                <div key={h.id} className={styles.featuredCard} onClick={() => navigate(`/helper/${h.id}`)}>
                  {h.avatarUrl
                    ? <img src={h.avatarUrl} alt={h.name} className={styles.featuredAvatar} />
                    : <div className={styles.featuredAvatarFallback} style={{ background: h.avatarColor }}>{h.avatar}</div>
                  }
                  <h3 className={styles.featuredName}>{h.name.split(' ')[0]}</h3>
                  <p className={styles.featuredSpec}>{h.specialty}</p>
                  <span className={styles.featuredRating}><Star size={11} fill="#F59E0B" color="#F59E0B" /> {h.rating}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All / filtered helpers */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {activeCategory === 'all' ? '🗺️ Todos los helpers' : `${CATEGORIES.find(c => c.id === activeCategory)?.icon} ${CATEGORIES.find(c => c.id === activeCategory)?.label}`}
            <span className={styles.count}>{filtered.length}</span>
          </h2>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>No hay helpers en esta categoría todavía.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(h => (
                <HelperCard key={h.id} helper={h} onNavigate={navigate} />
              ))}
            </div>
          )}
        </section>

        {/* Newest */}
        {!searchText && activeCategory === 'all' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🆕 Nuevos en Nüra</h2>
            <div className={styles.newList}>
              {newest.map(h => (
                <div key={h.id} className={styles.newItem} onClick={() => navigate(`/helper/${h.id}`)}>
                  {h.avatarUrl
                    ? <img src={h.avatarUrl} alt={h.name} className={styles.newAvatar} />
                    : <div className={styles.newAvatarFallback} style={{ background: h.avatarColor }}>{h.avatar}</div>
                  }
                  <div className={styles.newInfo}>
                    <span className={styles.newName}>{h.name}</span>
                    <span className={styles.newSpec}>{h.specialty} · {h.zone}</span>
                  </div>
                  <span className={styles.newBadge}>Nuevo</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
