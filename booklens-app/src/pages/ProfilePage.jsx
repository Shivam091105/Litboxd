import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ReviewCard from '../components/book/ReviewCard'
import { StatusPill } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { useProfile, useDiary, useChallenge } from '../hooks/useUser'
import { useUserReviews } from '../hooks/useReviews'
import useAuthStore from '../store/authStore'
import styles from './ProfilePage.module.css'

const TABS = ['Overview', 'Diary', 'Reviews', 'Lists', 'Watchlist', 'Network']

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // Use logged-in user's username, or redirect
  const username = user?.username

  const { data: profile, isLoading: profileLoading } = useProfile(username)
  const { data: diaryData, isLoading: diaryLoading }  = useDiary(null, 20)
  const { data: reviewsData }                          = useUserReviews(user?.id)
  const { data: challenge }                            = useChallenge()

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 40px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Your profile
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Sign in to view and manage your profile.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'var(--accent-green)', color: '#0d0f0e', border: 'none',
            borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer'
          }}
        >
          Sign in
        </button>
      </div>
    )
  }

  const diaryItems   = Array.isArray(diaryData)   ? diaryData   : diaryData?.content   ?? []
  const reviewItems  = Array.isArray(reviewsData)  ? reviewsData : reviewsData?.content  ?? []

  // Build display name initials
  const initials = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : username?.slice(0, 2).toUpperCase() ?? 'BL'

  return (
    <div>
      {/* Banner */}
      <div className={styles.banner} />

      {/* Profile header */}
      <div className={styles.headerWrap}>
        <div className={styles.headerInner}>
          <div className={styles.avatarXl}>{initials}</div>
          <div className={styles.identity}>
            {profileLoading ? (
              <>
                <Skeleton height="26px" width="200px" style={{ marginBottom: 8 }} />
                <Skeleton height="13px" width="120px" />
              </>
            ) : (
              <>
                <div className={styles.name}>{profile?.displayName || username}</div>
                <div className={styles.handle}>@{profile?.username || username}</div>
                {profile?.bio && <div className={styles.bio}>{profile.bio}</div>}
              </>
            )}
          </div>
          <div className={styles.actions}>
            <button className={styles.btnOutline} type="button">Edit profile</button>
            <Link to="/log" className={styles.btnPrimary}>+ Log book</Link>
          </div>
        </div>
      </div>

      {/* Sticky tab bar */}
      <div className={styles.tabBar}>
        <div className={styles.tabBarInner}>
          {TABS.map(t => (
            <button
              key={t}
              type="button"
              className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === 'Overview' && (
        <div className={styles.body}>
          <div className={styles.main}>

            {/* Stats grid */}
            <div className={styles.statsGrid}>
              {profileLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={styles.statBox}>
                      <Skeleton height="26px" width="60px" style={{ margin: '0 auto 6px' }} />
                      <Skeleton height="11px" width="50px" style={{ margin: '0 auto' }} />
                    </div>
                  ))
                : [
                    ['Books',     profile?.booksRead     ?? 0],
                    ['Reviews',   profile?.reviewsCount  ?? 0],
                    ['Lists',     profile?.listsCount    ?? 0],
                    ['Followers', profile?.followersCount ?? 0],
                    ['Following', profile?.followingCount ?? 0],
                  ].map(([label, val]) => (
                    <div key={label} className={styles.statBox}>
                      <div className={styles.sbNum}>{val}</div>
                      <div className={styles.sbLabel}>{label}</div>
                    </div>
                  ))
              }
            </div>

            {/* Recent reads */}
            <div className={styles.subHeader}>
              <h3 className={styles.subTitle}>Recent reads</h3>
              <button className={styles.subLink} onClick={() => setActiveTab('Diary')}>View diary →</button>
            </div>
            <div className={styles.recentCovers} style={{ marginBottom: 32 }}>
              {diaryLoading
                ? Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} width="64px" height="96px" borderRadius="6px" />
                  ))
                : diaryItems.slice(0, 7).map(log => (
                    log.bookCoverUrl ? (
                      <img
                        key={log.id}
                        src={log.bookCoverUrl}
                        alt={log.bookTitle}
                        className={styles.rCover}
                        style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 6 }}
                        onError={e => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div
                        key={log.id}
                        className={`${styles.rCover} bc${((log.bookExternalId?.charCodeAt(2) ?? 1) % 8) + 1}`}
                        title={log.bookTitle}
                      />
                    )
                  ))
              }
            </div>

            {/* Reading challenge */}
            {challenge && (
              <>
                <div className={styles.subHeader} style={{ marginTop: 8 }}>
                  <h3 className={styles.subTitle}>Reading challenge {new Date().getFullYear()}</h3>
                </div>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 32
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700 }}>
                      {challenge.booksRead}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'flex-end' }}>
                      / {challenge.goal || 36} books
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: 'linear-gradient(90deg, var(--accent-green), #00e085)',
                      width: `${Math.min(100, challenge.percent)}%`,
                      transition: 'width 1s ease',
                      boxShadow: '0 0 8px rgba(0,200,117,0.4)'
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {challenge.percent}% complete
                  </div>
                </div>
              </>
            )}

            {/* Recent reviews */}
            <div className={styles.subHeader}>
              <h3 className={styles.subTitle}>Recent reviews</h3>
              <button className={styles.subLink} onClick={() => setActiveTab('Reviews')}>All reviews →</button>
            </div>
            <div className={styles.reviewsList}>
              {reviewItems.slice(0, 2).map(r => (
                <ReviewCard key={r.id} review={normaliseReview(r)} />
              ))}
              {reviewItems.length === 0 && !diaryLoading && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  No reviews yet. <Link to="/log" style={{ color: 'var(--accent-green)' }}>Log a book</Link> to write one.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.widget}>
              <div className={styles.widgetTitle}>Favourite books</div>
              <div className={styles.favGrid}>
                {diaryItems.slice(0, 4).map(log => (
                  log.bookCoverUrl ? (
                    <img key={log.id} src={log.bookCoverUrl} alt={log.bookTitle} className={styles.favCover} style={{ objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                  ) : (
                    <div key={log.id} className={`${styles.favCover} bc${((log.bookExternalId?.charCodeAt(2) ?? 1) % 8) + 1}`} />
                  )
                ))}
                {Array.from({ length: Math.max(0, 4 - diaryItems.slice(0, 4).length) }).map((_, i) => (
                  <div key={`empty-${i}`} className={styles.favCover} style={{
                    background: 'var(--bg-elevated)', border: '1px dashed var(--border-light)'
                  }} />
                ))}
              </div>
            </div>

            <div className={styles.widget}>
              <div className={styles.widgetTitle}>Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {profile?.location && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    📍 {profile.location}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Member since {profile?.memberSince
                    ? new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: DIARY ── */}
      {activeTab === 'Diary' && (
        <div className={styles.tabContent}>
          <div className={styles.subHeader}><h3 className={styles.subTitle}>Reading diary</h3></div>
          {diaryLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading diary…</p>
          ) : diaryItems.length > 0 ? (
            <div className={styles.diaryList}>
              {diaryItems.map(log => (
                <div key={log.id} className={styles.diaryItem}>
                  {log.bookCoverUrl ? (
                    <img src={log.bookCoverUrl} alt={log.bookTitle} className={styles.diaryCover} style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 5 }} onError={e => e.target.style.display='none'} />
                  ) : (
                    <div className={`${styles.diaryCover} bc${((log.bookExternalId?.charCodeAt(2) ?? 1) % 8) + 1}`} />
                  )}
                  <div className={styles.diaryInfo}>
                    <div className={styles.diaryTitle}>{log.bookTitle || log.bookExternalId}</div>
                    <div className={styles.diaryAuthor}>{log.bookAuthor}</div>
                    <div className={styles.diaryRating}>
                      {log.rating ? '★'.repeat(Math.round(log.rating)) : '—'}
                    </div>
                    <div className={styles.diaryDate}>
                      {log.finishedAt ? `Finished ${formatDate(log.finishedAt)}` :
                       log.startedAt  ? `Started ${formatDate(log.startedAt)}`   :
                       `Added ${formatDate(log.updatedAt)}`}
                    </div>
                  </div>
                  <StatusPill status={log.status} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
              No books logged yet. <Link to="/log" style={{ color: 'var(--accent-green)' }}>Log your first book →</Link>
            </p>
          )}
        </div>
      )}

      {/* ── TAB: REVIEWS ── */}
      {activeTab === 'Reviews' && (
        <div className={styles.tabContent}>
          <div className={styles.subHeader}>
            <h3 className={styles.subTitle}>Reviews</h3>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{reviewItems.length} total</span>
          </div>
          {reviewItems.length > 0 ? (
            <div className={styles.reviewsGrid}>
              {reviewItems.map(r => <ReviewCard key={r.id} review={normaliseReview(r)} />)}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
              No reviews yet.
            </p>
          )}
        </div>
      )}

      {/* ── PLACEHOLDER TABS ── */}
      {['Lists', 'Watchlist', 'Network'].includes(activeTab) && (
        <div className={styles.emptyTab}>
          <div className={styles.emptyTitle}>{activeTab}</div>
          <div className={styles.emptyDesc}>
            {activeTab === 'Lists'     && 'Create curated lists of books to share with others.'}
            {activeTab === 'Watchlist' && "Books you've saved to read later."}
            {activeTab === 'Network'   && 'People you follow and your followers.'}
          </div>
        </div>
      )}
    </div>
  )
}

function normaliseReview(r) {
  return {
    id:          r.id,
    bookTitle:   r.book?.title,
    bookAuthor:  r.book?.author,
    coverColor:  'bc' + ((r.book?.id % 8) + 1),
    username:    r.user?.username,
    userInitial: r.user?.username?.[0]?.toUpperCase() ?? '?',
    userColor:   'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
    rating:      r.rating ? Math.round(r.rating / 2) : 5,
    text:        r.content,
    likes:       r.likesCount ?? 0,
    date:        r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) : '',
    isPopular: (r.likesCount ?? 0) > 50,
  }
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
