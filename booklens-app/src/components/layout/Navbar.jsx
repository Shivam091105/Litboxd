import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMenuOpen(false)
    }
  }

  function closeMenu() { setMenuOpen(false) }

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? 'BL'

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/browse', label: 'Browse' },
    { to: '/members', label: 'Members' },
    { to: '/lists', label: 'Lists' },
    ...(isAuthenticated ? [{ to: '/log', label: 'Log Book' }] : []),
  ]

  return (
    <>
      <nav className={styles.nav}>
        {/* Logo */}
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          <span className={styles.logoDot} />
          BookLens
        </Link>

        {/* Desktop nav links */}
        <ul className={styles.links}>
          {navLinks.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => isActive ? styles.active : ''}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop right section */}
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
              <Link to="/profile" className={styles.avatar} title={user?.username} onClick={closeMenu}>
                {initials}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.btnOutline} onClick={closeMenu}>Sign in</Link>
              <Link to="/login" className={styles.btnPrimary} onClick={closeMenu}>Join free</Link>
            </>
          )}
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(p => !p)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`${styles.hamburgerLine} ${menuOpen ? styles.hOpen1 : ''}`} />
          <span className={`${styles.hamburgerLine} ${menuOpen ? styles.hOpen2 : ''}`} />
          <span className={`${styles.hamburgerLine} ${menuOpen ? styles.hOpen3 : ''}`} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.mobileOverlay} onClick={closeMenu}>
          <div className={styles.mobileDrawer} onClick={e => e.stopPropagation()}>
            {/* Mobile search */}
            <form className={styles.mobileSearch} onSubmit={handleSearch}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.mobileSearchInput}
                type="text"
                placeholder="Search books, authors…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </form>

            {/* Mobile nav links */}
            <ul className={styles.mobileLinks}>
              {navLinks.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}
                    onClick={closeMenu}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Mobile auth */}
            <div className={styles.mobileAuth}>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className={styles.mobileProfileRow} onClick={closeMenu}>
                    <div className={styles.avatar}>{initials}</div>
                    <div>
                      <div className={styles.mobileUsername}>{user?.displayName || user?.username}</div>
                      <div className={styles.mobileHandle}>@{user?.username}</div>
                    </div>
                  </Link>
                  <button className={styles.mobileSignOut} onClick={handleLogout}>Sign out</button>
                </>
              ) : (
                <div className={styles.mobileAuthBtns}>
                  <Link to="/login" className={styles.mobileBtnOutline} onClick={closeMenu}>Sign in</Link>
                  <Link to="/login" className={styles.mobileBtnPrimary} onClick={closeMenu}>Join free</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}