import { useState } from 'react'
import RegisterGate from '../components/RegisterGate'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Bookmark, UserPlus, Check, Shield, Award } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { generateDynamicPosts } from '../utils/feedGenerator'
import { COMPANIES } from '../data/companies'
import { useUser } from '../context/UserContext'
import PageHeader from '../components/PageHeader'
import { showToast } from '../components/Toast'

import styles from './Feed.module.css'

// ── Build feed — deterministic order, not random ───────────────────────────
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
      <p className={styles.postText}>{post.text}</p>

      {/* Badge */}
      {post.badge && <div className={styles.badge}>{post.badge}</div>}
      {post.type === 'availability' && !post.badge && (
        <div className={styles.availabilityBadge}>🟢 Disponible esta semana</div>
      )}
      {post.type === 'tip' && !post.badge && (
        <div className={styles.tipBadge}>💡 Consejo profesional</div>
      )}
      {post.type === 'hiring' && (
        <div className={styles.hiringBadge}>💼 Oferta de empleo · Perfil Nüra requerido</div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.action} ${liked ? styles.actionLiked : ''}`}
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n-1 : n+1) }}>
          <Heart size={17} fill={liked?'#EF4444':'none'} color={liked?'#EF4444':'rgba(0,0,0,0.35)'} />
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
  const { following } = useUser()
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
            <span style={{fontSize:'44px'}}>👥</span>
            <h3>Aún no sigues a nadie</h3>
            <p>Sigue a helpers para ver sus publicaciones aquí. Están en la tab "Para ti".</p>
            <button className={styles.emptyBtn} onClick={() => setTab('para-ti')}>
              Ver sugerencias
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
