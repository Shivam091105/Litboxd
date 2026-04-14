import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { booksApi } from '../api/books'
import { logsApi } from '../api/logs'
import { reviewsApi } from '../api/reviews'
import { keys } from '../api/queryKeys'
import useAuthStore from '../store/authStore'
import StarRating from '../components/ui/StarRating'
import { StatusPill } from '../components/ui/Badge'
import Toast from '../components/ui/Toast'
import styles from './BookDetailPage.module.css'

const STATUS_TABS = ['Read', 'Currently Reading', 'Want to Read']
const STATUS_MAP = { 'Read': 'READ', 'Currently Reading': 'READING', 'Want to Read': 'WANT' }

/* ── Safe helpers ──────────────────────────────────────────────────────────── */
function safeStr(v) { return (v != null && typeof v === 'string') ? v : '' }
function safeNum(v, fb = 0) { const n = Number(v); return isFinite(n) ? n : fb }
function safeArr(v) { return Array.isArray(v) ? v : [] }
function safeRpt(c, n) { const k = Math.max(0, Math.min(10, Math.round(safeNum(n)))); return c.repeat(k) }
function colorIdx(s) { if (!s) return 1; let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return (h % 8) + 1 }
function cleanAuthor(v) { const s = (v || '').trim(); return (!s || s === 'Unknown Author' || s === 'See Open Library') ? null : s }
function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return '' } }

