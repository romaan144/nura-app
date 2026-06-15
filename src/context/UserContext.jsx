import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [chats, setChats] = useState([])
  const [ratings, setRatings] = useState([])
  const [searchHistory, setSearchHistory] = useState([])
  const [contactedHelpers, setContactedHelpers] = useState([])
  const [helpersCache, setHelpersCache] = useState({})
  const [following, setFollowing] = useState([]) // ids of followed profiles
  const [notifications, setNotifications] = useState([])
  const [favorites, setFavorites] = useState([])
  const [nuraChatMessages, setNuraChatMessages] = useState([])
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

  function login(userData) {
    setUser(userData)
    localStorage.setItem('nura_user', JSON.stringify(userData))
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
    localStorage.setItem('nura_favorites', JSON.stringify(updated))
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
