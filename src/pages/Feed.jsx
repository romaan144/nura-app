import { useState, useEffect } from 'react'
import { Briefcase, Users2, Award, Bookmark, Check, MessageCircle, Share2, Shield, UserPlus, Heart, Sparkles, Star, Rss } from 'lucide-react'
import RegisterGate from '../components/RegisterGate'
import { useNavigate } from 'react-router-dom'
import { HELPERS } from '../data/helpers'
import { generateDynamicPosts } from '../utils/feedGenerator'
import { COMPANIES } from '../data/companies'
import { useUser } from '../context/UserContext'
import PageHeader from '../components/PageHeader'
import { showToast } from '../components/Toast'

import styles from './Feed.module.css'

// ── Build feed — deterministic order, not random ───────────────────────────
// Daily seed: changes once per day, making feed feel fresh on return visits
const DAILY_SEED = Math.floor(Date.now() / (1000 * 60 * 60 * 24))

function buildFeed(following, helpers, companies) {
  const posts = []

  // Following content first
  const followedHelpers = helpers.filter(h =>
    (following||[]).includes(h.id) || (following||[]).includes(String(h.id))
  )
  const followedCompanies = companies.filter(c => (following||[]).includes(c.id))

  followedHelpers.forEach(h => {
    h.posts?.forEach(p => posts.push({ ...p, author: h, authorType: 'helper', following: true }))
  })
  followedCompanies.forEach(c => {
    c.posts?.forEach(p => posts.push({ ...p, author: c, authorType: 'company', following: true }))
  })

  // Then suggested (not following)
  const unfollowedHelpers = helpers.filter(h =>
    !(following||[]).includes(h.id) && !(following||[]).includes(String(h.id))
  )
  const unfollowedCompanies = companies.filter(c => !(following||[]).includes(c.id))

  unfollowedHelpers.forEach(h => {
    h.posts?.slice(0,1).forEach(p => posts.push({ ...p, author: h, authorType: 'helper', suggested: true }))
  })
  unfollowedCompanies.forEach(c => {
    c.posts?.slice(0,1).forEach(p => posts.push({ ...p, author: c, authorType: 'company', suggested: true }))
  })

  // Add dynamic AI-generated posts (availability, tips, new helpers)
  const dynamicPosts = generateDynamicPosts(helpers, 6)
  posts.push(...dynamicPosts)

  // Sort by most recent (by date string priority) — following first, then suggested
  // Score: following=2pts, dynamic(Hoy)=1pt, cert posts=0.5pt
  function postScore(p) {
    let s = 0
    if (p.following)               s += 10  // followed content first
    if (p.dynamic)                 s += 6   // AI-generated always fresh
    if (p.type === 'availability') s += 4   // availability = action
    if (p.type === 'tip')          s += 3   // Nüra tips useful
    if (p.date === 'Hoy')          s += 3   // recency
    if (p.type === 'cert')         s += 2   // credentials = trust
    if (p.badge)                   s += 2   // social proof
    if (p.verifiedWork)            s += 1   // work post
    // Daily jitter: same post scores differently each day → feed feels fresh
    const jitter = ((p.id || 0) * 17 + DAILY_SEED * 7) % 3
    s += jitter * 0.1
    return s
  }
  return posts.sort((a, b) => postScore(b) - postScore(a))
}

