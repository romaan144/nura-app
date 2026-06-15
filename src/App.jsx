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
import DesktopSidebar from './components/DesktopSidebar'
import ScrollToTop from './components/ScrollToTop'
import OnboardingPage from './pages/Onboarding'
import MyServices from './pages/MyServices'
import Favorites from './pages/Favorites'
import Toast from './components/Toast'
import PageTransition from './components/PageTransition'
import './index.css'

function AppRoutes({ showSplash }) {
  const [searchState, setSearchState] = useState(null)
  const location = useLocation()
  const { user } = useUser()

  const hideNav = ['/login', '/register-helper', '/splash', '/onboarding']
    .some(p => location.pathname.startsWith(p))

  return (
    <>
      {showSplash && <Splash />}
      <ScrollToTop />

      {/* Desktop sidebar — hidden on mobile via CSS */}
      {!hideNav && <DesktopSidebar />}

      {/* Main content */}
      <div className="desktopMain">
        <PageTransition>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home setSearchState={setSearchState} />} />
            <Route path="/results" element={
              searchState
                ? <Results searchState={searchState} setSearchState={setSearchState} />
                : <Navigate to="/" />
            } />
            <Route path="/helper/:id" element={<HelperProfile />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/my-services" element={<MyServices />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
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
      </div>

      {/* Mobile nav — hidden on desktop via CSS */}
      {!hideNav && <NavBar />}
      <Toast />
    </>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
    if (sessionStorage.getItem('nura_splashed')) return false
    sessionStorage.setItem('nura_splashed', '1')
    return true
  })
  useEffect(() => {
    if (!showSplash) return
    const t = setTimeout(() => setShowSplash(false), 2600)
    return () => clearTimeout(t)
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes showSplash={showSplash} />
    </BrowserRouter>
  )
}
