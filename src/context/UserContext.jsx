import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def } catch { return def } }
  const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

  const [user, setUser] = useState(() => load('nura_user', null))
  const [chats, setChats] = useState(() => load('nura_chats', []))
  const [ratings, setRatings] = useState(() => load('nura_ratings', []))
  const [searchHistory, setSearchHistory] = useState(() => load('nura_search_history', []))
  const [contactedHelpers, setContactedHelpers] = useState(() => load('nura_contacted', []))
  const [helpersCache, setHelpersCache] = useState({})
  const [following, setFollowing] = useState(() => load('nura_following', []))
  const [notifications, setNotifications] = useState(() => load('nura_notifications', []))
  const [favorites, setFavorites] = useState(() => load('nura_favorites', []))
  const [nuraChatMessages, setNuraChatMessages] = useState(() => load('nura_chat_messages', []))
  const [nuraLastMatches, setNuraLastMatches] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('nura_user')
    if (saved) setUser(JSON.parse(saved))
    const savedChats = localStorage.getItem('nura_chats')
    if (savedChats) setChats(JSON.parse(savedChats))
    const savedRatings = localStorage.getItem('nura_ratings')
    if (savedRatings) setRatings(JSON.parse(savedRatings))
    const savedHistory = localStorage.getItem('nura_history')
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory))
    const savedContacted = localStorage.getItem('nura_contacted')
    if (savedContacted) setContactedHelpers(JSON.parse(savedContacted))
    const savedFollowing = localStorage.getItem('nura_following')
    if (savedFollowing) setFollowing(JSON.parse(savedFollowing))
    const savedNotifs = localStorage.getItem('nura_notifications')
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs))
    const savedFavs = localStorage.getItem('nura_favorites')
    if (savedFavs) setFavorites(JSON.parse(savedFavs))
  }, [])

  // Auto-persist key state
  useEffect(() => { save('nura_user', user) }, [user])
  useEffect(() => { save('nura_chats', chats) }, [chats])
  useEffect(() => { save('nura_ratings', ratings) }, [ratings])
  useEffect(() => { save('nura_search_history', searchHistory) }, [searchHistory])
  useEffect(() => { save('nura_following', following) }, [following])
  useEffect(() => { save('nura_favorites', favorites) }, [favorites])
  useEffect(() => { save('nura_chat_messages', nuraChatMessages) }, [nuraChatMessages])

  function login(userData) {
    setUser(userData)
    localStorage.setItem('nura_user', JSON.stringify(userData))
  }

  function updateUser(updates) {
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('nura_user', JSON.stringify(updated))
  }

  function logout() {
    setUser(null)
    setChats([]); setRatings([]); setSearchHistory([])
    setContactedHelpers([]); setFollowing([]); setNotifications([])
    localStorage.removeItem('nura_user')
    localStorage.removeItem('nura_chats')
    localStorage.removeItem('nura_following')
  }

  function addChat(helperId, helperName, helperColor, helperAvatar, lastMsg) {
    const existing = chats.find(c => c.helperId === helperId)
    let updated
    if (existing) {
      updated = chats.map(c => c.helperId === helperId
        ? { ...c, lastMsg, lastTime: new Date().toISOString(), unread: (c.unread || 0) + 1 }
        : c)
    } else {
      updated = [...chats, { helperId, helperName, helperColor, helperAvatar, lastMsg, lastTime: new Date().toISOString(), unread: 0 }]
    }
    setChats(updated)
    localStorage.setItem('nura_chats', JSON.stringify(updated))
    if (!contactedHelpers.includes(helperId)) {
      const c = [...contactedHelpers, helperId]
      setContactedHelpers(c)
      localStorage.setItem('nura_contacted', JSON.stringify(c))
    }
  }

  function markRead(helperId) {
    const updated = chats.map(c => c.helperId === helperId ? { ...c, unread: 0 } : c)
    setChats(updated)
    localStorage.setItem('nura_chats', JSON.stringify(updated))
  }

  function addRating(helperId, rating, comment) {
    const updated = [...ratings, { helperId, rating, comment, date: new Date().toISOString() }]
    setRatings(updated)
    localStorage.setItem('nura_ratings', JSON.stringify(updated))
  }

  function hasRated(helperId) {
    return ratings.some(r => r.helperId === helperId)
  }

  function addSearch(query) {
    const updated = [{ query, date: new Date().toISOString() }, ...searchHistory].slice(0, 10)
    setSearchHistory(updated)
    localStorage.setItem('nura_history', JSON.stringify(updated))
  }

  function cacheHelpers(helpers) {
    const map = {}
    helpers.forEach(h => { map[h.id] = h })
    setHelpersCache(prev => ({ ...prev, ...map }))
  }

  function follow(id) {
    if (following.includes(id)) return
    const updated = [...following, id]
    setFollowing(updated)
    localStorage.setItem('nura_following', JSON.stringify(updated))
    // Add notification
    const notif = { id: Date.now(), type: 'followed', profileId: id, date: new Date().toISOString(), read: false }
    const updatedNotifs = [notif, ...notifications].slice(0, 50)
    setNotifications(updatedNotifs)
    localStorage.setItem('nura_notifications', JSON.stringify(updatedNotifs))
  }

  function unfollow(id) {
    const updated = following.filter(f => f !== id)
    setFollowing(updated)
    localStorage.setItem('nura_following', JSON.stringify(updated))
  }

  function isFollowing(id) {
    return following.includes(id)
  }

  function toggleFavorite(helperId) {
    const isFav = favorites.includes(helperId)
    const updated = isFav ? favorites.filter(f => f !== helperId) : [...favorites, helperId]
    setFavorites(updated)
    return !isFav
  }
  function isFavorite(helperId) { return favorites.includes(helperId) }

  function markNotifsRead() {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    localStorage.setItem('nura_notifications', JSON.stringify(updated))
  }

  const unreadNotifs = notifications.filter(n => !n.read).length
  const totalUnreadChats = chats.reduce((s, c) => s + (c.unread || 0), 0)

  return (
    <UserContext.Provider value={{
      user, login, logout,
      chats, addChat, markRead, totalUnreadChats,
      ratings, addRating, hasRated,
      searchHistory, addSearch,
      contactedHelpers,
      helpersCache, cacheHelpers,
      following, follow, unfollow, isFollowing,
      notifications, markNotifsRead, unreadNotifs,
      favorites, toggleFavorite, isFavorite,
      nuraChatMessages, setNuraChatMessages,
      nuraLastMatches, setNuraLastMatches,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() { return useContext(UserContext) }
