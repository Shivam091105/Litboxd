import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LogBookPage from './pages/LogBookPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import BrowsePage from './pages/BrowsePage'
import SearchPage from './pages/SearchPage'
import BookDetailPage from './pages/BookDetailPage'
import MembersPage from './pages/MembersPage'
import ListsPage from './pages/ListsPage'
import ErrorBoundary from './components/ui/ErrorBoundary'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
      <Route element={<Layout />}>
        <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
        <Route path="/log" element={<ErrorBoundary><LogBookPage /></ErrorBoundary>} />
        <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
        <Route path="/profile/:username" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
        <Route path="/browse" element={<ErrorBoundary><BrowsePage /></ErrorBoundary>} />
        <Route path="/search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
        <Route path="/book/:externalId" element={<ErrorBoundary><BookDetailPage /></ErrorBoundary>} />
        <Route path="/members" element={<ErrorBoundary><MembersPage /></ErrorBoundary>} />
        <Route path="/lists" element={<ErrorBoundary><ListsPage /></ErrorBoundary>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}