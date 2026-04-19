import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Sidebar.module.css'

/* ── Reading Challenge Widget ── */
export function ReadingChallenge({ current, goal, year = 2025 }) {
  const pct = Math.min(100, Math.round((current / goal) * 100))
  const onTrack = pct >= 50

  return (
    <div className={styles.widget}>
      <div className={styles.widgetTitle}>{year} Reading Challenge</div>
      <div className={styles.challengeGoal}>
        <span className={styles.challengeCount}>{current}</span>
        <span className={styles.challengeTotal}>/ {goal} books</span>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.challengeLabel}>
        {pct}% complete · {onTrack ? 'on track ✓' : 'behind pace'}
      </div>
    </div>
  )
}

/* ── Genre Tags Widget ── */
const GENRES = [
  'Literary Fiction', 'Science Fiction', 'Mystery', 'Fantasy',
  'Historical', 'Non-Fiction', 'Romance', 'Horror', 'Classics', 'Memoir',
]

export function GenreFilter() {
  const navigate = useNavigate()
  const [active, setActive] = useState(['Literary Fiction'])

  function toggle(g) {
    setActive(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    )
  }

  return (
    <div className={styles.widget}>
      <div className={styles.widgetTitle}>Browse by genre</div>
      <div className={styles.genreTags}>
        {GENRES.map(g => (
          <button
            key={g}
            type="button"
            className={`${styles.genreTag} ${active.includes(g) ? styles.genreActive : ''}`}
            onClick={() => { toggle(g); navigate(`/browse?genre=${encodeURIComponent(g)}`) }}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Who to Follow Widget ── */
const SUGGESTIONS = [
  { initial: 'S', color: 'linear-gradient(135deg,#3a1a1a,#220e0e)', name: 'sarah_reads', books: '312 books · literary fiction' },
  { initial: 'J', color: 'linear-gradient(135deg,#1a3a1a,#0e220e)', name: 'jorge_b', books: '847 books · classics' },
  { initial: 'N', color: 'linear-gradient(135deg,#1a1a3a,#0e0e22)', name: 'nonfic_nina', books: '204 books · non-fiction' },
  { initial: 'K', color: 'linear-gradient(135deg,#3a2a1a,#22180e)', name: 'kiran_sf', books: '589 books · sci-fi' },
]

export function WhoToFollow() {
  const navigate = useNavigate()
  const [following, setFollowing] = useState([])

  function toggle(name) {
    setFollowing(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    )
  }

  return (
    <div className={styles.widget}>
      <div className={styles.widgetTitleRow}>
        <div className={styles.widgetTitle}>Readers to follow</div>
        <button className={styles.widgetLink} onClick={() => navigate('/members')}>
          See all →
        </button>
      </div>
      {SUGGESTIONS.map(u => (
        <div
          key={u.name}
          className={styles.userRow}
          onClick={() => navigate('/members')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.userAvatar} style={{ background: u.color }}>{u.initial}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{u.name}</div>
            <div className={styles.userBooks}>{u.books}</div>
          </div>
          <button
            type="button"
            className={`${styles.followBtn} ${following.includes(u.name) ? styles.following : ''}`}
            onClick={(e) => { e.stopPropagation(); toggle(u.name) }}
          >
            {following.includes(u.name) ? 'Following' : 'Follow'}
          </button>
        </div>
      ))}
    </div>
  )
}

/* ── Trending Lists Widget ── */
const LISTS = [
  { id: 'l4', title: 'Booker Prize Winners Tier List', by: 'bookish_dan', count: 62 },
  { id: 'l1', title: 'Books to Read Before 30', by: 'midnight_reader', count: 25 },
  { id: 'l2', title: 'Nobel Prize Winners, Ranked', by: 'literaryleo', count: 118 },
  { id: 'l3', title: 'Translated Fiction Essentials', by: 'world_lit', count: 40 },
]

export function TrendingLists() {
  const navigate = useNavigate()

  return (
    <div className={styles.widget}>
      <div className={styles.widgetTitleRow}>
        <div className={styles.widgetTitle}>Trending lists</div>
        <button className={styles.widgetLink} onClick={() => navigate('/lists')}>
          See all →
        </button>
      </div>
      <div className={styles.listItems}>
        {LISTS.map(l => (
          <div key={l.id} className={styles.listItem} onClick={() => navigate('/lists')}>
            <div className={styles.listTitle}>{l.title}</div>
            <div className={styles.listMeta}>by {l.by} · {l.count} books</div>
          </div>
        ))}
      </div>
    </div>
  )
}