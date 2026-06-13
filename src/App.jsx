import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useUser } from './context/UserContext'

import Splash from './pages/Splash'
import Home from './pages/Home'
import Results from './pages/Results'
import HelperProfile from './pages/HelperProfile'
import Chat from './pages/Chat'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Chats from './pages/Chats'
import RegisterHelper from './pages/RegisterHelper'
import HowItWorks from './pages/HowItWorks'
import Explore from './pages/Explore'
import Feed from './pages/Feed'
import NotFound from './pages/NotFound'
import NavBar from './components/NavBar'
import Toast from './components/Toast'
import PageTransition from './components/PageTransition'
import './index.css'

function AppRoutes({ showSplash }) {
  const [searchState, setSearchState] = useState(null)
  const location = useLocation()
  const { user } = useUser()

  const hideNav = ['/login', '/register-helper', '/splash']
    .some(p => location.pathname.startsWith(p))

  return (
    <>
      {showSplash && <Splash />}
      <PageTransition>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home setSearchState={setSearchState} />} />
          <Route path="/results" element={
            searchState ? <Results searchState={searchState} setSearchState={setSearchState} />
              : <Navigate to="/" />
          } />
          <Route path="/helper/:id" element={<HelperProfile />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/register-helper" element={<RegisterHelper />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/feed" element={<Feed />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
      {!hideNav && <NavBar />}
      <Toast />
    </>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2400)
    return () => clearTimeout(t)
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes showSplash={showSplash} />
    </BrowserRouter>
  )
}
