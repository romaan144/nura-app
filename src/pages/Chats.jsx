import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { HELPERS } from '../data/helpers'
import styles from './Chats.module.css'

export default function Chats() {
  const navigate = useNavigate()
  const { chats, markRead } = useUser()

  function formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
    }
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <span className={styles.title}>Conversaciones</span>
        <div style={{width:36}} />
      </header>

      {chats.length === 0 ? (
        <div className={styles.empty}>
          <MessageCircle size={48} color="var(--rule)" />
          <h3>Sin conversaciones todavía</h3>
          <p>Cuando contactes con un helper, la conversación aparecerá aquí.</p>
          <button className={styles.searchBtn} onClick={() => navigate('/')}>Buscar ayuda</button>
        </div>
      ) : (
        <div className={styles.list}>
          {[...chats].reverse().map((chat, i) => {
            const helper = HELPERS.find(h => h.id === chat.helperId)
            return (
              <button key={i} className={styles.chatRow}
                onClick={() => { markRead(chat.helperId); navigate(`/chat/${chat.helperId}`) }}>
                <div className={styles.chatAvatar} style={{background: chat.helperColor}}>
                  {chat.helperAvatar}
                  <span className={styles.onlineDot} />
                </div>
                <div className={styles.chatInfo}>
                  <div className={styles.chatName}>{chat.helperName}</div>
                  <div className={styles.chatLastMsg}>{chat.lastMsg}</div>
                </div>
                <div className={styles.chatMeta}>
                  <span className={styles.chatTime}>{formatTime(chat.lastTime)}</span>
                  {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
