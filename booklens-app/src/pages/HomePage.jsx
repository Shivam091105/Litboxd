import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BookCard from '../components/book/BookCard'
import ReviewCard from '../components/book/ReviewCard'
import ActivityItem from '../components/feed/ActivityItem'
import { ReadingChallenge, GenreFilter, WhoToFollow, TrendingLists } from '../components/feed/Sidebar'
import SectionHeader from '../components/ui/SectionHeader'
import { BookCardSkeleton, ReviewCardSkeleton, ActivityItemSkeleton } from '../components/ui/Skeleton'
import { usePopularBooks } from '../hooks/useBooks'
import { usePopularReviews } from '../hooks/useReviews'
import { useFeed, useChallenge, useRecommendations } from '../hooks/useUser'
import useAuthStore from '../store/authStore'
import { nowReading } from '../data/mockData'   // still static — not a user-specific endpoint
import styles from './HomePage.module.css'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  // ── Real API data ──────────────────────────────────────────────────────
  const { data: popularBooksData, isLoading: booksLoading } = usePopularBooks(7)
  const { data: popularReviewsData, isLoading: reviewsLoading } = usePopularReviews(6)
  const { data: feedData, isLoading: feedLoading } = useFeed(10)
  const { data: challengeData } = useChallenge()
  const { data: recommendations } = useRecommendations()

  // Normalise paginated API response vs plain array
  const popularBooks = Array.isArray(popularBooksData)
    ? popularBooksData
    : popularBooksData?.content ?? []

  const popularReviews = Array.isArray(popularReviewsData)
    ? popularReviewsData
    : popularReviewsData?.content ?? []

  const feedItems = Array.isArray(feedData)
    ? feedData
    : feedData?.content ?? []

  return (
    <div>
      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />
        <div className={styles.heroInner}>
          <div className={`${styles.heroLeft} fade-up`}>
            <div className={styles.heroLabel}>
              <span className={styles.labelDot} />
              Social reading, reimagined
            </div>
            <h1 className={styles.heroH}>
              Track every book<br />you've ever <em>loved.</em>
            </h1>
            <p className={styles.heroSub}>
              BookLens is the home for readers. Log, rate, and review every book
              you read. Discover what friends are reading. Build your literary identity.
            </p>
            <div className={styles.heroCta}>
              {isAuthenticated ? (
                <button className={styles.btnPrimary} onClick={() => navigate('/log')}>
                  Log a book →
                </button>
              ) : (
                <>
                  <button className={styles.btnPrimary} onClick={() => navigate('/login')}>
                    Get started — it's free
                  </button>
                  <button className={styles.btnOutline}>Explore books</button>
                </>
              )}
            </div>
            <div className={styles.heroStats}>
              <div><div className={styles.statNum}>Log</div><div className={styles.statLabel}></div></div>
              <div><div className={styles.statNum}>Review</div><div className={styles.statLabel}></div></div>
              <div><div className={styles.statNum}>Immerse</div><div className={styles.statLabel}></div></div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={`${styles.spine} ${styles.bs6}`}>प्रेमचंद</div>
            <div className={`${styles.spine} ${styles.bs4}`}>DOSTOEVSKY</div>
            <div className={`${styles.spine} ${styles.bs2}`}>KAFKA</div>
            <div className={`${styles.spine} ${styles.bs3}`}>TOLSTOY</div>
            <div className={`${styles.spine} ${styles.bs7}`}>ORWELL</div>
            <div className={`${styles.spine} ${styles.bs1}`}>AUSTEN</div>
            <div className={`${styles.spine} ${styles.bs5}`}>価ア鋭</div>
          </div>
        </div>
      </section>

      {/* ── NOW READING BAR ── */}
      <div className={styles.crBar}>
        <span className={styles.crLabel}>Now reading</span>
        <div className={styles.crDivider} />
        <div className={styles.crScroll}>
          {nowReading.map((r, i) => (
            <div key={i} className={styles.crItem} onClick={() => navigate('/members')}>
              <div className={`${styles.crCover} ${r.coverColor}`} />
              <span className={styles.crText}>
                <strong>{r.user}</strong> — {r.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── POPULAR BOOKS ── */}
      <div className={styles.section}>
        <SectionHeader title="Popular this week" linkLabel="Browse all →" onLinkClick={() => navigate('/browse')} />
        <div className={styles.booksGrid}>
          {booksLoading
            ? Array.from({ length: 7 }).map((_, i) => <BookCardSkeleton key={i} />)
            : popularBooks.length > 0
              ? popularBooks.map((book, i) => <BookCard key={book.externalId ?? book.id ?? i} book={book} />)
              : <EmptyState message="No books yet. Be the first to log one!" />
          }
        </div>
      </div>

      {/* ── RECOMMENDATIONS (only shown to logged-in users who have ratings) ── */}
      {isAuthenticated && recommendations?.length > 0 && (
        <RecommendationsSection recommendations={recommendations} navigate={navigate} />
      )}

      {/* ── FEED + SIDEBAR ── */}
      <div className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.feedLayout}>
          <div>
            <SectionHeader
              title={isAuthenticated ? 'Friend activity' : 'Recent activity'}
              linkLabel="Following · You →"
              onLinkClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
            />
            <div>
              {feedLoading
                ? Array.from({ length: 4 }).map((_, i) => <ActivityItemSkeleton key={i} />)
                : feedItems.length > 0
                  ? feedItems.map(item => <ActivityItem key={item.id} item={normaliseLog(item)} />)
                  : <FeedEmpty isAuthenticated={isAuthenticated} navigate={navigate} />
              }
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            {isAuthenticated && challengeData && (
              <ReadingChallenge
                current={challengeData.booksRead}
                goal={challengeData.goal || 36}
              />
            )}
            <GenreFilter />
            {/* <WhoToFollow /> */}
            <TrendingLists />
          </div>
        </div>
      </div>

      {/* ── POPULAR REVIEWS ── */}
      <div className={`${styles.section} ${styles.sectionBorder}`}>
        <SectionHeader title="Popular reviews this week" linkLabel="All reviews →" onLinkClick={() => navigate('/browse')} />
        <div className={styles.reviewsGrid}>
          {reviewsLoading
            ? Array.from({ length: 3 }).map((_, i) => <ReviewCardSkeleton key={i} />)
            : popularReviews.length > 0
              ? popularReviews.map(r => <ReviewCard key={r.id} review={normaliseReview(r)} />)
              : <EmptyState message="No reviews yet this week." />
          }
        </div>
      </div>
    </div>
  )
}

// ── Helpers: normalise backend shape → component props ────────────────────────
function normaliseLog(log) {
  // Backend BookLogDto uses flat fields: bookTitle, bookAuthor, bookExternalId, bookCoverUrl, username
  const username = log.username ?? log.user?.username ?? 'Anonymous'
  const bookTitle = log.bookTitle ?? log.book?.title ?? 'a book'
  const bookAuthor = log.bookAuthor ?? log.book?.author ?? ''
  const bookExternalId = log.bookExternalId ?? log.book?.externalId ?? null
  const bookCoverUrl = log.bookCoverUrl ?? log.book?.coverUrl ?? null
  const rating = log.rating ?? null
  const status = log.status ?? 'READ'

  // Determine action verb based on status
  const actionVerb = status === 'WANT' ? 'wants to read'
    : status === 'READING' ? 'started reading'
      : 'logged'

  // Build star display for rating
  const starDisplay = rating ? ' ' + '★'.repeat(Math.round(rating)) : ''

  return {
    id: log.id,
    userInitial: username[0]?.toUpperCase() ?? '?',
    userColor: 'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
    username,
    action: (
      <>
        <strong>{username}</strong> {actionVerb}{' '}
        {bookExternalId
          ? <a href={`/book/${bookExternalId}`}>{bookTitle}</a>
          : <span>{bookTitle}</span>
        }
        {starDisplay && <span style={{ color: 'var(--accent-green)', marginLeft: 6 }}>{starDisplay}</span>}
      </>
    ),
    bookMini: {
      title: bookTitle,
      author: bookAuthor,
      coverUrl: bookCoverUrl,
      coverColor: 'bc' + ((typeof log.id === 'number' ? log.id % 8 : 0) + 1),
      rating: rating ? Math.round(rating) : null,
    },
    time: formatTime(log.updatedAt ?? log.createdAt),
    likes: 0,
  }
}

function normaliseReview(r) {
  // ReviewDto uses flat fields: bookTitle, bookAuthor, username (no nested .book/.user)
  const username = r.username ?? r.user?.username ?? 'Anonymous'
  const colIdx = (s => { if (!s) return 1; let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return (h % 8) + 1 })(r.bookExternalId)
  return {
    id: r.id,
    bookTitle: r.bookTitle ?? r.book?.title ?? 'Unknown book',
    bookAuthor: r.bookAuthor ?? r.book?.author ?? '',
    bookCoverUrl: r.bookCoverUrl ?? null,
    bookExternalId: r.bookExternalId ?? null,
    coverColor: 'bc' + colIdx,
    username,
    userInitial: (username)[0]?.toUpperCase() ?? '?',
    userColor: 'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
    rating: r.rating ?? 0,
    text: r.content ?? '',
    likes: r.likesCount ?? 0,
    date: formatDate(r.createdAt),
    isPopular: (r.likesCount ?? 0) > 50,
  }
}

function formatTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return formatDate(iso)
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Empty states ──────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
      {message}
    </p>
  )
}

