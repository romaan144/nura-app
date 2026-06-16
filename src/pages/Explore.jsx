import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { HELPERS as LOCAL_HELPERS } from '../data/helpers'
import { getAllHelpers } from '../utils/supabase'
import { useUser } from '../context/UserContext'
import PageHeader from '../components/PageHeader'
import styles from './Explore.module.css'

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '✦' },
  { id: 'cuidado', label: 'Cuidados', icon: '❤️' },
  { id: 'logopeda', label: 'Logopedia', icon: '🗣️' },
  { id: 'limpieza', label: 'Limpieza', icon: '🧹' },
  { id: 'tecnico', label: 'Técnicos', icon: '🔧' },
  { id: 'mascotas', label: 'Mascotas', icon: '🐾' },
  { id: 'clases', label: 'Clases', icon: '📚' },
  { id: 'entrenador', label: 'Fitness', icon: '💪' },
  { id: 'psicologia', label: 'Psicología', icon: '🧠' },
  { id: 'nutricion', label: 'Nutrición', icon: '🥗' },
  { id: 'fisioterapia', label: 'Fisio', icon: '🦴' },
  { id: 'idiomas', label: 'Idiomas', icon: '🌍' },
  { id: 'informatica', label: 'Informática', icon: '💻' },
  { id: 'musica', label: 'Música', icon: '🎵' },
  { id: 'acompañamiento', label: 'Acompañamiento', icon: '🤝' },
]

