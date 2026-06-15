import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Bookmark, Bell, UserPlus, Check, Sparkles } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { COMPANIES } from '../data/companies'
import PageHeader from '../components/PageHeader'
import { useUser } from '../context/UserContext'
import styles from './Feed.module.css'

// Build a unified feed from helpers + companies
function buildFeed(following, helpers, companies) {
  const allPosts = []

  // Posts from followed profiles
  const followedHelpers = helpers.filter(h => following.includes(h.id) || following.includes(String(h.id)))
  const followedCompanies = companies.filter(c => following.includes(c.id))

  followedHelpers.forEach(h => {
    h.posts?.forEach(p => allPosts.push({ ...p, author: h, authorType: 'helper' }))
  })
  followedCompanies.forEach(c => {
    c.posts?.forEach(p => allPosts.push({ ...p, author: c, authorType: 'company' }))
  })

  // If not following anyone yet, show recommended content
  if (allPosts.length === 0) {
    helpers.slice(0, 4).forEach(h => {
      h.posts?.slice(0, 1).forEach(p => allPosts.push({ ...p, author: h, authorType: 'helper', recommended: true }))
    })
    companies.slice(0, 2).forEach(c => {
      c.posts?.slice(0, 1).forEach(p => allPosts.push({ ...p, author: c, authorType: 'company', recommended: true }))
    })
  }

  return allPosts.sort(() => Math.random() - 0.3)
}

function PostTypeTag({ type }) {
  const map = {
    work: { label: 'Trabajo verificado', color: '#059669', bg: '#ECFDF5', icon: '✅' },
    cert: { label: 'Certificación', color: '#92400E', bg: '#FEF3C7', icon: '🏆' },
    news: { label: 'Novedad', color: '#1E40AF', bg: '#EFF6FF', icon: '📢' },
    hiring: { label: 'Oferta de trabajo', color: '#7C3AED', bg: 'rgba(123,47,255,0.1)', icon: '💼' },
    milestone: { label: 'Hito', color: '#DB2777', bg: '#FDF2F8', icon: '🎉' },
    research: { label: 'Investigación', color: '#0891B2', bg: '#ECFEFF', icon: '🔬' },
    event: { label: 'Evento', color: '#D97706', bg: '#FFFBEB', icon: '📅' },
    training: { label: 'Formación', color: '#059669', bg: '#ECFDF5', icon: '📚' },
  }
  const t = map[type] || map.news
  return (
    <span className={styles.postTypeTag} style={{ color: t.color, background: t.bg }}>
      {t.icon} {t.label}
    </span>
  )
}

function PostCard({ post }) {
  const navigate = useNavigate()
  const { follow, unfollow, isFollowing } = useUser()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes)
  const [saved, setSaved] = useState(false)
  const author = post.author
  const followed = isFollowing(author.id)

  function handleAuthorClick() {
    if (post.authorType === 'helper') navigate(`/helper/${author.id}`)
    else navigate(`/company/${author.id}`)
  }

  return (
    <div className={styles.postCard}>
      {post.recommended && (
        <div className={styles.recommendedBadge}>
          <Sparkles size={11} /> Recomendado para ti
        </div>
      )}

      {/* Author header */}
      <div className={styles.postHeader}>
        <div className={styles.authorInfo} onClick={handleAuthorClick}>
          <div className={styles.authorAvatar} style={{ background: author.avatarColor }}>
            {author.avatarUrl
              ? <img src={author.avatarUrl} alt="" className={styles.authorAvatarImg} />
              : <span>{typeof author.avatar === 'string' && author.avatar.length <= 2 ? author.avatar : author.name?.[0]}</span>
            }
          </div>
          <div className={styles.authorMeta}>
            <div className={styles.authorName}>
              {author.name}
              {author.verified && <span className={styles.verifiedDot}>✓</span>}
            </div>
            <div className={styles.authorSub}>
              {post.authorType === 'company' ? author.handle : author.specialty}
              {' · '}{post.date}
            </div>
          </div>
        </div>

        {!followed ? (
          <button className={styles.followBtn} onClick={() => follow(author.id)}>
            <UserPlus size={13} /> Seguir
          </button>
        ) : (
          <button className={styles.followingBtn} onClick={() => unfollow(author.id)}>
            <Check size={13} /> Siguiendo
          </button>
        )}
      </div>

      {/* Post type tag */}
      <PostTypeTag type={post.type} />

      {/* Content */}
      <p className={styles.postText}>{post.text}</p>

      {/* Actions */}
      <div className={styles.postActions}>
        <button
          className={`${styles.action} ${liked ? styles.actionLiked : ''}`}
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1) }}>
          <Heart size={18} fill={liked ? 'var(--red)' : 'none'} color={liked ? 'var(--red)' : 'var(--soft)'} />
          <span>{likes}</span>
        </button>
        <button className={styles.action}>
          <MessageCircle size={18} color="var(--soft)" />
          <span>{post.comments}</span>
        </button>
        <button className={styles.action}>
          <Share2 size={18} color="var(--soft)" />
        </button>
        <button
          className={`${styles.action} ${styles.actionRight} ${saved ? styles.actionSaved : ''}`}
          onClick={() => setSaved(s => !s)}>
          <Bookmark size={18} fill={saved ? 'var(--purple)' : 'none'} color={saved ? 'var(--purple)' : 'var(--soft)'} />
        </button>
      </div>
    </div>
  )
}

