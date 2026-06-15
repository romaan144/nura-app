import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Bookmark, Bell, UserPlus, Check, Sparkles, Award, Shield } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { COMPANIES } from '../data/companies'
import { useUser } from '../context/UserContext'
import PageHeader from '../components/PageHeader'
import { showToast } from '../components/Toast'
import styles from './Feed.module.css'

function buildFeed(following, helpers, companies) {
  const allPosts = []
  const followedHelpers = helpers.filter(h => following.includes(h.id) || following.includes(String(h.id)))
  const followedCompanies = companies.filter(c => following.includes(c.id))
  followedHelpers.forEach(h => { h.posts?.forEach(p => allPosts.push({ ...p, author: h, authorType: 'helper' })) })
  followedCompanies.forEach(c => { c.posts?.forEach(p => allPosts.push({ ...p, author: c, authorType: 'company' })) })
  if (allPosts.length === 0) {
    helpers.slice(0, 4).forEach(h => { h.posts?.slice(0, 1).forEach(p => allPosts.push({ ...p, author: h, authorType: 'helper', recommended: true })) })
    companies.slice(0, 2).forEach(c => { c.posts?.slice(0, 1).forEach(p => allPosts.push({ ...p, author: c, authorType: 'company', recommended: true })) })
  }
  return allPosts.sort(() => Math.random() - 0.3)
}

