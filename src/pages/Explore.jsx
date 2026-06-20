import PageHeader from '../components/PageHeader'
import HelperCard from '../components/HelperCard'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, X, Grid3X3, Heart, Wrench, BookOpen, Activity, Shield, Loader2, MapPin } from 'lucide-react'
import { HELPERS as LOCAL_HELPERS } from '../data/helpers'
import { getAllHelpers } from '../utils/supabase'
import { analyzeNeed, matchHelpers, getPriceContext } from '../utils/matching'
import { useUser } from '../context/UserContext'
import styles from './Explore.module.css'

const QUICK_FILTERS = [
  { id: 'all',       label: 'Todos',      icon: Grid3X3 },
  { id: 'cuidado',   label: 'Cuidado',    icon: Heart },
  { id: 'tecnico',   label: 'Técnicos',   icon: Wrench },
  { id: 'clases',    label: 'Clases',     icon: BookOpen },
  { id: 'salud',     label: 'Salud',      icon: Activity },
  { id: 'legal',     label: 'Legal',      icon: Shield },
]

// Category → natural language query for AI matching
const CAT_QUERIES = {
  cuidado: 'Necesito una cuidadora o auxiliar para una persona mayor',
  tecnico: 'Necesito un técnico para reparaciones en casa',
  clases:  'Busco profesor de clases particulares o refuerzo escolar',
  salud:   'Busco un profesional de salud o fisioterapeuta',
  legal:   'Necesito asesoramiento legal o un abogado',
}