function SuggestedProfile({ profile, type, onFollow, onUnfollow, isFollowed }) {
  const navigate = useNavigate()

  return (
    <div className={styles.suggestedCard} onClick={() => type === 'helper' ? navigate(`/helper/${profile.id}`) : null}>
      <div className={styles.suggestedAvatar} style={{ background: profile.avatarColor }}>
        {profile.avatarUrl
          ? <img src={profile.avatarUrl} alt="" className={styles.suggestedAvatarImg} />
          : <span>{profile.avatar || profile.name?.[0]}</span>
        }
      </div>
      <div className={styles.suggestedInfo}>
        <div className={styles.suggestedName}>{profile.name}</div>
        <div className={styles.suggestedSpec}>{profile.specialty || profile.handle}</div>
      </div>
      <button
        className={isFollowed ? styles.followingBtnSmall : styles.followBtnSmall}
        onClick={(e) => { e.stopPropagation(); isFollowed ? onUnfollow(profile.id) : onFollow(profile.id) }}>
        {isFollowed ? '✓' : '+ Seguir'}
      </button>
    </div>
  )
}

export default function Feed() {
  const { following, follow, unfollow, isFollowing, unreadNotifs, markNotifsRead } = useUser()
  const [activeSection, setActiveSection] = useState('para-ti') // para-ti | siguiendo

  const feed = buildFeed(following, HELPERS, COMPANIES)
  const followingFeed = buildFeed(following, HELPERS, COMPANIES).filter(p => !p.recommended)
  const displayFeed = activeSection === 'siguiendo' ? followingFeed : feed

  const suggestedHelpers = HELPERS.filter(h => !following.includes(h.id) && !following.includes(String(h.id))).slice(0, 4)
  const suggestedCompanies = COMPANIES.filter(c => !following.includes(c.id)).slice(0, 3)

  return (
    <div className={styles.page}>
      {/* Header */}
      <PageHeader rightEl={<button className={styles.notifBtn} onClick={markNotifsRead}><Bell size={18} />{unreadNotifs > 0 && <span className={styles.notifBadge}>{unreadNotifs}</span>}</button>} />

      {/* Section tabs */}
      <div className={styles.sectionTabs}>
        <button
          className={`${styles.sectionTab} ${activeSection === 'para-ti' ? styles.sectionTabActive : ''}`}
          onClick={() => setActiveSection('para-ti')}>
          Para ti
        </button>
        <button
          className={`${styles.sectionTab} ${activeSection === 'siguiendo' ? styles.sectionTabActive : ''}`}
          onClick={() => setActiveSection('siguiendo')}>
          Siguiendo {following.length > 0 && <span className={styles.followingCount}>{following.length}</span>}
        </button>
      </div>

      <div className={styles.content}>

        {/* Suggested to follow */}
        {activeSection === 'para-ti' && (suggestedHelpers.length > 0 || suggestedCompanies.length > 0) && (
          <div className={styles.suggestedSection}>
            <h3 className={styles.suggestedTitle}>Sugerencias para ti</h3>
            <div className={styles.suggestedList}>
              {suggestedHelpers.slice(0,3).map(h => (
                <SuggestedProfile key={h.id} profile={h} type="helper"
                  onFollow={follow} onUnfollow={unfollow} isFollowed={isFollowing(h.id)} />
              ))}
              {suggestedCompanies.slice(0,2).map(c => (
                <SuggestedProfile key={c.id} profile={c} type="company"
                  onFollow={follow} onUnfollow={unfollow} isFollowed={isFollowing(c.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Feed */}
        {displayFeed.length > 0 ? (
          displayFeed.map((post, i) => <PostCard key={`${post.id}-${i}`} post={post} />)
        ) : (
          <div className={styles.emptyFeed}>
            <div className={styles.emptyIcon}>👥</div>
            <h3>Sigue a alguien para ver su actividad</h3>
            <p>Cuando sigas a helpers o empresas, sus publicaciones aparecerán aquí.</p>
            <button className={styles.exploreBtn} onClick={() => setActiveSection('para-ti')}>
              Ver sugerencias
            </button>
          </div>
        )}

        {/* Company profiles section */}
        {activeSection === 'para-ti' && (
          <div className={styles.companiesSection}>
            <h3 className={styles.suggestedTitle}>Empresas en Nüra</h3>
            {COMPANIES.map(c => (
              <div key={c.id} className={styles.companyRow}>
                <div className={styles.companyAvatarWrap}>
                  <div className={styles.companyAvatar} style={{ background: c.avatarColor }}>
                    {c.avatar}
                  </div>
                </div>
                <div className={styles.companyInfo}>
                  <div className={styles.companyName}>{c.name} {c.verified && <span className={styles.verifiedDot}>✓</span>}</div>
                  <div className={styles.companySpec}>{c.specialty}</div>
                  <div className={styles.companyFollowers}>{c.followers.toLocaleString()} seguidores</div>
                </div>
                <button
                  className={isFollowing(c.id) ? styles.followingBtnSmall : styles.followBtnSmall}
                  onClick={() => isFollowing(c.id) ? unfollow(c.id) : follow(c.id)}>
                  {following.includes(c.id) ? '✓' : '+ Seguir'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