function PostCard({ post, follow, unfollow, isFollowing }) {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes)
  const [saved, setSaved] = useState(false)
  const author = post.author
  const followed = isFollowing(author.id)

  return (
    <div className={styles.postCard}>
      {post.recommended && (
        <div className={styles.recommendedBadge}><Sparkles size={11} /> Recomendado para ti</div>
      )}
      <div className={styles.postHeader}>
        <div className={styles.authorInfo} onClick={() => post.authorType === 'helper' ? navigate(`/helper/${author.id}`) : null}>
          <div className={styles.authorAvatar} style={{ background: author.avatarColor }}>
            {author.avatarUrl
              ? <img src={author.avatarUrl} alt="" className={styles.authorAvatarImg} />
              : <span>{author.avatar || author.name?.[0]}</span>
            }
          </div>
          <div className={styles.authorMeta}>
            <div className={styles.authorName}>
              {author.name}
              {author.founder && <Award size={12} color='#92400E' style={{marginLeft:'4px',verticalAlign:'middle'}} />}
              {author.verified && !author.founder && <Shield size={11} color='#059669' style={{marginLeft:'4px',verticalAlign:'middle'}} />}
            </div>
            <div className={styles.authorSub}>{post.authorType === 'company' ? author.handle : author.specialty} · {post.date}</div>
          </div>
        </div>
        {!followed
          ? <button className={styles.followBtn} onClick={() => follow(author.id)}><UserPlus size={13} /> Seguir</button>
          : <button className={styles.followingBtn} onClick={() => unfollow(author.id)}><Check size={13} /> Siguiendo</button>
        }
      </div>
      <p className={styles.postText}>{post.text}</p>
      {post.badge && <div className={styles.postBadge}>{post.badge}</div>}
      <div className={styles.postActions}>
        <button className={`${styles.action} ${liked ? styles.actionLiked : ''}`}
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1) }}>
          <Heart size={18} fill={liked ? 'var(--red)' : 'none'} color={liked ? 'var(--red)' : 'var(--soft)'} />
          <span>{likes}</span>
        </button>
        <button className={styles.action}>
          <MessageCircle size={18} color="var(--soft)" /><span>{post.comments}</span>
        </button>
        <button className={styles.action}><Share2 size={18} color="var(--soft)" /></button>
        <button className={`${styles.action} ${styles.actionRight} ${saved ? styles.actionSaved : ''}`} onClick={() => setSaved(s => !s)}>
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
  const { following, follow, unfollow, isFollowing, unreadNotifs, markNotifsRead, notifications } = useUser()

  function followWithToast(id, name) {
    follow(id)
    showToast(`Siguiendo a ${name || 'este perfil'}`)
  }
  function unfollowWithToast(id, name) {
    unfollow(id)
    showToast(`Dejaste de seguir a ${name || 'este perfil'}`)
  }
  const [activeSection, setActiveSection] = useState('para-ti')
  const [showNotifs, setShowNotifs] = useState(false)

  const feed = buildFeed(following, HELPERS, COMPANIES)
  const followingFeed = buildFeed(following, HELPERS, COMPANIES).filter(p => !p.recommended)
  const displayFeed = activeSection === 'siguiendo' ? followingFeed : feed
  const suggestedHelpers = HELPERS.filter(h => !following.includes(h.id) && !following.includes(String(h.id))).slice(0, 4)
  const suggestedCompanies = COMPANIES.filter(c => !following.includes(c.id)).slice(0, 3)

  return (
    <div className={styles.page}>
      <PageHeader />

      <div className={styles.sectionTabs}>
        <div className={styles.sectionTabsInner}>
          <button className={`${styles.sectionTab} ${activeSection === 'para-ti' ? styles.sectionTabActive : ''}`}
            onClick={() => setActiveSection('para-ti')}>Para ti</button>
          <button className={`${styles.sectionTab} ${activeSection === 'siguiendo' ? styles.sectionTabActive : ''}`}
            onClick={() => setActiveSection('siguiendo')}>
            Siguiendo {following.length > 0 && <span className={styles.followingCount}>{following.length}</span>}
          </button>
        </div>
      </div>

      <div className={styles.content}>
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

        {displayFeed.length > 0
          ? displayFeed.map((post, i) => (
              <PostCard key={`${post.id}-${i}`} post={post}
                follow={follow} unfollow={unfollow} isFollowing={isFollowing} />
            ))
          : (
            <div className={styles.emptyFeed}>
              <div className={styles.emptyIcon}>👥</div>
              <h3>Sigue a alguien para ver su actividad</h3>
              <p>Cuando sigas a helpers o empresas, sus publicaciones aparecerán aquí.</p>
              <button className={styles.exploreBtn} onClick={() => setActiveSection('para-ti')}>Ver sugerencias</button>
            </div>
          )
        }

        {activeSection === 'para-ti' && (
          <div className={styles.companiesSection}>
            <h3 className={styles.suggestedTitle}>Empresas en Nüra</h3>
            {COMPANIES.map(c => (
              <div key={c.id} className={styles.companyRow}>
                <div className={styles.companyAvatar} style={{ background: c.avatarColor }}>{c.avatar}</div>
                <div className={styles.companyInfo}>
                  <div className={styles.companyName}>{c.name} {c.verified && <Shield size={11} color='#059669' style={{marginLeft:'3px',verticalAlign:'middle'}} />}</div>
                  <div className={styles.companySpec}>{c.specialty}</div>
                  <div className={styles.companyFollowers}>{c.followers?.toLocaleString()} seguidores</div>
                </div>
                <button
                  className={isFollowing(c.id) ? styles.followingBtnSmall : styles.followBtnSmall}
                  onClick={() => isFollowing(c.id) ? unfollow(c.id) : follow(c.id)}>
                  {isFollowing(c.id) ? '✓' : '+ Seguir'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNotifs && (
        <div className={styles.notifOverlay} onClick={() => setShowNotifs(false)}>
          <div className={styles.notifPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.notifPanelHeader}>
              <span className={styles.notifPanelTitle}>Notificaciones</span>
              <button className={styles.notifClose} onClick={() => setShowNotifs(false)}>✕</button>
            </div>
            {!notifications?.length ? (
              <div className={styles.notifEmpty}>
                <Bell size={28} color="var(--rule)" />
                <p>Sin notificaciones</p>
              </div>
            ) : (
              <div className={styles.notifList}>
                {notifications.slice(0,10).map((n, i) => (
                  <div key={i} className={styles.notifItem}>
                    <div className={styles.notifDot} />
                    <div className={styles.notifText}>{n.type === 'followed' ? 'Empezaste a seguir a alguien' : 'Nueva actividad'}</div>
                    <span className={styles.notifTime}>Hoy</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