function FeedEmpty({ isAuthenticated, navigate }) {
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
        <p style={{ marginBottom: 12 }}>Sign in to see what your friends are reading.</p>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'var(--accent-green)', color: '#0d0f0e',
            border: 'none', borderRadius: 20, padding: '8px 20px',
            fontWeight: 600, fontSize: 13, cursor: 'pointer'
          }}
        >
          Sign in
        </button>
      </div>
    )
  }
  return (
    <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
      Follow some readers to see their activity here.
    </p>
  )
}
/* ── Recommendations section with scroll-row + expand ─────────────────────── */
function RecommendationsSection({ recommendations, navigate }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.section} style={{ paddingTop: 0 }}>
      <SectionHeader
        title="Recommended for you"
        linkLabel={expanded ? 'Show less ↑' : 'See all →'}
        onLinkClick={() => setExpanded(p => !p)}
      />

      {expanded ? (
        /* Full grid — all recommendations */
        <div className={styles.booksGrid}>
          {recommendations.map((rec, i) => (
            <BookCard
              key={rec.externalId ?? i}
              book={{
                externalId: rec.externalId,
                title: rec.title,
                author: rec.author,
                coverUrl: rec.coverUrl,
                coverUrlSmall: rec.coverUrlSmall,
                coverColor: 'bc' + ((i % 8) + 1),
                averageRating: rec.averageRating,
                ratingsCount: rec.ratingsCount,
              }}
              badge={rec.reason}
            />
          ))}
        </div>
      ) : (
        /* Horizontal scroll row — same pattern as BrowsePage genre rows */
        <div className={styles.recScroll}>
          {recommendations.map((rec, i) => (
            <div key={rec.externalId ?? i} className={styles.recScrollItem}>
              <BookCard
                book={{
                  externalId: rec.externalId,
                  title: rec.title,
                  author: rec.author,
                  coverUrl: rec.coverUrl,
                  coverUrlSmall: rec.coverUrlSmall,
                  coverColor: 'bc' + ((i % 8) + 1),
                  averageRating: rec.averageRating,
                  ratingsCount: rec.ratingsCount,
                }}
                badge={rec.reason}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}