function buildRatingBars(raw) {
  const bars = [5, 4, 3, 2, 1].map(stars => ({ stars, count: 0, percent: 0 }))
  if (!Array.isArray(raw) || raw.length === 0) return bars
  try {
    raw.forEach(item => {
      if (!item || typeof item !== 'object') return
      const sv = safeNum(item.stars), cnt = safeNum(item.count)
      if (sv <= 0 || cnt <= 0) return
      const idx = 5 - Math.round(sv)
      if (idx >= 0 && idx < 5) bars[idx].count += cnt
    })
  } catch (_) { }
  const max = Math.max(...bars.map(b => b.count), 1)
  bars.forEach(b => { b.percent = Math.round((b.count / max) * 100) })
  return bars
}

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function BookDetailPage() {
  const { externalId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()

  /* Queries */
  const bookQ = useQuery({
    queryKey: keys.books.detail(externalId),
    queryFn: () => booksApi.getById(externalId),
    enabled: !!externalId,
    staleTime: 0,
    retry: 1,
  })
  const ratingQ = useQuery({
    queryKey: keys.books.ratingDist(externalId),
    queryFn: () => booksApi.getRatingDistribution(externalId),
    enabled: !!externalId,
    staleTime: 2 * 60 * 1000,
  })
  const reviewsQ = useQuery({
    queryKey: keys.reviews.byBook(externalId),
    queryFn: () => reviewsApi.getByBook(externalId, 0, 20),
    enabled: !!externalId,
    staleTime: 0,
  })

  /* Log panel */
  const [showLog, setShowLog] = useState(false)
  const [logStatus, setLogStatus] = useState('Read')
  const [logRating, setLogRating] = useState(4)
  const [startedAt, setStartedAt] = useState('')
  const [finishedAt, setFinishedAt] = useState('')
  const [reread, setReread] = useState(false)
  const [logPending, setLogPending] = useState(false)
  const [logError, setLogError] = useState('')

  /* Review panel */
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [editingReview, setEditingReview] = useState(null)   // { id, content, hasSpoiler }
  const [reviewContent, setReviewContent] = useState('')
  const [hasSpoiler, setHasSpoiler] = useState(false)
  const [reviewPending, setReviewPending] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const [imgFailed, setImgFailed] = useState(false)
  const [toast, setToast] = useState('')

  const reviewPanelRef = useRef(null)

  /* Loading / error */
  if (bookQ.isLoading) return <BookDetailSkeleton />
  if (bookQ.isError || !bookQ.data) {
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

  /* Safe data extraction */
  const book = bookQ.data
  const title = safeStr(book.title) || 'Untitled'
  const description = safeStr(book.description)
  const coverUrl = safeStr(book.coverUrl)
  const showCover = !!coverUrl && !imgFailed
  const ci = colorIdx(safeStr(externalId))
  const rawAuthors = safeArr(book.authors).length > 0 ? safeArr(book.authors) : [book.author]
  const authors = rawAuthors.map(cleanAuthor).filter(Boolean)
  const primaryAuthor = authors[0] ?? null
  const avgRating = safeNum(book.averageRating)
  const ratingsCount = safeNum(book.ratingsCount)
  const logsCount = safeNum(book.logsCount)
  const publishYear = book.publishYear ? String(book.publishYear) : null
  const pageCount = book.pageCount ? String(book.pageCount) : null
  const language = safeStr(book.language)
  const publisher = safeStr(book.publisher)
  const isbn13 = safeStr(book.isbn13)
  const isbn = safeStr(book.isbn)
  const genres = safeArr(book.genres).filter(g => typeof g === 'string' && g.length > 0)
  const userStatus = safeStr(book.userStatus)
  const userRating = safeNum(book.userRating)
  const ratingBars = buildRatingBars(safeArr(ratingQ.data))
  const hasRatingBars = ratingBars.some(b => b.count > 0)

  /* Reviews */
  const rawReviews = safeArr(
    Array.isArray(reviewsQ.data) ? reviewsQ.data : reviewsQ.data?.content
  )
  const reviewsCount = rawReviews.length
  const myReview = rawReviews.find(r => r.userId === user?.id || r.username === user?.username)
  const otherReviews = rawReviews.filter(r => r !== myReview)

  /* ── Invalidate helpers ── */
  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: keys.books.detail(externalId) })
    queryClient.invalidateQueries({ queryKey: keys.reviews.byBook(externalId) })
    queryClient.invalidateQueries({ queryKey: keys.logs.diary() })
    queryClient.invalidateQueries({ queryKey: keys.recommendations, refetchType: 'all' })
  }

  /* ── Log submit ── */
  async function submitLog(payload) {
    if (!isAuthenticated) { navigate('/login'); return }
    setLogPending(true); setLogError('')
    try {
      await logsApi.logBook(externalId, payload)
      invalidateAll()
      setShowLog(false)
      setToast('Saved to your diary!')
    } catch (err) {
      setLogError(err?.response?.data?.message || 'Failed to save. Try again.')
    } finally { setLogPending(false) }
  }

  function handleQuickLog(status) { submitLog({ status }) }

  function handleFullLog() {
    submitLog({
      status: STATUS_MAP[logStatus] || 'READ',
      ...(logRating && { rating: logRating }),
      reread,
      ...(startedAt && { startedAt }),
      ...(finishedAt && { finishedAt }),
    })
  }

  /* ── Review submit ── */
  async function submitReview() {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!reviewContent.trim()) { setReviewError('Please write something before submitting.'); return }
    setReviewPending(true); setReviewError('')
    try {
      if (editingReview) {
        await reviewsApi.update(editingReview.id, reviewContent.trim(), hasSpoiler)
        setToast('Review updated!')
      } else {
        await reviewsApi.create(externalId, reviewContent.trim(), hasSpoiler)
        setToast('Review published!')
      }
      queryClient.invalidateQueries({ queryKey: keys.reviews.byBook(externalId) })
      queryClient.invalidateQueries({ queryKey: keys.reviews.byUser(user?.id) })
      setShowWriteReview(false)
      setEditingReview(null)
      setReviewContent('')
      setHasSpoiler(false)
    } catch (err) {
      setReviewError(err?.response?.data?.message || 'Failed to submit review.')
    } finally { setReviewPending(false) }
  }

  async function deleteReview(reviewId) {
    try {
      await reviewsApi.delete(reviewId)
      queryClient.invalidateQueries({ queryKey: keys.reviews.byBook(externalId) })
      queryClient.invalidateQueries({ queryKey: keys.reviews.byUser(user?.id) })
      setToast('Review deleted.')
    } catch (_) { }
  }

  function openEdit(review) {
    setEditingReview({ id: review.id, content: review.content, hasSpoiler: review.hasSpoiler })
    setReviewContent(review.content || '')
    setHasSpoiler(review.hasSpoiler || false)
    setShowWriteReview(true)
    setTimeout(() => {
      reviewPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  function openWriteNew() {
    if (!isAuthenticated) { navigate('/login'); return }
    setEditingReview(null)
    setReviewContent('')
    setHasSpoiler(false)
    setShowWriteReview(true)
    // Scroll to review panel after it renders
    setTimeout(() => {
      reviewPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  /* ── Render ── */
  return (
    <div className={styles.wrap}>

      {/* ── HERO ── */}
      <div className={styles.hero}>
        {showCover && <div className={styles.heroBg} style={{ backgroundImage: `url(${coverUrl})` }} />}
        <div className={styles.heroGradient} />
        <div className={styles.heroInner}>

          {/* Cover */}
          <div className={styles.coverWrap}>
            {showCover ? (
              <img src={coverUrl} alt={title} className={styles.coverImg} onError={() => setImgFailed(true)} />
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
                <Link to={`/search?q=${encodeURIComponent(primaryAuthor)}`} className={styles.authorName}>
                  {primaryAuthor}
                </Link>
                {authors.length > 1 && <span className={styles.moreAuthors}>+{authors.length - 1} more</span>}
              </div>
            )}

            {/* Rating */}
            <div className={styles.ratingBlock}>
              {avgRating > 0 ? (
                <>
                  <span className={styles.ratingScore}>{avgRating.toFixed(1)}</span>
                  <div className={styles.ratingDetail}>
                    <div className={styles.ratingStars}>
                      {safeRpt('★', Math.round(avgRating))}
                      <span className={styles.emptyStars}>{safeRpt('★', 5 - Math.round(avgRating))}</span>
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

            {/* User status badge */}
            {userStatus && (
              <div className={styles.userLogBadge}>
                <StatusPill status={userStatus} />
                {userRating > 0 && (
                  <span className={styles.userRatingInline}>{safeRpt('★', Math.round(userRating))}</span>
                )}
              </div>
            )}

            {/* ── Hero actions: Log button + quick actions ── */}
            <div className={styles.heroActions}>
              {/* Primary: opens the log/re-log panel */}
              <button
                className={styles.btnPrimary}
                onClick={() => {
                  if (!isAuthenticated) { navigate('/login'); return }
                  setShowLog(p => !p)
                }}
              >
                {showLog ? 'Close' : userStatus ? 'Re-log this book' : 'Log this book'}
              </button>

              {/* Quick-add buttons only if not yet logged */}
              {!userStatus && (
                <>
                  <button className={styles.btnGhost} onClick={() => handleQuickLog('WANT')} disabled={logPending}>
                    Want to read
                  </button>
                  <button className={styles.btnGhost} onClick={() => handleQuickLog('READING')} disabled={logPending}>
                    Reading now
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── LOG PANEL ── */}
      {showLog && (
        <div className={styles.logPanel}>
          <h3 className={styles.logPanelTitle}>
            {userStatus ? `Re-log "${title}"` : `Log "${title}"`}
          </h3>
          <div className={styles.statusTabs}>
            {STATUS_TABS.map(s => (
              <button key={s} className={`${styles.statusTab} ${logStatus === s ? styles.statusTabActive : ''}`} onClick={() => setLogStatus(s)}>{s}</button>
            ))}
          </div>
          <div className={styles.logField}>
            <label className={styles.logLabel}>Your rating</label>
            <StarRating initialRating={logRating} onChange={setLogRating} size="lg" />
          </div>
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
          {logError && <p className={styles.logError}>{logError}</p>}
          <div className={styles.logActions}>
            <button className={styles.btnGhost} onClick={() => setShowLog(false)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleFullLog} disabled={logPending}>
              {logPending ? 'Saving…' : 'Save to diary'}
            </button>
          </div>
        </div>
      )}

      {/* ── WRITE / EDIT REVIEW PANEL ── */}
      {showWriteReview && (
        <div className={styles.logPanel} ref={reviewPanelRef}>
          <h3 className={styles.logPanelTitle}>
            {editingReview ? 'Edit your review' : `Review "${title}"`}
          </h3>
          <div className={styles.logField}>
            <label className={styles.logLabel}>
              Your review
              {editingReview && <span className={styles.logOptional}> — editing</span>}
            </label>
            <textarea
              className={styles.logTextarea}
              placeholder="Share your thoughts on this book…"
              rows={5}
              value={reviewContent}
              onChange={e => setReviewContent(e.target.value)}
            />
          </div>
          <label className={styles.logCheck}>
            <input type="checkbox" checked={hasSpoiler} onChange={e => setHasSpoiler(e.target.checked)} />
            Contains spoilers
          </label>
          {reviewError && <p className={styles.logError}>{reviewError}</p>}
          <div className={styles.logActions}>
            <button className={styles.btnGhost} onClick={() => { setShowWriteReview(false); setEditingReview(null) }}>
              Cancel
            </button>
            <button className={styles.btnPrimary} onClick={submitReview} disabled={reviewPending}>
              {reviewPending ? 'Submitting…' : editingReview ? 'Save changes' : 'Publish review'}
            </button>
          </div>
        </div>
      )}

      {/* ── BODY ── */}
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
                  <a href={`https://openlibrary.org/works/${externalId}`} target="_blank" rel="noopener noreferrer" className={styles.detailLink}>Open Library</a>
                </dd>
              </div>
            </dl>
          </section>

          {/* Reviews section */}
          <section className={styles.section}>
            <div className={styles.reviewsHeader}>
              <h2 className={styles.sectionTitle}>
                Reviews
                {reviewsCount > 0 && <span className={styles.sectionCount}>{reviewsCount}</span>}
              </h2>
              {/* Write review button — only if authenticated and hasn't reviewed yet */}
              {isAuthenticated && !myReview && !showWriteReview && (
                <button className={styles.btnGhost} onClick={openWriteNew}>
                  Write a review
                </button>
              )}
            </div>

            {/* My review first */}
            {myReview && (
              <div className={styles.myReviewWrap}>
                <div className={styles.myReviewLabel}>Your review</div>
                <ReviewCard
                  review={myReview}
                  isOwn
                  onEdit={() => openEdit(myReview)}
                  onDelete={() => deleteReview(myReview.id)}
                />
              </div>
            )}

            {/* Other reviews */}
            {otherReviews.length > 0 ? (
              <div className={styles.reviewsList}>
                {otherReviews.map((r, i) => <ReviewCard key={r?.id ?? i} review={r} />)}
              </div>
            ) : !myReview ? (
              <div className={styles.emptyCard}>
                <p>No reviews yet.</p>
                {isAuthenticated ? (
                  <button className={styles.btnGhost} onClick={openWriteNew}>
                    Write the first review
                  </button>
                ) : (
                  <button className={styles.btnGhost} onClick={() => navigate('/login')}>
                    Sign in to review
                  </button>
                )}
              </div>
            ) : null}
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
                    <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${bar.percent}%` }} /></div>
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

      <Toast message={toast} visible={!!toast} onHide={() => setToast('')} />
    </div>
  )
}

/* ── Sub-components ── */
function ReviewCard({ review, isOwn = false, onEdit, onDelete }) {
  const navigate = useNavigate()
  if (!review) return null
  const username = safeStr(review.username || review.user?.username) || 'Anonymous'
  const initial = username.charAt(0).toUpperCase() || '?'
  const date = fmtDate(review.createdAt)
  const rating = safeNum(review.rating)
  const content = safeStr(review.content)
  const likes = safeNum(review.likesCount)
  const coverUrl = safeStr(review.bookCoverUrl)
  const [imgFailed, setImgFailed] = useState(false)
  const ci = colorIdx(safeStr(review.bookExternalId))

  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewTop}>
        <div className={styles.reviewAvatar}>{initial}</div>
        <div className={styles.reviewMeta}>
          <div className={styles.reviewUser}>{username}</div>
          {date && <div className={styles.reviewDate}>{date}</div>}
        </div>
        {rating > 0 && <div className={styles.reviewStars}>{safeRpt('★', Math.round(rating))}</div>}
        {isOwn && (onEdit || onDelete) && (
          <div className={styles.reviewOwnerActions}>
            {onEdit && <button className={styles.reviewActionBtn} onClick={onEdit}>Edit</button>}
            {onDelete && <button className={`${styles.reviewActionBtn} ${styles.reviewActionDanger}`} onClick={onDelete}>Delete</button>}
          </div>
        )}
      </div>
      {content && <p className={styles.reviewBody}>{content}</p>}
      {likes > 0 && <div className={styles.reviewLikes}>{likes} {likes === 1 ? 'like' : 'likes'}</div>}
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
  return (
    <div className={styles.statRow}>
      <div className={styles.statValue}>{safeNum(value).toLocaleString()}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function BookDetailSkeleton() {
  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.coverWrap}><div className={styles.coverSkel} /></div>
          <div className={styles.info}>
            <div className={styles.skelTitle} /><div className={styles.skelAuthor} />
            <div className={styles.skelMeta} /><div className={styles.skelRating} />
            <div className={styles.skelActions}><div className={styles.skelBtn} /><div className={styles.skelBtn} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}