// ── Post Card ──────────────────────────────────────────────────────────────
function PostCard({ post }) {
  const navigate = useNavigate()
  const { follow, unfollow, isFollowing, user } = useUser()
  const [showGateLocal, setShowGateLocal] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes || 0)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const isLong = post.text?.length > 200
  const author = post.author
  const followed = isFollowing(author.id)

  function handleFollow(e) {
    e.stopPropagation()
    if (!user) { setShowGateLocal(true); return }
    if (followed) {
      unfollow(author.id)
      showToast('Dejaste de seguir')
    } else {
      follow(author.id)
      showToast(`Siguiendo a ${author.name?.split(' ')?.[0]}`)
    }
  }

  return (
    <div className={styles.card}>
      {/* Suggested label */}
      {post.suggested && !post.following && (
        <div className={styles.suggestedLabel}>Sugerido para ti</div>
      )}

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.authorRow}
          onClick={() => post.authorType === 'helper' && navigate(`/helper/${author.id}`, { state: { helper: author } })}>
          <div className={styles.avatarWrap}>
            {author.avatarUrl
              ? <img src={author.avatarUrl} alt="" className={styles.avatarImg} />
              : <div className={styles.avatarFallback} style={{background: author.avatarColor}}>
                  {author.avatar || author.name?.[0]}
                </div>
            }
            {(author.verified || author.dniVerified) && (
              <span className={styles.verifiedDot}><Shield size={8} color="white" /></span>
            )}
          </div>
          <div className={styles.authorMeta}>
            <div className={styles.authorName}>
              {author.name}
              {author.founder && <Award size={11} color='#92400E' style={{marginLeft:'4px'}} />}
            </div>
            <div className={styles.authorSub}>
              {post.authorType === 'company' ? author.handle : author.specialty} · {post.date}
            </div>
          </div>
        </div>

        {/* Follow button */}
        {post.authorType !== 'nura' && (
        <button
          className={followed ? styles.followingBtn : styles.followBtn}
          onClick={handleFollow}>
          {followed ? <><Check size={12} /> Siguiendo</> : <><UserPlus size={12} /> Seguir</>}
        </button>
        )}
      </div>

      {/* Content */}
      <p className={styles.postText} style={{
        display: '-webkit-box',
        WebkitLineClamp: expanded ? 'unset' : 4,
        WebkitBoxOrient: 'vertical',
        overflow: expanded ? 'visible' : 'hidden',
      }}>{post.text}</p>
      {isLong && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{fontSize:'var(--text-xs)',color:'var(--purple)',fontWeight:600,
            background:'none',border:'none',padding:'0',cursor:'pointer',marginTop:'-4px'}}>
          Ver más
        </button>
      )}

      {/* Badge */}
      {post.badge && <div className={styles.badge}>{post.badge}</div>}
      {post.type === 'availability' && !post.badge && (
        <div className={styles.availabilityBadge}><span style={{display:'inline-block',width:'7px',height:'7px',borderRadius:'50%',background:'var(--green)',marginRight:'5px',verticalAlign:'middle'}}/>Disponible esta semana</div>
      )}
      {post.type === 'tip' && !post.badge && (
        <div className={styles.tipBadge}>Consejo profesional</div>
      )}
      {post.type === 'hiring' && (
        <div className={styles.hiringBadge}><Briefcase size={10} style={{marginRight:'4px'}}/> Oferta de empleo · Perfil Nüra requerido</div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.action} ${liked ? styles.actionLiked : ''}`}
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n-1 : n+1) }}>
          <Heart size={17} fill={liked?'var(--red)':'none'} color={liked?'var(--red)':'rgba(0,0,0,0.35)'} />
          <span>{likes}</span>
        </button>
        <button className={styles.action}>
          <MessageCircle size={17} color="rgba(0,0,0,0.35)" />
          <span>{post.comments || 0}</span>
        </button>
        <button className={styles.action}>
          <Share2 size={17} color="rgba(0,0,0,0.35)" />
        </button>
        <button className={`${styles.action} ${styles.actionEnd} ${saved ? styles.actionSaved : ''}`}
          onClick={() => setSaved(s => !s)}>
          <Bookmark size={17} fill={saved?'var(--purple)':'none'} color={saved?'var(--purple)':'rgba(0,0,0,0.35)'} />
        </button>
      </div>
      {showGateLocal && <RegisterGate reason="follow" onClose={() => setShowGateLocal(false)} />}
    </div>
  )
}

// ── Main Feed ──────────────────────────────────────────────────────────────
export default function Feed() {
  const { following, searchHistory } = useUser()
  const [tab, setTab] = useState('para-ti')
  const [feedLoading, setFeedLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setFeedLoading(false), 400)
    return () => clearTimeout(t)
  }, [])
  const [showGate, setShowGate] = useState(false)

  const allPosts = buildFeed(following, HELPERS, COMPANIES)
  const displayPosts = tab === 'siguiendo'
    ? allPosts.filter(p => p.following)
    : allPosts

  const followingCount = allPosts.filter(p => p.following).length

  return (
    <div className={styles.page}>
      <PageHeader />

      {/* Tabs */}
      <div className={styles.tabs}>
        <div className={styles.tabsInner}>
          <button
            className={`${styles.tab} ${tab==='para-ti' ? styles.tabActive : ''}`}
            onClick={() => setTab('para-ti')}>
            Para ti
          </button>
          <button
            className={`${styles.tab} ${tab==='siguiendo' ? styles.tabActive : ''}`}
            onClick={() => setTab('siguiendo')}>
            Siguiendo{followingCount > 0 ? ` (${followingCount})` : ''}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className={styles.feed}>

        {/* Nüra personalized section — based on last search */}
        
        {/* ── Nüra Pick del día ── */}
        {tab === 'para-ti' && (() => {
          // Pick: best available professional today (seed changes daily)
          const available = HELPERS.filter(h => h.available)
          if (!available.length) return null
          const pickIdx = DAILY_SEED % available.length
          const pick = available[pickIdx]
          const pickReason = searchHistory?.[0]?.query
            ? `Coincide con tu búsqueda de "${searchHistory[0].query.toLowerCase()}"`
            : pick.specialty
              ? `Especialista en ${pick.specialty.toLowerCase()}`
              : 'Muy valorado en Nüra'
          return (
            <div className={styles.nuraPick} key="nura-pick"
              onClick={() => navigate(`/helper/${pick.id}`, { state: { helper: pick } })}>
              <div className={styles.nuraPickHeader}>
                <span className={styles.nuraPickLabel}>
                  <Sparkles size={11} color="var(--purple)" /> Nüra Pick del día
                </span>
                <span className={styles.nuraPickDate}>Actualiza mañana</span>
              </div>
              <div className={styles.nuraPickCard}>
                {pick.avatarUrl
                  ? <img src={pick.avatarUrl} alt={pick.name} className={styles.nuraPickAvatar} />
                  : <div className={styles.nuraPickAvatarFallback} style={{background: pick.avatarColor}}>
                      {pick.avatar || pick.name?.[0]}
                    </div>
                }
                <div className={styles.nuraPickInfo}>
                  <div className={styles.nuraPickName}>{pick.name?.split(' ').slice(0,2).join(' ')}</div>
                  <div className={styles.nuraPickSpec}>{pick.specialty}</div>
                  <div className={styles.nuraPickReason}>
                    <Sparkles size={9} color="var(--purple)" />
                    {pickReason}
                  </div>
                </div>
                <div className={styles.nuraPickRight}>
                  {pick.price && pick.price !== 'Consultar' && (
                    <span className={styles.nuraPickPrice}>{pick.price}</span>
                  )}
                  <div className={styles.nuraPickStar}>
                    <Star size={10} fill="var(--amber)" color="var(--amber)" />
                    <span>{pick.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

{tab === 'para-ti' && searchHistory?.length > 0 && (() => {
          const lastQ = searchHistory[0]?.query
          const lastCat = searchHistory[0]?.category
          const words = lastQ.toLowerCase().split(/\s+/).filter(w => w.length > 3)
          const related = HELPERS.filter(h =>
            h.available && (
              (lastCat && h.category === lastCat) ||
              words.some(w =>
                h.specialty?.toLowerCase().includes(w) ||
                h.category?.toLowerCase().includes(w) ||
                h.bio?.toLowerCase().includes(w) ||
                (h.tags||[]).some(t => t.toLowerCase().includes(w))
              )
            )
          ).slice(0, 3)
          if (!related.length || !lastQ) return null
          return (
            <div style={{
              background:'linear-gradient(135deg,rgba(123,47,255,0.06),rgba(0,212,200,0.04))',
              border:'1px solid rgba(123,47,255,0.1)',
              borderRadius:'20px',padding:'16px',marginBottom:'10px',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'12px'}}>
                <img src="/logo-iso.png" alt="Nüra" style={{width:'14px',height:'14px',objectFit:'contain'}} />
                <span style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--purple)',letterSpacing:'0.4px',textTransform:'uppercase'}}>
                  Basado en tu búsqueda
                </span>
              </div>
              <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.55)',margin:'0 0 12px',lineHeight:1.5}}>
                Buscaste <strong style={{color:'rgba(0,0,0,0.75)'}}>{lastQ}</strong>. Estos profesionales están disponibles ahora.
              </p>
              <div style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'2px'}}>
                {related.map(h => (
                  <div key={h.id}
                    onClick={() => navigate(`/helper/${h.id}`, { state: { helper: h } })}
                    style={{
                      flexShrink:0,cursor:'pointer',
                      background:'white',borderRadius:'14px',
                      padding:'10px 12px',minWidth:'120px',
                      boxShadow:'0 1px 4px rgba(0,0,0,0.07)',
                      display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',
                    }}>
                    <img src={h.avatarUrl} alt={h.name}
                      style={{width:'40px',height:'40px',borderRadius:'50%',objectFit:'cover'}} />
                    <span style={{fontSize:'var(--text-xs)',fontWeight:700,color:'rgba(0,0,0,0.8)',textAlign:'center'}}>
                      {h.name.split(' ')[0]}
                    </span>
                    <span style={{fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.45)',textAlign:'center',lineHeight:1.3}}>
                      {h.specialty}
                    </span>
                    <span style={{fontSize:'var(--text-xs)',color:'var(--green)',fontWeight:600}}>
                      Disponible
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {feedLoading && (
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {[1,2].map(i => (
              <div key={i} style={{background:'rgba(255,255,255,0.85)',borderRadius:'20px',padding:'16px',
                animation:'pulse 1.5s ease-in-out infinite',boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
                <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'14px'}}>
                  <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'rgba(0,0,0,0.06)',flexShrink:0}} />
                  <div style={{flex:1}}>
                    <div style={{height:'13px',borderRadius:'7px',background:'rgba(0,0,0,0.06)',width:'50%',marginBottom:'6px'}} />
                    <div style={{height:'10px',borderRadius:'5px',background:'rgba(0,0,0,0.04)',width:'35%'}} />
                  </div>
                  <div style={{width:'60px',height:'26px',borderRadius:'13px',background:'rgba(0,0,0,0.06)'}} />
                </div>
                <div style={{height:'12px',borderRadius:'6px',background:'rgba(0,0,0,0.04)',width:'95%',marginBottom:'8px'}} />
                <div style={{height:'12px',borderRadius:'6px',background:'rgba(0,0,0,0.04)',width:'80%'}} />
              </div>
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
          </div>
        )}
        {!feedLoading && displayPosts.length === 0 ? (
          <div className={styles.empty}>
            <Users2 size={44} color='rgba(0,0,0,0.12)' strokeWidth={1.2} />
            <h3>Aún no sigues a nadie</h3>
            <p>Sigue a profesionales para ver sus publicaciones aquí. Están en la tab "Para ti".</p>
            <button className={styles.emptyBtn} onClick={() => setTab('para-ti')}>
              Descubrir profesionales
            </button>
          </div>
        ) : (
          !feedLoading && displayPosts.map((post, i) => (
            <PostCard key={post.id || i} post={post} />
          ))
        )}
      </div>
      {showGate && <RegisterGate reason="follow" onClose={() => setShowGate(false)} />}
    </div>
  )
}
