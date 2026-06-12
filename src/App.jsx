import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useUser } from './context/UserContext'

import Home from './pages/Home'
import Results from './pages/Results'
import HelperProfile from './pages/HelperProfile'
import Chat from './pages/Chat'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Chats from './pages/Chats'
import RegisterHelper from './pages/RegisterHelper'
import HowItWorks from './pages/HowItWorks'
import NotFound from './pages/NotFound'
import NavBar from './components/NavBar'
import './index.css'

function AppRoutes() {
  const [searchState, setSearchState] = useState(null)
  const location = useLocation()

  const hideNav = ['/login', '/register-helper'].some(p => location.pathname.startsWith(p))

  return (
    <>
      <Routes>
        <Route path="/" element={<Home setSearchState={setSearchState} />} />
        <Route path="/results" element={
          searchState ? <Results searchState={searchState} setSearchState={setSearchState} />
            : <Navigate to="/" />
        } />
        <Route path="/helper/:id" element={<HelperProfile />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/register-helper" element={<RegisterHelper />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideNav && <NavBar />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
