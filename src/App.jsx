import { useState } from 'react'
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
import BottomNav from './components/BottomNav'
import DesktopSidebar from './components/DesktopSidebar'
import ScrollToTop from './components/ScrollToTop'
import OnboardingPage from './pages/Onboarding'
import OnboardingOverlay from './components/OnboardingOverlay'
import MyServices from './pages/MyServices'
import Favorites from './pages/Favorites'
import Toast from './components/Toast'
import PageTransition from './components/PageTransition'
import './index.css'
import AppErrorBoundary from './components/AppErrorBoundary'

function AppRoutes() {
  const [searchState, setSearchState] = useState(null)
  const [showSplash, setShowSplash] = useState(true)
  const location = useLocation()
  const { user } = useUser()
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (user) return false
    return !localStorage.getItem('nura_onboarded')
  })

  const hideNav = ['/login', '/register-helper', '/onboarding']
    .some(p => location.pathname.startsWith(p))

  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingOverlay onComplete={() => {
          localStorage.setItem('nura_onboarded', '1')
          setShowOnboarding(false)
        }} />
      )}

      <ScrollToTop />
      {!hideNav && <DesktopSidebar />}

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

      {!hideNav && <NavBar />}
      {!hideNav && <BottomNav />}
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppErrorBoundary>
  )
}
