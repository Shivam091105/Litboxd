import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { booksApi } from '../api/books'
import { logsApi } from '../api/logs'
import { reviewsApi } from '../api/reviews'
import { keys } from '../api/queryKeys'
import useAuthStore from '../store/authStore'
import StarRating from '../components/ui/StarRating'
import { StatusPill } from '../components/ui/Badge'
import Toast from '../components/ui/Toast'
import styles from './BookDetailPage.module.css'

/* ─────────────────────────────────────────────────────────────────────────────
   BookDetailPage — rebuilt with maximum defensive coding.
   
   All data accesses are guarded. Every array access checks length first.
   No assumptions about API field presence. Crashes are caught at component level.
─────────────────────────────────────────────────────────────────────────────── */

const STATUS_TABS = ['Read', 'Currently Reading', 'Want to Read']
const STATUS_MAP = { 'Read': 'READ', 'Currently Reading': 'READING', 'Want to Read': 'WANT' }

/* Safe helpers — never throw */
function safe(v, fallback = '') {
  if (v === null || v === undefined) return fallback
  return v
}
function safeStr(v) { return typeof v === 'string' ? v : '' }
function safeNum(v, fallback = 0) {
  const n = Number(v)
  return isFinite(n) ? n : fallback
}
function safeArr(v) { return Array.isArray(v) ? v : [] }
function safeRepeat(char, n) {
  const count = Math.max(0, Math.min(10, Math.round(safeNum(n))))
  return char.repeat(count)
}

function colorIndex(str) {
  if (!str) return 1
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return (h % 8) + 1
}

function cleanAuthor(v) {
  if (!v) return null
  const s = String(v).trim()
  if (!s || s === 'Unknown Author' || s === 'See Open Library') return null
  return s
}