export default function Explore() {
  const navigate  = useNavigate()
  const { addSearch, cacheHelpers } = useUser()
  const inputRef  = useRef(null)

  const [allHelpers, setAllHelpers]     = useState(LOCAL_HELPERS)
  const [loadingData, setLoadingData]   = useState(true)
  const [searchText, setSearchText]     = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showFilters, setShowFilters]   = useState(false)
  const [filters, setFilters]           = useState({ presential: false, online: false, urgent: false, maxPrice: '', maxDist: '' })

  // AI state
  const [aiResults, setAiResults]       = useState(null)   // null = show all
  const [aiReasons, setAiReasons]       = useState({})
  const [aiQuery, setAiQuery]           = useState('')
  const [aiSearching, setAiSearching]   = useState(false)
  const [priceCtx, setPriceCtx]         = useState(null)

  // Load remote helpers
  useEffect(() => {
    getAllHelpers().then(remote => {
      if (remote?.length > 0) {
        const sorted = [...remote].sort((a, b) => {
          const sa = (a.rating||0) * Math.log((a.reviews||0)+1)
          const sb = (b.rating||0) * Math.log((b.reviews||0)+1)
          return sb - sa
        })
        setAllHelpers(sorted)
        cacheHelpers(sorted)
      }
      setLoadingData(false)
    }).catch(() => setLoadingData(false))
  }, [])

  // ── AI SEARCH ────────────────────────────────────────────────
  async function runAiSearch(query) {
    if (!query.trim()) { clearAi(); return }
    setVisibleCount(20)
    setAiSearching(true)
    setAiQuery(query)

    const analysis = analyzeNeed(query)
    const matches  = await matchHelpers(analysis, 12)

    // Build match reasons
    const reasons = {}
    matches.forEach((h, i) => {
      const rank = null
      const spec = h.specialty ? `Especialista en ${h.specialty.toLowerCase()}` : null
      const dist = h.distance ? `A ${h.distance}km de ti` : null
      const parts = [rank, spec, dist].filter(Boolean)
      reasons[h.id] = parts.slice(0,2).join(' · ')
    })

    setAiResults(matches)
    setAiReasons(reasons)
    setPriceCtx(matches.length > 0 ? getPriceContext(matches[0], analysis.categoria) : null)

    // Store window globals for profile navigation
    window.__nuraMatchReasons = reasons
    window.__nuraLastQuery    = query
    try { sessionStorage.setItem('nura_match_reasons', JSON.stringify(reasons)) } catch {}
    try { sessionStorage.setItem('nura_last_query', query) } catch {}

    addSearch(query, analysis.categoria)
    setAiSearching(false)
  }

  function clearAi() {
    setVisibleCount(20)
    setAiResults(null)
    setAiReasons({})
    setAiQuery('')
    setPriceCtx(null)
    setSearchText('')
    setActiveCategory('all')
  }

  function handleCategoryClick(cat) {
    if (cat === 'all') { clearAi(); return }
    if (cat === activeCategory) { clearAi(); return }
    setActiveCategory(cat)
    setVisibleCount(20)
    const query = CAT_QUERIES[cat] || cat
    setSearchText('')
    runAiSearch(query)
  }

  function handleSubmit(e) {
    e?.preventDefault()
    if (!searchText.trim()) return
    setActiveCategory('all')
    runAiSearch(searchText.trim())
  }

  // ── MANUAL FILTER (when no AI search active) ─────────────────
  const manualFiltered = allHelpers.filter(h => {
    const CATEGORY_MAP = {
      clases: ['matematicas', 'clases'], salud: ['salud', 'otro'],
      hogar: ['hogar', 'tecnico', 'limpieza'], legal: ['legal'],
    }
    const mapped = CATEGORY_MAP[activeCategory] || [activeCategory]
    const catOk = activeCategory === 'all' ||
      mapped.some(mc => h.category === mc) ||
      h.specialty?.toLowerCase().includes(activeCategory) ||
      (h.tags||[]).some(t => t.toLowerCase().includes(activeCategory))
    const q = searchText.toLowerCase()
    const textOk = !searchText ||
      h.name?.toLowerCase().includes(q) ||
      h.specialty?.toLowerCase().includes(q) ||
      h.bio?.toLowerCase().includes(q)
    const presOk  = !filters.presential || h.presential
    const onlineOk= !filters.online     || h.online
    const urgOk   = !filters.urgent     || h.urgent
    const priceOk = !filters.maxPrice   || (h.price && parseInt(h.price.replace(/[^0-9]/g,'')) <= parseInt(filters.maxPrice))
    const distOk  = !filters.maxDist    || h.distance <= parseFloat(filters.maxDist)
    return catOk && textOk && presOk && onlineOk && urgOk && priceOk && distOk
  }).sort((a,b) => (b.rating||0)*Math.log((b.reviews||0)+1) - (a.rating||0)*Math.log((a.reviews||0)+1))

  const displayList   = aiResults ?? manualFiltered
  const isAiMode      = aiResults !== null

  // Pagination — only in manual mode
  const [visibleCount, setVisibleCount] = useState(20)
  // Reset visible count when filters or search changes
  const pagedList = isAiMode ? displayList : displayList.slice(0, visibleCount)
  const hasMore   = !isAiMode && displayList.length > visibleCount
  const activeFilters = Object.values(filters).filter(Boolean).length

  return (
    <div className={styles.page}>

      <PageHeader />

      {/* ── STICKY TOP BAR: search + categories ── */}
      <div className={styles.topBar}>
        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <div className={styles.searchBar}>
            {aiSearching
              ? <Loader2 size={15} color="var(--purple)" style={{animation:'spin 1.2s linear infinite'}} />
              : <Search size={15} color="var(--soft)" />
            }
            <input
              ref={inputRef}
              className={styles.searchInput}
              placeholder="Describe qué necesitas..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {(searchText || isAiMode) && (
              <button type="button" className={styles.clearBtn} onClick={clearAi}>
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              className={`${styles.filterBtn} ${activeFilters > 0 ? styles.filterBtnActive : ''}`}
              onClick={() => setShowFilters(s => !s)}>
              <SlidersHorizontal size={15} />
              {activeFilters > 0 && <span className={styles.filterCount}>{activeFilters}</span>}
            </button>
          </div>
        </form>

        {/* ── CATEGORY CHIPS ── */}
        <div className={styles.categories}>
          {QUICK_FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.cat} ${(activeCategory === id && !isAiMode) || (isAiMode && id !== 'all' && CAT_QUERIES[id] && aiQuery === CAT_QUERIES[id]) ? styles.catActive : ''}`}
              onClick={() => handleCategoryClick(id)}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>{/* end topBar */}

      <div className={styles.content}>

        {/* ── FILTER PANEL ── */}
        {showFilters && (
          <div className={styles.filterPanel}>
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>Modalidad</span>
              <div className={styles.filterPills}>
                {['presential','online'].map(k => (
                  <button key={k} className={`${styles.filterPill} ${filters[k] ? styles.filterPillActive : ''}`}
                    onClick={() => setFilters(f => ({...f, [k]: !f[k]}))}>
                    {k === 'presential' ? 'Presencial' : 'Online'}
                  </button>
                ))}
                <button className={`${styles.filterPill} ${filters.urgent ? styles.filterPillActive : ''}`}
                  onClick={() => setFilters(f => ({...f, urgent: !f.urgent}))}>
                  Urgencias
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
              <div className={styles.filterPills}>
                {['1','3','5','10'].map(d => (
                  <button key={d} className={`${styles.filterPill} ${filters.maxDist === d ? styles.filterPillActive : ''}`}
                    onClick={() => setFilters(f => ({...f, maxDist: f.maxDist === d ? '' : d}))}>
                    {d}km
                  </button>
                ))}
              </div>
            </div>
            <button className={styles.clearFilters}
              onClick={() => setFilters({ presential:false,online:false,urgent:false,maxPrice:'',maxDist:'' })}>
              <X size={12} /> Limpiar filtros
            </button>
          </div>
        )}

        {/* ── AI RESULT HEADER ── */}
        {isAiMode && !aiSearching && (
          <div className={styles.aiHeader}>
            <span>
              <strong>{displayList.length} resultado{displayList.length !== 1 ? 's' : ''}</strong>
              {' '}para "{aiQuery.length > 30 ? aiQuery.slice(0,30)+'...' : aiQuery}"
            </span>
            {priceCtx && (
              <p className={styles.priceCtx}>{priceCtx}</p>
            )}
          </div>
        )}

        {/* ── RESULTS COUNT — always visible when not searching ── */}
        {!aiSearching && (
          <div className={styles.listHeader}>
            <span className={styles.listCount}>
              {isAiMode
                ? `${displayList.length} resultado${displayList.length !== 1 ? 's' : ''} encontrado${displayList.length !== 1 ? 's' : ''}`
                : `${pagedList.length} de ${displayList.length} profesional${displayList.length !== 1 ? 'es' : ''} cerca de ti`}
            </span>
          </div>
        )}

        {/* ── SEARCHING STATE ── */}
        {aiSearching && (
          <div className={styles.searching}>
            <Loader2 size={16} color="var(--purple)" style={{animation:'spin 1.2s linear infinite'}} />
            <span>Buscando profesionales...</span>
          </div>
        )}

        {/* ── RESULTS ── */}
        {!aiSearching && (
          <div className={styles.grid}>
            {displayList.length === 0 ? (
              <div className={styles.empty}>
                <Search size={36} color="rgba(0,0,0,0.12)" strokeWidth={1.3} />
                <strong>Sin resultados</strong>
                <p>Prueba con otras palabras o amplía los filtros.</p>
                <button className={styles.emptyBtn} onClick={clearAi}>
                  Ver todos los profesionales
                </button>
              </div>
            ) : pagedList.map(h => (
              <div key={h.id}>
                <HelperCard
                  helper={h}
                  onContact={() => navigate(`/chat/${h.id}`, {
                    state: { helper: h, userQuery: aiQuery || window.__nuraLastQuery, matchReason: aiReasons[h.id] }
                  })}
                />
                {/* AI match reason — only in AI mode */}
                {isAiMode && aiReasons[h.id] && (
                  <div className={styles.matchReason}>
                    
                    <span>{aiReasons[h.id]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── LOAD MORE ── */}
        {hasMore && (
          <div style={{padding:'8px 0 24px',textAlign:'center'}}>
            <button
              onClick={() => setVisibleCount(v => v + 20)}
              style={{padding:'10px 28px',background:'rgba(0,0,0,0.05)',border:'none',
                borderRadius:'var(--radius-full)',fontSize:'var(--text-sm)',fontWeight:600,
                color:'var(--ink-secondary)',cursor:'pointer',fontFamily:'inherit'}}>
              Ver más profesionales
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
