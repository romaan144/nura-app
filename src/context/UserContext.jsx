import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [chats, setChats] = useState([])
  const [ratings, setRatings] = useState([])
  const [searchHistory, setSearchHistory] = useState([])
  const [contactedHelpers, setContactedHelpers] = useState([])
  const [helpersCache, setHelpersCache] = useState({})

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
  }, [])

  function login(userData) {
    setUser(userData)
    localStorage.setItem('nura_user', JSON.stringify(userData))
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('nura_user')
  }

  function addChat(helperId, helperName, helperColor, helperAvatar, lastMsg) {
    const existing = chats.find(c => c.helperId === helperId)
    let updated
    if (existing) {
      updated = chats.map(c => c.helperId === helperId
        ? { ...c, lastMsg, lastTime: new Date().toISOString(), unread: (c.unread || 0) + 1 }
        : c)
    } else {
      updated = [...chats, {
        helperId, helperName, helperColor, helperAvatar,
        lastMsg, lastTime: new Date().toISOString(), unread: 0,
      }]
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
    if (!contactedHelpers.includes(helperId)) {
      const c = [...contactedHelpers, helperId]
      setContactedHelpers(c)
      localStorage.setItem('nura_contacted', JSON.stringify(c))
    }
  }

  function addSearch(query) {
    const updated = [{ query, date: new Date().toISOString() }, ...searchHistory].slice(0, 10)
    setSearchHistory(updated)
    localStorage.setItem('nura_history', JSON.stringify(updated))
  }

  function addRating(helperId, rating, comment) {
    const updated = [...ratings, { helperId, rating, comment, date: new Date().toISOString() }]
    setRatings(updated)
    localStorage.setItem('nura_ratings', JSON.stringify(updated))
  }

  function hasRated(helperId) {
    return ratings.some(r => r.helperId === helperId)
  }

  function cacheHelpers(helpers) {
    const map = {}
    helpers.forEach(h => { map[h.id] = h })
    setHelpersCache(prev => ({ ...prev, ...map }))
  }

  return (
    <UserContext.Provider value={{ user, login, logout, chats, addChat, markRead, ratings, addRating, hasRated, searchHistory, addSearch, contactedHelpers, helpersCache, cacheHelpers }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