function buildRatingBars(rawDist) {
  const bars = [5, 4, 3, 2, 1].map(stars => ({ stars, count: 0, percent: 0 }))
  if (!Array.isArray(rawDist) || rawDist.length === 0) return bars
  try {
    rawDist.forEach(item => {
      if (!item || typeof item !== 'object') return
      // API returns { stars: 5.0, count: 3, percentage: 60.0 }
      const starVal = safeNum(item.stars)
      const cnt = safeNum(item.count)
      if (starVal <= 0 || cnt <= 0) return
      const rounded = Math.round(starVal)  // 1-5
      const idx = 5 - rounded          // 0=5★, 4=1★
      if (idx >= 0 && idx < 5) bars[idx].count += cnt
    })
  } catch (_) { /* never crash */ }
  const max = Math.max(...bars.map(b => b.count), 1)
  bars.forEach(b => { b.percent = Math.round((b.count / max) * 100) })
  return bars
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch (_) { return '' }
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function BookDetailPage() {
  const { externalId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  /* Fetch data — raw queries, NOT via hooks that might share state */
  const bookQuery = useQuery({
    queryKey: keys.books.detail(externalId),
    queryFn: () => booksApi.getById(externalId),
    enabled: !!externalId,
    staleTime: 0,   // always refetch — user may have just logged/rated this book
    retry: 1,
  })

  const ratingQuery = useQuery({
    queryKey: keys.books.ratingDist(externalId),
    queryFn: () => booksApi.getRatingDistribution(externalId),
    enabled: !!externalId,
    staleTime: 5 * 60 * 1000,
  })

  const reviewsQuery = useQuery({
    queryKey: keys.reviews.byBook(externalId),
    queryFn: () => reviewsApi.getByBook(externalId, 0, 6),
    enabled: !!externalId,
    staleTime: 2 * 60 * 1000,
  })

  /* Log mutation — inline, not via shared hook */
  const [logPending, setLogPending] = useState(false)
  const [logError, setLogError] = useState('')

  /* UI state */
  const [showLogPanel, setShowLogPanel] = useState(false)
  const [logStatus, setLogStatus] = useState('Read')
  const [logRating, setLogRating] = useState(4)
  const [logReview, setLogReview] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [finishedAt, setFinishedAt] = useState('')
  const [reread, setReread] = useState(false)
  const [toast, setToast] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  /* Loading */
  if (bookQuery.isLoading) return <BookDetailSkeleton />

  /* Error */
  if (bookQuery.isError || !bookQuery.data) {
    return (
      <div className={styles.wrap}>
        <div className={styles.errorState}>
          <h2 className={styles.errorTitle}>Book not found</h2>
          <p className={styles.errorSub}>We couldn't find this book in the catalogue.</p>
          <button className={styles.btnPrimary} onClick={() => navigate('/browse')}>Browse books</button>
        </div>
      </div>
    )
  }

  /* Safe data extraction — every field guarded */
  const book = bookQuery.data
  const ratingDist = safeArr(ratingQuery.data)
  const rawReviews = ratingQuery.isError ? [] : safeArr(
    Array.isArray(reviewsQuery.data) ? reviewsQuery.data : reviewsQuery.data?.content
  )

  const title = safeStr(book.title) || 'Untitled'
  const description = safeStr(book.description)
  const coverUrl = safeStr(book.coverUrl)
  const showCover = !!coverUrl && !imgFailed
  const ci = colorIndex(safeStr(externalId))

  const rawAuthors = safeArr(book.authors).length > 0 ? safeArr(book.authors) : [book.author]
  const authors = rawAuthors.map(cleanAuthor).filter(Boolean)
  const primaryAuthor = authors[0] ?? null

  const avgRating = safeNum(book.averageRating)
  const ratingsCount = safeNum(book.ratingsCount)
  const reviewsCount = safeNum(book.reviewsCount)
  const logsCount = safeNum(book.logsCount)
  const publishYear = book.publishYear ? String(book.publishYear) : null
  const pageCount = book.pageCount ? String(book.pageCount) : null
  const language = safeStr(book.language)
  const publisher = safeStr(book.publisher)
  const isbn13 = safeStr(book.isbn13)
  const isbn = safeStr(book.isbn)
  const genres = safeArr(book.genres).filter(g => typeof g === 'string' && g.length > 0)

  const userStatus = safeStr(book.userStatus)  // "READ" | "READING" | "WANT" | ""
  const userRating = safeNum(book.userRating)   // 0.5-5.0 or 0

  const ratingBars = buildRatingBars(ratingDist)
  const hasRatingBars = ratingBars.some(b => b.count > 0)

  /* Log handlers */
  async function submitLog(payload) {
    if (!isAuthenticated) { navigate('/login'); return }
    setLogPending(true)
    setLogError('')
    try {
      await logsApi.logBook(externalId, payload)
      // Invalidate without triggering immediate refetch — avoids re-render crash
      // Refetch book detail immediately so userStatus/userRating update in-place on the page
      queryClient.invalidateQueries({ queryKey: keys.books.detail(externalId) })
      queryClient.invalidateQueries({ queryKey: keys.logs.diary() })
      queryClient.invalidateQueries({ queryKey: keys.logs.feed })
      queryClient.invalidateQueries({ queryKey: keys.recommendations, refetchType: 'all' })
      setShowLogPanel(false)
      setToast(true)
    } catch (err) {
      setLogError(err?.response?.data?.message || 'Failed to save. Try again.')
    } finally {
      setLogPending(false)
    }
  }

  function handleQuickLog(status) {
    submitLog({ status })
  }

  function handleFullLog() {
    submitLog({
      status: STATUS_MAP[logStatus] || 'READ',
      rating: logRating || undefined,
      reread,
      ...(startedAt && { startedAt }),
      ...(finishedAt && { finishedAt }),
    })
  }

  return (
    <div className={styles.wrap}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        {showCover && (
          <div className={styles.heroBg} style={{ backgroundImage: `url(${coverUrl})` }} />
        )}
        <div className={styles.heroGradient} />

        <div className={styles.heroInner}>
          {/* Cover */}
          <div className={styles.coverWrap}>
            {showCover ? (
              <img
                src={coverUrl}
                alt={title}
                className={styles.coverImg}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className={`${styles.coverFallback} bc${ci}`}>
                <span className={styles.coverInitial}>{title.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.info}>
            <h1 className={styles.title}>{title}</h1>

            {primaryAuthor && (
              <div className={styles.authorLine}>
                <span className={styles.authorBy}>by</span>
                <Link
                  to={`/search?q=${encodeURIComponent(primaryAuthor)}`}
                  className={styles.authorName}
                >
                  {primaryAuthor}
                </Link>
                {authors.length > 1 && (
                  <span className={styles.moreAuthors}>+{authors.length - 1} more</span>
                )}
              </div>
            )}

            {/* Rating */}
            <div className={styles.ratingBlock}>
              {avgRating > 0 ? (
                <>
                  <span className={styles.ratingScore}>{avgRating.toFixed(1)}</span>
                  <div className={styles.ratingDetail}>
                    <div className={styles.ratingStars}>
                      {safeRepeat('★', Math.round(avgRating))}
                      <span className={styles.emptyStars}>
                        {safeRepeat('★', 5 - Math.round(avgRating))}
                      </span>
                    </div>
                    <div className={styles.ratingCount}>
                      {ratingsCount.toLocaleString()} ratings
                      {reviewsCount > 0 && ` · ${reviewsCount} reviews`}
                    </div>
                  </div>
                </>
              ) : (
                <span className={styles.noRating}>No community ratings yet — be the first!</span>
              )}
            </div>

            {/* Meta pills */}
            <div className={styles.metaRow}>
              {publishYear && <span className={styles.metaPill}>{publishYear}</span>}
              {pageCount && <span className={styles.metaPill}>{pageCount} pages</span>}
              {language && <span className={styles.metaPill}>{language.toUpperCase()}</span>}
              {publisher && <span className={styles.metaPill}>{publisher}</span>}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className={styles.genreRow}>
                {genres.slice(0, 5).map((g, i) => (
                  <Link key={i} to="/browse" className={styles.genreChip}>{g}</Link>
                ))}
              </div>
            )}

            {/* User log status */}
            {userStatus && (
              <div className={styles.userLogBadge}>
                <StatusPill status={userStatus} />
                {userRating > 0 && (
                  <span className={styles.userRatingInline}>
                    Your rating: {safeRepeat('★', Math.round(userRating))}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className={styles.heroActions}>
              <button
                className={styles.btnPrimary}
                onClick={() => {
                  if (!isAuthenticated) { navigate('/login'); return }
                  setShowLogPanel(p => !p)
                }}
              >
                {showLogPanel ? 'Close' : userStatus ? 'Update log' : 'Log this book'}
              </button>
              {!userStatus && (
                <>
                  <button
                    className={styles.btnGhost}
                    onClick={() => handleQuickLog('WANT')}
                    disabled={logPending}
                  >
                    Want to read
                  </button>
                  <button
                    className={styles.btnGhost}
                    onClick={() => handleQuickLog('READING')}
                    disabled={logPending}
                  >
                    Reading now
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Log Panel ── */}
      {showLogPanel && (
        <div className={styles.logPanel}>
          <h3 className={styles.logPanelTitle}>
            {userStatus ? `Update "${title}"` : `Log "${title}"`}
          </h3>

          <div className={styles.statusTabs}>
            {STATUS_TABS.map(s => (
              <button
                key={s}
                className={`${styles.statusTab} ${logStatus === s ? styles.statusTabActive : ''}`}
                onClick={() => setLogStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className={styles.logField}>
            <label className={styles.logLabel}>Your rating</label>
            <StarRating initialRating={logRating} onChange={setLogRating} size="lg" />
          </div>

          <div className={styles.logField}>
            <label className={styles.logLabel}>
              Review <span className={styles.logOptional}>(optional)</span>
            </label>
            <textarea
              className={styles.logTextarea}
              placeholder="Share your thoughts on this book…"
              rows={4}
              value={logReview}
              onChange={e => setLogReview(e.target.value)}
            />
          </div>

          <div className={styles.logDates}>
            <div className={styles.logField}>
              <label className={styles.logLabel}>Date started</label>
              <input
                className={styles.logInput}
                type="date"
                value={startedAt}
                onChange={e => setStartedAt(e.target.value)}
              />
            </div>
            <div className={styles.logField}>
              <label className={styles.logLabel}>Date finished</label>
              <input
                className={styles.logInput}
                type="date"
                value={finishedAt}
                onChange={e => setFinishedAt(e.target.value)}
              />
            </div>
          </div>

          <label className={styles.logCheck}>
            <input type="checkbox" checked={reread} onChange={e => setReread(e.target.checked)} />
            This is a re-read
          </label>

          {logError && <p className={styles.logError}>{logError}</p>}

          <div className={styles.logActions}>
            <button className={styles.btnGhost} onClick={() => setShowLogPanel(false)}>
              Cancel
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleFullLog}
              disabled={logPending}
            >
              {logPending ? 'Saving…' : 'Save to diary'}
            </button>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className={styles.body}>
        <div className={styles.mainCol}>

          {/* Description */}
          {description && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About this book</h2>
              <p className={styles.description}>{description}</p>
            </section>
          )}

          {/* Details */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Details</h2>
            <dl className={styles.detailsGrid}>
              {isbn13 && <DetailItem label="ISBN-13" value={isbn13} />}
              {isbn && <DetailItem label="ISBN-10" value={isbn} />}
              {publisher && <DetailItem label="Publisher" value={publisher} />}
              {publishYear && <DetailItem label="First published" value={publishYear} />}
              {pageCount && <DetailItem label="Pages" value={pageCount} />}
              {language && <DetailItem label="Language" value={language} />}
              {primaryAuthor && <DetailItem label="Author" value={primaryAuthor} />}
              <div className={styles.detailItem}>
                <dt className={styles.detailLabel}>Source</dt>
                <dd className={styles.detailValue}>
                  <a
                    href={`https://openlibrary.org/works/${externalId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.detailLink}
                  >
                    Open Library
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          {/* Reviews */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Reviews
              {rawReviews.length > 0 && (
                <span className={styles.sectionCount}>{rawReviews.length}</span>
              )}
            </h2>
            {rawReviews.length > 0 ? (
              <div className={styles.reviewsList}>
                {rawReviews.map((r, i) => <InlineReviewCard key={r?.id ?? i} review={r} />)}
              </div>
            ) : (
              <div className={styles.emptyCard}>
                <p>No reviews yet.</p>
                <button
                  className={styles.btnGhost}
                  onClick={() => {
                    if (!isAuthenticated) { navigate('/login'); return }
                    setShowLogPanel(true)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Write the first review
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>

          {hasRatingBars && (
            <div className={styles.widget}>
              <h3 className={styles.widgetTitle}>Rating breakdown</h3>
              <div className={styles.barsList}>
                {ratingBars.map(bar => (
                  <div key={bar.stars} className={styles.barRow}>
                    <span className={styles.barLabel}>{bar.stars}★</span>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${bar.percent}%` }} />
                    </div>
                    <span className={styles.barNum}>{bar.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.widget}>
            <h3 className={styles.widgetTitle}>Community</h3>
            <div className={styles.statsList}>
              <StatRow label="Members logged" value={logsCount} />
              <StatRow label="Reviews" value={reviewsCount} />
              <StatRow label="Ratings" value={ratingsCount} />
            </div>
          </div>

          {authors.length > 0 && (
            <div className={styles.widget}>
              <h3 className={styles.widgetTitle}>{authors.length > 1 ? 'Authors' : 'Author'}</h3>
              <div className={styles.authorsCol}>
                {authors.map((a, i) => (
                  <Link
                    key={i}
                    to={`/search?q=${encodeURIComponent(a)}`}
                    className={styles.authorItem}
                  >
                    <div className={styles.authorBubble}>{a.charAt(0).toUpperCase()}</div>
                    <span className={styles.authorItemName}>{a}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <Toast message="Saved to your diary!" visible={toast} onHide={() => setToast(false)} />
    </div>
  )
}

/* ── Inline sub-components ────────────────────────────────────────────────── */

function InlineReviewCard({ review }) {
  if (!review) return null
  const username = safeStr(review.username || review.user?.username) || 'Anonymous'
  const initial = username.charAt(0).toUpperCase() || '?'
  const date = formatDate(review.createdAt)
  const rating = safeNum(review.rating)
  const content = safeStr(review.content)
  const likes = safeNum(review.likesCount)

  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewTop}>
        <div className={styles.reviewAvatar}>{initial}</div>
        <div className={styles.reviewMeta}>
          <div className={styles.reviewUser}>{username}</div>
          {date && <div className={styles.reviewDate}>{date}</div>}
        </div>
        {rating > 0 && (
          <div className={styles.reviewStars}>{safeRepeat('★', Math.round(rating))}</div>
        )}
      </div>
      {content && <p className={styles.reviewBody}>{content}</p>}
      {likes > 0 && (
        <div className={styles.reviewLikes}>{likes} {likes === 1 ? 'like' : 'likes'}</div>
      )}
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className={styles.detailItem}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd className={styles.detailValue}>{value}</dd>
    </div>
  )
}

function StatRow({ label, value }) {
  const n = safeNum(value)
  return (
    <div className={styles.statRow}>
      <div className={styles.statValue}>{n.toLocaleString()}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function BookDetailSkeleton() {
  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.coverWrap}>
            <div className={styles.coverSkel} />
          </div>
          <div className={styles.info}>
            <div className={styles.skelTitle} />
            <div className={styles.skelAuthor} />
            <div className={styles.skelMeta} />
            <div className={styles.skelRating} />
            <div className={styles.skelActions}>
              <div className={styles.skelBtn} />
              <div className={styles.skelBtn} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}