export default function Explore() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [HELPERS, setHELPERS] = useState(LOCAL_HELPERS)
  const { cacheHelpers } = useUser()

  const [loadingHelpers, setLoadingHelpers] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    getAllHelpers().then(remote => {
      if (remote?.length > 0) {
        // Sort by quality: rating * log(reviews+1) — rewards both high rating AND volume
        const sorted = [...remote].sort((a, b) => {
          const scoreA = (a.rating || 0) * Math.log((a.reviews || 0) + 1)
          const scoreB = (b.rating || 0) * Math.log((b.reviews || 0) + 1)
          return scoreB - scoreA
        })
        setHELPERS(sorted)
        cacheHelpers(sorted)
        setTotalCount(sorted.length)
      }
      setLoadingHelpers(false)
    }).catch(() => setLoadingHelpers(false))
  }, [])
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState('quality') // quality | price | rating
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ presential: false, online: false, urgent: false, maxPrice: '', maxDist: '' })

  // Sort filtered results
  const sortFn = (a, b) => {
    if (sortBy === 'price') {
      const pa = parseFloat((a.price || '999').replace(/[^0-9.]/g,'')) || 999
      const pb = parseFloat((b.price || '999').replace(/[^0-9.]/g,'')) || 999
      return pa - pb
    }
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
    // quality: rating × log(reviews+1)
    const sa = (a.rating||0) * Math.log((a.reviews||0)+1)
    const sb = (b.rating||0) * Math.log((b.reviews||0)+1)
    return sb - sa
  }

  const filtered = HELPERS.filter(h => {
    // Map UI category IDs to data categories
    const CATEGORY_MAP = {
      'clases': ['matematicas', 'clases'],
      'fitness': ['entrenador', 'fitness'],
      'salud': ['salud', 'otro'],
      'hogar': ['hogar', 'tecnico', 'limpieza'],
      'legal': ['legal'],
    }
    const mappedCats = CATEGORY_MAP[activeCategory] || [activeCategory]
    const catMatch = activeCategory === 'all' || 
      mappedCats.some(mc => h.category === mc) ||
      h.specialty?.toLowerCase().includes(activeCategory) ||
      (h.tags||[]).some(t => t.toLowerCase().includes(activeCategory)) ||
      h.bio?.toLowerCase().includes(activeCategory)
    const textMatch = !searchText || h.name.toLowerCase().includes(searchText.toLowerCase()) || h.specialty?.toLowerCase().includes(searchText.toLowerCase()) || h.tags?.some(t => t.toLowerCase().includes(searchText.toLowerCase()))
    const presMatch = !filters.presential || h.presential
    const onlineMatch = !filters.online || h.online
    const urgentMatch = !filters.urgent || h.urgent
    const priceMatch = !filters.maxPrice || (h.price && parseInt(h.price.replace(/[^0-9]/g,'')) <= parseInt(filters.maxPrice))
    const distMatch = !filters.maxDist || h.distance <= parseFloat(filters.maxDist)
    return catMatch && textMatch && presMatch && onlineMatch && urgentMatch && priceMatch && distMatch
  })

  const activeFilters = Object.values(filters).filter(Boolean).length

  return (
    <div className={styles.page}>
      <PageHeader />

      <div className={styles.searchWrap}>
        <div className={styles.searchBar}>
          <Search size={15} color="var(--soft)" />
          <input className={styles.searchInput}
            placeholder="Buscar helpers..."
            value={searchText} onChange={e => setSearchText(e.target.value)} />
          <button className={`${styles.filterBtn} ${activeFilters > 0 ? styles.filterBtnActive : ''}`}
            onClick={() => setShowFilters(s => !s)}>
            <SlidersHorizontal size={15} />
            {activeFilters > 0 && <span className={styles.filterCount}>{activeFilters}</span>}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>Modalidad</span>
            <div className={styles.filterPills}>
              {['presential','online'].map(k => (
                <button key={k} className={`${styles.filterPill} ${filters[k] ? styles.filterPillActive : ''}`}
                  onClick={() => setFilters(f => ({...f, [k]: !f[k]}))}>
                  {k === 'presential' ? '📍 Presencial' : '💻 Online'}
                </button>
              ))}
              <button className={`${styles.filterPill} ${filters.urgent ? styles.filterPillActive : ''}`}
                onClick={() => setFilters(f => ({...f, urgent: !f.urgent}))}>
                ⚡ Urgencias
              </button>
            </div>
          </div>
          <div className={styles.filterRow}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span className={styles.filterLabel}>Precio máximo</span>
              <span className={styles.filterPriceLabel}>{filters.maxPrice ? `${filters.maxPrice}€` : 'Sin límite'}</span>
            </div>
            <input className={styles.filterInput} type="range" min="0" max="200" step="5"
              value={filters.maxPrice || 200}
              onChange={e => setFilters(f => ({...f, maxPrice: e.target.value === '200' ? '' : e.target.value}))} />
          </div>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>Distancia máxima (km)</span>
            <input className={styles.filterInput} type="number" placeholder="ej. 5"
              value={filters.maxDist} onChange={e => setFilters(f => ({...f, maxDist: e.target.value}))} />
          </div>
          <button className={styles.clearFilters} onClick={() => setFilters({ presential: false, online: false, urgent: false, maxPrice: '', maxDist: '' })}>
            <X size={13} /> Limpiar filtros
          </button>
        </div>
      )}

      {/* Categories */}
      <div className={styles.categories}>
        {CATEGORIES.map(c => (
          <button key={c.id} className={`${styles.cat} ${activeCategory === c.id ? styles.catActive : ''}`}
            onClick={() => setActiveCategory(c.id)}>
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {!searchText && activeCategory === 'all' && (
          <div className={styles.featuredSection}>
            <h3 className={styles.featuredTitle}>⭐ Más valorados esta semana</h3>
            <div className={styles.featuredRow}>
              {[...HELPERS].sort((a,b) => b.rating - a.rating).slice(0,4).map(h => (
                <div key={h.id} className={styles.featuredCard} onClick={() => navigate(`/helper/${h.id}`, { state: { helper: h } })}>
                  <img src={h.avatarUrl || `https://api.dicebear.com/9.x/personas/svg?seed=${h.name}`}
                    alt={h.name} className={styles.featuredAvatar} />
                  <div className={styles.featuredName}>{h.name.split(' ')[0]}</div>
                  <div className={styles.featuredSpec}>{h.specialty?.split(' ')[0]}</div>
                  <div className={styles.featuredRating}>⭐ {h.rating}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {loadingHelpers && (
          <div className={styles.skeletonGrid}>
            {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        )}
        {!loadingHelpers && (<>
          <div className={styles.resultsCount}>
          {totalCount > 0 ? `${filtered.length} de ${totalCount} profesionales` : `${filtered.length} profesionales`}
        </div>
        {/* Sort pills */}
        <div style={{display:'flex',gap:'6px',marginBottom:'12px',overflowX:'auto',paddingBottom:'2px'}}>
          {[
            {id:'quality', label:'Mejor valorado'},
            {id:'rating',  label:'Mayor rating'},
            {id:'price',   label:'Menor precio'},
          ].map(s => (
            <button key={s.id}
              onClick={() => setSortBy(s.id)}
              style={{
                flexShrink:0, padding:'6px 14px',
                background: sortBy===s.id ? '#1C1C1E' : 'rgba(255,255,255,0.7)',
                color: sortBy===s.id ? 'white' : 'rgba(0,0,0,0.55)',
                border: sortBy===s.id ? 'none' : '1px solid rgba(0,0,0,0.08)',
                borderRadius:'100px', fontSize:'12px', fontWeight:600,
                cursor:'pointer', transition:'all 0.15s',
                fontFamily:'-apple-system,"Inter",sans-serif',
              }}>
              {s.label}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.length === 0 && !loadingHelpers && (
            <div style={{gridColumn:'1/-1',textAlign:'center',padding:'48px 24px',
              display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}}>
              <span style={{fontSize:'44px'}}>🔍</span>
              <p style={{fontSize:'16px',fontWeight:700,color:'rgba(0,0,0,0.6)',margin:0,letterSpacing:'-0.2px'}}>
                Sin resultados
              </p>
              <p style={{fontSize:'14px',color:'rgba(0,0,0,0.4)',margin:0}}>
                Prueba con otra categoría o ajusta el precio
              </p>
              <button onClick={() => { setActiveCategory('all'); setPriceMax(200) }}
                style={{padding:'10px 22px',background:'#1C1C1E',color:'white',border:'none',
                  borderRadius:'100px',fontSize:'13px',fontWeight:700,cursor:'pointer',marginTop:'4px'}}>
                Ver todos
              </button>
            </div>
          )}
          {filtered.map(h => (
            <HelperCard key={h.id} helper={h} />
          ))}
        </div></> )}
      </div>
    </div>
  )
}
