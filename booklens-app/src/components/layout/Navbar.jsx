import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Get initials for avatar
  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? 'BL'

  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <Link to="/" className={styles.logo}>
        <span className={styles.logoDot} />
        BookLens
      </Link>

      {/* Nav Links */}
      <ul className={styles.links}>
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : ''}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/browse" className={({ isActive }) => isActive ? styles.active : ''}>
            Browse
          </NavLink>
        </li>
        {isAuthenticated && (
          <li>
            <NavLink to="/log" className={({ isActive }) => isActive ? styles.active : ''}>
              Log Book
            </NavLink>
          </li>
        )}
        <li><a href="#">Members</a></li>
      </ul>

      {/* Right section */}
      <div className={styles.right}>
        <form className={styles.search} onSubmit={handleSearch}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Books, authors, genres…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </form>

        {isAuthenticated ? (
          <>
            <button className={styles.btnOutline} onClick={handleLogout}>Sign out</button>
            <Link to="/profile" className={styles.avatar} title={user?.username}>
              {initials}
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.btnOutline}>Sign in</Link>
            <Link to="/login" className={styles.btnPrimary}>Create account</Link>
          </>
        )}
      </div>
    </nav>
  )
}
