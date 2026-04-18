import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useBook, useRatingDistribution, useLogBook } from '../hooks/useBooks'
import { useBookReviews } from '../hooks/useReviews'
import useAuthStore from '../store/authStore'
import StarRating from '../components/ui/StarRating'
import { StatusPill } from '../components/ui/Badge'
import Toast from '../components/ui/Toast'
import styles from './BookDetailPage.module.css'

const STATUS_TABS = ['Read', 'Currently Reading', 'Want to Read']
const STATUS_MAP = { 'Read': 'READ', 'Currently Reading': 'READING', 'Want to Read': 'WANT' }

export default function BookDetailPage() {
  const { externalId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const { data: book, isLoading, isError } = useBook(externalId)
  const { data: ratingDist } = useRatingDistribution(externalId)
  const { data: reviewsData } = useBookReviews(externalId, 6)
  const logBook = useLogBook()

  // Inline log panel state
  const [showLogPanel, setShowLogPanel] = useState(false)
  const [logStatus, setLogStatus] = useState('Read')
  const [logRating, setLogRating] = useState(4)
  const [logReview, setLogReview] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [finishedAt, setFinishedAt] = useState('')
  const [reread, setReread] = useState(false)
  const [toast, setToast] = useState(false)

  const reviews = Array.isArray(reviewsData) ? reviewsData : reviewsData?.content ?? []

  if (isLoading) return <BookDetailSkeleton />

  if (isError || !book) {
    return (
      <div className={styles.wrap}>
        <div className={styles.errorState}>
          <div className={styles.errorEmoji}>📖</div>
          <h2 className={styles.errorTitle}>Book not found</h2>
          <p className={styles.errorSub}>
            We couldn't find this book. It may not be in the Open Library catalogue.
          </p>
          <button className={styles.btnPrimary} onClick={() => navigate('/browse')}>
            Browse books →
          </button>
        </div>
      </div>
    )
  }

  const ratingBars = buildRatingBars(ratingDist)

  // Determine author display
  const allAuthors = book.authors && book.authors.length > 0
    ? book.authors
    : book.author ? [book.author] : ['Unknown Author']
  const primaryAuthor = allAuthors[0]

  async function handleQuickLog(status) {
    if (!isAuthenticated) { navigate('/login'); return }
    await logBook.mutateAsync({ bookExternalId: externalId, payload: { status } })
    setToast(true)
  }

  async function handleFullLog() {
    if (!isAuthenticated) { navigate('/login'); return }
    await logBook.mutateAsync({
      bookExternalId: externalId,
      payload: {
        status: STATUS_MAP[logStatus],
        rating: logRating,
        reread,
        ...(startedAt && { startedAt }),
        ...(finishedAt && { finishedAt }),
      }
    })
    setShowLogPanel(false)
    setToast(true)
  }

  return (
    <div className={styles.wrap}>
      {/* ── HERO ── */}
      <div className={`${styles.hero} fade-up`}>
        {book.coverUrl && (
          <div className={styles.heroBg} style={{ backgroundImage: `url(${book.coverUrl})` }} />
        )}
        <div className={styles.heroGradient} />

        <div className={styles.heroInner}>
          {/* Cover */}
          <div className={styles.coverWrap}>
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className={styles.cover} />
            ) : (
              <div className={`${styles.coverFallback} bc${((externalId?.charCodeAt(2) ?? 1) % 8) + 1}`}>
                <span>{book.title?.charAt(0) ?? '?'}</span>
              </div>
            )}
          </div>

          {/* INFO */}
          <div className={styles.info}>
            {/* Title */}
            <h1 className={styles.title}>{book.title}</h1>

            {/* Author */}
            <div className={styles.authorLine}>
              <span className={styles.authorLabel}>by</span>
              <Link to={`/search?q=${encodeURIComponent(primaryAuthor)}`} className={styles.authorName}>
                {primaryAuthor}
              </Link>
              {allAuthors.length > 1 && (
                <span className={styles.moreAuthors}>+ {allAuthors.length - 1} more</span>
              )}
            </div>

            {/* Rating */}
            <div className={styles.ratingBlock}>
              {book.averageRating > 0 ? (
                <>
                  <div className={styles.ratingScore}>{book.averageRating.toFixed(1)}</div>
                  <div className={styles.ratingDetail}>
                    <div className={styles.ratingStars}>
                      {'★'.repeat(Math.round(book.averageRating))}
                      <span className={styles.emptyStars}>{'★'.repeat(5 - Math.round(book.averageRating))}</span>
                    </div>
                    <div className={styles.ratingCount}>
                      {(book.ratingsCount ?? 0).toLocaleString()} ratings
                      {(book.reviewsCount ?? 0) > 0 && ` · ${book.reviewsCount} reviews`}
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.noRating}>No community ratings yet — be the first!</div>
              )}
            </div>

            {/* Meta pills */}
            <div className={styles.metaRow}>
              {book.publishYear && <span className={styles.metaPill}>{book.publishYear}</span>}
              {book.pageCount && <span className={styles.metaPill}>{book.pageCount} pages</span>}
              {book.language && <span className={styles.metaPill}>{book.language.toUpperCase()}</span>}
              {book.publisher && <span className={styles.metaPill}>{book.publisher}</span>}
            </div>

            {/* Genres */}
            {book.genres && book.genres.length > 0 && (
              <div className={styles.genreRow}>
                {book.genres.slice(0, 5).map((g, i) => (
                  <Link key={i} to={`/browse`} className={styles.genreChip}>{g}</Link>
                ))}
              </div>
            )}

            {/* User status if existing */}
            {book.userStatus && (
              <div className={styles.userLogBadge}>
                <StatusPill status={book.userStatus} />
                {book.userRating > 0 && (
                  <span className={styles.userRatingInline}>
                    Your rating: {'★'.repeat(Math.round(book.userRating))}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className={styles.heroActions}>
              <button className={styles.btnPrimary} onClick={() => {
                if (!isAuthenticated) { navigate('/login'); return }
                setShowLogPanel(p => !p)
              }}>
                {showLogPanel ? '✕ Close' : '✎ Log / Review'}
              </button>
              <button className={styles.btnGhost} onClick={() => handleQuickLog('WANT')} disabled={logBook.isPending}>
                + Want to Read
              </button>
              <button className={styles.btnGhost} onClick={() => handleQuickLog('READING')} disabled={logBook.isPending}>
                📖 Currently Reading
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── INLINE LOG PANEL ── */}
      {showLogPanel && (
        <div className={`${styles.logPanel} fade-up`}>
          <div className={styles.logPanelHeader}>
            <h3 className={styles.logPanelTitle}>Log "{book.title}"</h3>
          </div>

          {/* Status tabs */}
          <div className={styles.statusTabs}>
            {STATUS_TABS.map(s => (
              <button
                key={s}
                className={`${styles.statusTab} ${logStatus === s ? styles.statusTabActive : ''}`}
                onClick={() => setLogStatus(s)}
              >{s}</button>
            ))}
          </div>

          {/* Rating */}
          <div className={styles.logField}>
            <label className={styles.logLabel}>Your rating</label>
            <StarRating initialRating={logRating} onChange={setLogRating} size="lg" />
          </div>

          {/* Review (optional) */}
          <div className={styles.logField}>
            <label className={styles.logLabel}>Review <span className={styles.logOptional}>(optional)</span></label>
            <textarea
              className={styles.logTextarea}
              placeholder="Share your thoughts on this book…"
              rows={4}
              value={logReview}
              onChange={e => setLogReview(e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className={styles.logDates}>
            <div className={styles.logField}>
              <label className={styles.logLabel}>Date started</label>
              <input className={styles.logInput} type="date" value={startedAt} onChange={e => setStartedAt(e.target.value)} />
            </div>
            <div className={styles.logField}>
              <label className={styles.logLabel}>Date finished</label>
              <input className={styles.logInput} type="date" value={finishedAt} onChange={e => setFinishedAt(e.target.value)} />
            </div>
          </div>

          <label className={styles.logCheck}>
            <input type="checkbox" checked={reread} onChange={e => setReread(e.target.checked)} />
            This is a re-read
          </label>

          {logBook.isError && (
            <p className={styles.logError}>
              {logBook.error?.response?.data?.message ?? 'Failed to save. Please try again.'}
            </p>
          )}

          <div className={styles.logActions}>
            <button className={styles.btnGhost} onClick={() => setShowLogPanel(false)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleFullLog} disabled={logBook.isPending}>
              {logBook.isPending ? 'Saving…' : 'Save to diary →'}
            </button>
          </div>
        </div>
      )}

      {/* ── BODY ── */}
      <div className={styles.body}>
        {/* Main column */}
        <div className={styles.mainCol}>
          {/* Description */}
          {book.description && (
            <section className={`${styles.section} fade-up`}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📖</span>
                About this book
              </h2>
              <div className={styles.description}>{book.description}</div>
            </section>
          )}

          {/* Book details */}
          <section className={`${styles.section} fade-up`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📋</span>
              Details
            </h2>
            <div className={styles.detailsGrid}>
              {book.isbn13 && <DetailItem label="ISBN-13" value={book.isbn13} />}
              {book.isbn && <DetailItem label="ISBN-10" value={book.isbn} />}
              {book.publisher && <DetailItem label="Publisher" value={book.publisher} />}
              {book.publishYear && <DetailItem label="First published" value={String(book.publishYear)} />}
              {book.pageCount && <DetailItem label="Pages" value={String(book.pageCount)} />}
              {book.language && <DetailItem label="Language" value={book.language} />}
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Source</span>
                <a
                  href={`https://openlibrary.org/works/${externalId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.detailLink}
                >
                  Open Library ↗
                </a>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section className={`${styles.section} fade-up`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>💬</span>
              Reviews
              {reviews.length > 0 && <span className={styles.sectionBadge}>{reviews.length}</span>}
            </h2>
            {reviews.length > 0 ? (
              <div className={styles.reviewsList}>
                {reviews.map(r => (
                  <div key={r.id} className={styles.reviewCard}>
                    <div className={styles.reviewTop}>
                      <div className={styles.reviewAvatar}>
                        {r.user?.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className={styles.reviewMeta}>
                        <div className={styles.reviewUser}>{r.user?.username ?? 'Anonymous'}</div>
                        <div className={styles.reviewDate}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </div>
                      </div>
                      {r.rating > 0 && (
                        <div className={styles.reviewStars}>
                          {'★'.repeat(Math.round(r.rating))}
                        </div>
                      )}
                    </div>
                    <p className={styles.reviewBody}>{r.content}</p>
                    {r.likesCount > 0 && <div className={styles.reviewLikes}>♥ {r.likesCount}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyCard}>
                <p>No reviews yet.</p>
                <button className={styles.btnGhost} onClick={() => { if (!isAuthenticated) { navigate('/login'); return } setShowLogPanel(true) }}>
                  Write the first review
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Rating distribution */}
          {ratingBars.some(b => b.count > 0) && (
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

          {/* Community */}
          <div className={styles.widget}>
            <h3 className={styles.widgetTitle}>Community</h3>
            <div className={styles.statsList}>
              <StatRow label="Members logged" value={book.logsCount ?? 0} />
              <StatRow label="Reviews" value={book.reviewsCount ?? 0} />
              <StatRow label="Ratings" value={book.ratingsCount ?? 0} />
            </div>
          </div>

          {/* Authors */}
          {allAuthors.length > 0 && (
            <div className={styles.widget}>
              <h3 className={styles.widgetTitle}>{allAuthors.length > 1 ? 'Authors' : 'Author'}</h3>
              <div className={styles.authorsCol}>
                {allAuthors.map((a, i) => (
                  <Link key={i} to={`/search?q=${encodeURIComponent(a)}`} className={styles.authorItem}>
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

/* ── Sub-components ── */
function DetailItem({ label, value }) {
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div className={styles.statRow}>
      <div className={styles.statValue}>{value.toLocaleString()}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function buildRatingBars(ratingDist) {
  const bars = [5, 4, 3, 2, 1].map(stars => ({ stars, count: 0, percent: 0 }))
  if (!ratingDist || !Array.isArray(ratingDist)) return bars
  ratingDist.forEach(([rating, count]) => {
    const idx = Math.round(rating / 2) - 1
    if (idx >= 0 && idx < 5) bars[4 - idx].count += count
  })
  const max = Math.max(...bars.map(b => b.count), 1)
  bars.forEach(b => { b.percent = Math.round((b.count / max) * 100) })
  return bars
}

function BookDetailSkeleton() {
  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.coverWrap}><div className={styles.coverSkel} /></div>
          <div className={styles.info}>
            <div className={styles.skelTitle} />
            <div className={styles.skelAuthor} />
            <div className={styles.skelMeta} />
            <div className={styles.skelRating} />
            <div className={styles.skelActions}><div className={styles.skelBtn} /><div className={styles.skelBtn} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}
