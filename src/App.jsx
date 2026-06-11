import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Results from './pages/Results'
import HelperProfile from './pages/HelperProfile'
import Chat from './pages/Chat'
import './index.css'

export default function App() {
  const [searchState, setSearchState] = useState(null)
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home setSearchState={setSearchState} />} />
        <Route path="/results" element={
          searchState
            ? <Results searchState={searchState} setSearchState={setSearchState} />
            : <Navigate to="/" />
        } />
        <Route path="/helper/:id" element={<HelperProfile />} />
        <Route path="/chat/:id" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}
