import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LogBookPage from './pages/LogBookPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import BrowsePage from './pages/BrowsePage'
import SearchPage from './pages/SearchPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/"        element={<HomePage />} />
        <Route path="/log"     element={<LogBookPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/browse"  element={<BrowsePage />} />
        <Route path="/search"  element={<SearchPage />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
