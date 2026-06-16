import PageHeader from '../components/PageHeader'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { HELPERS } from '../data/helpers'

import styles from './Chats.module.css'

// Mock chat history para demo
const MOCK_CHATS = [
  {
    helperId: 1,
    helperName: "Carlos Martínez",
    avatarUrl: "https://api.dicebear.com/9.x/personas/svg?seed=carlos",
    helperColor: "#1A56DB",
    helperAvatar: "CM",
    lastMsg: "Perfecto, quedamos el lunes a las 10h. Le espero en consulta 😊",
    lastTime: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    unread: 1,
  },
  {
    helperId: 5,
    helperName: "Elena Fernández",
    avatarUrl: "https://api.dicebear.com/9.x/personas/svg?seed=elena",
    helperColor: "#059669",
    helperAvatar: "EF",
    lastMsg: "Sí, puedo empezar esta semana. ¿El miércoles por la mañana le viene bien?",
    lastTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    unread: 0,
  },
  {
    helperId: 3,
    helperName: "Roberto Sánchez",
    avatarUrl: "https://api.dicebear.com/9.x/personas/svg?seed=roberto",
    helperColor: "#1E40AF",
    helperAvatar: "RS",
    lastMsg: "Ya he revisado la caldera. Era el termostato. Todo solucionado 👍",
    lastTime: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    unread: 0,
  },
  {
    helperId: 7,
    helperName: "Lucía Vidal",
    avatarUrl: "https://api.dicebear.com/9.x/personas/svg?seed=lucia",
    helperColor: "#DB2777",
    helperAvatar: "LV",
    lastMsg: "Claro, puedo dar clases online también. ¿Qué días le vienen mejor a tu hijo?",
    lastTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unread: 0,
  },
  {
    helperId: 4,
    helperName: "María López",
    avatarUrl: "https://api.dicebear.com/9.x/personas/svg?seed=maria",
    helperColor: "#7C3AED",
    helperAvatar: "ML",
    lastMsg: "Hasta el jueves que viene entonces. Que tenga buena semana 🌸",
    lastTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    unread: 0,
  },
]

export default function Chats() {
  const navigate = useNavigate()
  const { chats, markRead, helpersCache } = useUser()
  function getHelper(id) {
    return helpersCache?.[id] || helpersCache?.[parseInt(id)] || HELPERS.filter(Boolean).find(h => String(h.id) === String(id))
  }
  const [search, setSearch] = useState('')

  // Merge real chats with mock, real ones take priority
  const allChats = (chats.length > 0 ? [...MOCK_CHATS.filter(m => !(chats||[]).find(c => c.helperId === m.helperId)), ...chats] : MOCK_CHATS).filter(Boolean)
  const filtered = allChats.filter(c =>
    c.helperName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMsg.toLowerCase().includes(search.toLowerCase())
  )

  function formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = now - d
    if (diff < 1000 * 60) return 'Ahora'
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / 60000)}m`
    if (d.toDateString() === now.toDateString()) return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
    if (diff < 1000 * 60 * 60 * 48) return 'Ayer'
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return (
    <div className={styles.page}>
      <PageHeader />

      {/* Search */}
      <div className={styles.searchWrap}>
        <div className={styles.searchBox}>
          <Search size={14} color="var(--soft)" />
          <input
            className={styles.searchInput}
            placeholder="Buscar conversaciones..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>Sin resultados para "{search}"</p>
          </div>
        ) : (
          filtered.map((chat, i) => {
            const helper = helpersCache?.[chat.helperId] || HELPERS.filter(Boolean).find(h => String(h.id) === String(chat.helperId))
            return (
              <button key={i} className={`${styles.chatRow} ${chat.unread > 0 ? styles.chatUnread : ''}`}
                onClick={() => { const h = getHelper(chat.helperId); markRead?.(chat.helperId); navigate(`/chat/${chat.helperId}`, h ? { state: { helper: h } } : {}) }}>

                <div className={styles.avatarWrap}>
                  {helper?.avatarUrl
                    ? <img src={helper.avatarUrl} alt={chat.helperName} className={styles.avatarImg} />
                    : <div className={styles.avatar} style={{background: chat.helperColor}}>{chat.helperAvatar}</div>
                  }
                  <span className={styles.onlineDot} />
                </div>

                <div className={styles.chatInfo}>
                  <div className={styles.chatTop}>
                    <span className={styles.chatName}>{chat.helperName}</span>
                    <span className={styles.chatTime}>{formatTime(chat.lastTime)}</span>
                  </div>
                  <div className={styles.chatBottom}>
                    <span className={styles.chatLastMsg}>{chat.lastMsg}</span>
                    {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
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
