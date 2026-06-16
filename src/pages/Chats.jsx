import PageHeader from '../components/PageHeader'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MessageCircle } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { HELPERS } from '../data/helpers'
import styles from './Chats.module.css'

function formatChatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const now = new Date()
  const diffMins  = Math.floor((now - d) / 60000)
  const diffHours = Math.floor((now - d) / 3600000)
  const diffDays  = Math.floor((now - d) / 86400000)
  if (diffMins  <  1) return 'ahora'
  if (diffMins  < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays  <  7) return `${diffDays}d`
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function Chats() {
  const navigate = useNavigate()
  const { chats, markRead, helpersCache, user } = useUser()
  const [search, setSearch] = useState('')

  function getHelper(id) {
    return helpersCache?.[id]
      || helpersCache?.[parseInt(id)]
      || HELPERS.filter(Boolean).find(h => String(h.id) === String(id))
  }

  // Only real chats — no mock data
  const realChats = (chats || []).filter(Boolean)
  const filtered = search.trim()
    ? realChats.filter(c =>
        c.helperName?.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMsg?.toLowerCase().includes(search.toLowerCase())
      )
    : realChats

  return (
    <div className={styles.page}>
      <PageHeader />

      {/* Search */}
      {realChats.length > 0 && (
        <div className={styles.searchWrap}>
          <div className={styles.searchBox}>
            <Search size={14} color="rgba(0,0,0,0.35)" />
            <input
              className={styles.searchInput}
              placeholder="Buscar conversaciones..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className={styles.list}>
        {realChats.length === 0 ? (
          /* ── Empty state ───────────────────────────────────────────── */
          <div className={styles.empty}>
            <div className={styles.emptyIso}>
              <img src="/logo-iso.png" alt="Nüra" style={{width:'48px',height:'48px',objectFit:'contain',opacity:0.35}} />
            </div>
            <h3 className={styles.emptyTitle}>
              {user ? `Hola, ${user.name?.split(' ')?.[0] || user.name}` : 'Sin conversaciones'}
            </h3>
            <p className={styles.emptyDesc}>
              Cuando contactes con un profesional a través de Nüra, la conversación aparecerá aquí.
            </p>
            <button
              className={styles.emptyBtn}
              onClick={() => navigate('/')}>
              <MessageCircle size={15} />
              Buscar con Nüra
            </button>
            <button
              className={styles.emptyBtnSecondary}
              onClick={() => navigate('/explore')}>
              Explorar profesionales
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p style={{color:'rgba(0,0,0,0.4)',fontSize:'14px'}}>
              Sin resultados para "{search}"
            </p>
          </div>
        ) : (
          filtered.map((chat, i) => {
            const helper = getHelper(chat.helperId)
            return (
              <button
                key={i}
                className={`${styles.chatRow} ${chat.unread > 0 ? styles.chatUnread : ''}`}
                onClick={() => {
                  markRead?.(chat.helperId)
                  navigate(`/chat/${chat.helperId}`, helper ? { state: { helper } } : {})
                }}>

                <div className={styles.avatarWrap}>
                  {helper?.avatarUrl || chat.avatarUrl
                    ? <img
                        src={helper?.avatarUrl || chat.avatarUrl}
                        alt={chat.helperName}
                        className={styles.avatarImg}
                      />
                    : <div className={styles.avatar} style={{background: chat.helperColor || '#1A56DB'}}>
                        {chat.helperAvatar || chat.helperName?.[0] || '?'}
                      </div>
                  }
                  <span className={styles.onlineDot} />
                </div>

                <div className={styles.chatInfo}>
                  <div className={styles.chatTop}>
                    <span className={styles.chatName}>{chat.helperName}</span>
                    <span className={styles.chatTime}>{formatChatTime(chat.lastTime)}</span>
                  </div>
                  <div className={styles.chatBottom}>
                    <span className={styles.chatLastMsg}>{chat.lastMsg}</span>
                    {chat.unread > 0 && (
                      <span className={styles.unreadBadge}>{chat.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
