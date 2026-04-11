import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StarRating from '../components/ui/StarRating'
import { StatusPill } from '../components/ui/Badge'
import SectionHeader from '../components/ui/SectionHeader'
import Toast from '../components/ui/Toast'
import { useBookSearch, useLogBook, useDeleteLog } from '../hooks/useBooks'
import { useDiary } from '../hooks/useUser'
import useAuthStore from '../store/authStore'
import styles from './LogBookPage.module.css'

const STATUS_TABS = ['Read', 'Currently Reading', 'Want to Read']
const STATUS_MAP  = { 'Read': 'READ', 'Currently Reading': 'READING', 'Want to Read': 'WANT' }

export default function LogBookPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 40px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Log a book
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Sign in to start tracking your reading.
        </p>
        <button onClick={() => navigate('/login')} style={{
          background: 'var(--accent-green)', color: '#0d0f0e', border: 'none',
          borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer'
        }}>
          Sign in
        </button>
      </div>
    )
  }

  return <LogBookForm />
}

function LogBookForm() {
  const [searchQuery, setSearchQuery]   = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [status, setStatus]             = useState('Read')
  const [rating, setRating]             = useState(4)
  const [review, setReview]             = useState('')
  const [startedAt, setStartedAt]       = useState('')
  const [finishedAt, setFinishedAt]     = useState('')
  const [spoiler, setSpoiler]           = useState(false)
  const [privateEntry, setPrivate]      = useState(false)
  const [reread, setReread]             = useState(false)
  const [tags, setTags]                 = useState('')
  const [toast, setToast]               = useState(false)

  // ── API hooks ──────────────────────────────────────────────────────────
  // useBookSearch now returns { books: [], totalResults, hasMore, query }
  const { data: searchData, isLoading: searching, isFetching } = useBookSearch(activeSearch)
  const logBook   = useLogBook()
  const deleteLog = useDeleteLog()
  const { data: diaryData, isLoading: diaryLoading } = useDiary(null, 20)

  // Normalise: new API returns { books: [...] }
  const searchResults = searchData?.books ?? []
  const diaryItems    = Array.isArray(diaryData) ? diaryData : diaryData?.content ?? []

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim().length >= 2) setActiveSearch(searchQuery.trim())
  }

  async function handleSave() {
    if (!selectedBook) return

    await logBook.mutateAsync({
      bookExternalId: selectedBook.externalId,   // ← Open Library work ID
      payload: {
        status:       STATUS_MAP[status],
        rating,
        reread,
        privateEntry,
        tags,
        ...(startedAt  && { startedAt }),
        ...(finishedAt && { finishedAt }),
      }
    })

    setToast(true)
    setSelectedBook(null)
    setReview('')
    setRating(4)
    setStartedAt('')
    setFinishedAt('')
    setSpoiler(false)
    setPrivate(false)
    setReread(false)
    setTags('')
  }

  const isSearching = searching || isFetching

  return (
    <div className={styles.wrap}>

      {/* Page header */}
      <div className={`${styles.pageHeader} fade-up`}>
        <div className={styles.pageLabel}>
          <span className={styles.labelDot} />
          Your library
        </div>
        <h1 className={styles.pageTitle}>Log a book</h1>
        <p className={styles.pageSub}>
          Search any book from the Open Library catalogue — rate it, set your status, and write a review.
        </p>
      </div>

      {/* Search bar */}
      <form className={`${styles.searchRow} fade-up`} onSubmit={handleSearch}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by title, author, ISBN…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button className={styles.searchBtn} type="submit">
          {isSearching ? '…' : 'Search'}
        </button>
      </form>

      {/* Search results */}
      {searchResults.length > 0 && !selectedBook && (
        <div className={`${styles.resultsCard} fade-up`}>
          {searchResults.map(book => (
            <div
              key={book.externalId}
              className={styles.resultItem}
              onClick={() => setSelectedBook(book)}
            >
              {book.coverUrl ? (
                <img
                  src={book.coverUrlSmall || book.coverUrl}
                  alt={book.title}
                  className={styles.rCoverImg}
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className={`${styles.rCover} bc${((book.externalId?.charCodeAt(2) ?? 1) % 8) + 1}`} />
              )}
              <div className={styles.rInfo}>
                <div className={styles.rTitle}>{book.title}</div>
                <div className={styles.rAuthor}>{book.author}</div>
                <div className={styles.rMeta}>
                  {book.publishYear && <span>{book.publishYear}</span>}
                  {book.genres?.[0] && <span> · {book.genres[0]}</span>}
                  {book.pageCount  && <span> · {book.pageCount} pages</span>}
                </div>
              </div>
              <button
                className={styles.rSelectBtn}
                type="button"
                onClick={e => { e.stopPropagation(); setSelectedBook(book) }}
              >
                Select
              </button>
            </div>
          ))}
          {searchData?.hasMore && (
            <div style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              {searchData.totalResults.toLocaleString()} results — refine your search for more precise results
            </div>
          )}
        </div>
      )}

      {/* Empty search result */}
      {activeSearch && !isSearching && searchResults.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
          No results for "{activeSearch}". Try a different title or author name.
        </div>
      )}

      {/* Log form — shown after book is selected */}
      {selectedBook && (
        <div className={`${styles.form} fade-up`}>
          {/* Selected book header */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
            {selectedBook.coverUrl ? (
              <img
                src={selectedBook.coverUrl}
                alt={selectedBook.title}
                style={{ width: 60, height: 90, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                onError={e => e.target.style.display = 'none'}
              />
            ) : (
              <div className={`${styles.rCover} bc1`} style={{ width: 60, height: 90, borderRadius: 6, flexShrink: 0 }} />
            )}
            <div>
              <div className={styles.formTitle}>{selectedBook.title}</div>
              <div className={styles.formBook}>by <span>{selectedBook.author}</span></div>
              {selectedBook.publishYear && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {selectedBook.publishYear}
                  {selectedBook.pageCount ? ` · ${selectedBook.pageCount} pages` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Status tabs */}
          <div className={styles.statusTabs}>
            {STATUS_TABS.map(s => (
              <button
                key={s}
                type="button"
                className={`${styles.statusTab} ${status === s ? styles.statusActive : ''}`}
                onClick={() => setStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Rating */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Your rating</label>
            <StarRating initialRating={rating} onChange={setRating} size="lg" />
          </div>

          {/* Review */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Review <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              placeholder="Share your thoughts…"
              rows={5}
              value={review}
              onChange={e => setReview(e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date started</label>
              <input className={styles.input} type="date" value={startedAt} onChange={e => setStartedAt(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date finished</label>
              <input className={styles.input} type="date" value={finishedAt} onChange={e => setFinishedAt(e.target.value)} />
            </div>
          </div>

          {/* Checkboxes */}
          <div className={styles.checkboxes}>
            {[
              [spoiler, setSpoiler, 'This review contains spoilers'],
              [privateEntry, setPrivate, 'Keep this entry private'],
              [reread, setReread, 'This is a re-read'],
            ].map(([val, set, label], i) => (
              <label key={i} className={styles.checkRow}>
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className={styles.checkbox} />
                {label}
              </label>
            ))}
          </div>

          {/* Tags */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Tags <span className={styles.optional}>(optional)</span>
            </label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. favourites, 2025-reads"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          {/* Error */}
          {logBook.isError && (
            <p style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 12 }}>
              {logBook.error?.response?.data?.message ?? 'Failed to save. Please try again.'}
            </p>
          )}

          {/* Actions */}
          <div className={styles.formActions}>
            <button className={styles.btnGhost} type="button" onClick={() => setSelectedBook(null)}>
              ← Back to search
            </button>
            <div className={styles.actionsRight}>
              <button
                className={styles.btnPrimary}
                type="button"
                onClick={handleSave}
                disabled={logBook.isPending}
              >
                {logBook.isPending ? 'Saving…' : 'Save entry →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diary */}
      <div style={{ marginTop: 48 }}>
        <SectionHeader title="Recently logged" linkLabel="View all →" />
        {diaryLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading diary…</p>
        ) : diaryItems.length > 0 ? (
          <div className={styles.loggedList}>
            {diaryItems.map(log => (
              <div key={log.id} className={styles.loggedItem}>
                {log.bookCoverUrl ? (
                  <img
                    src={log.bookCoverUrl}
                    alt={log.bookTitle}
                    className={styles.loggedCoverImg}
                    onError={e => e.target.style.display='none'}
                  />
                ) : (
                  <div className={`${styles.loggedCover} bc1`} />
                )}
                <div className={styles.loggedInfo}>
                  <div className={styles.loggedTitle}>{log.bookTitle || log.bookExternalId}</div>
                  <div className={styles.loggedAuthor}>{log.bookAuthor}</div>
                  <div className={styles.loggedRating}>
                    {log.rating ? '★'.repeat(Math.round(log.rating)) : '—'}
                  </div>
                  <div className={styles.loggedDate}>
                    {log.finishedAt ? `Finished ${fmtDate(log.finishedAt)}` :
                     log.startedAt  ? `Started ${fmtDate(log.startedAt)}`  :
                     `Added ${fmtDate(log.updatedAt)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <StatusPill status={log.status} />
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', padding: 0 }}
                    onClick={() => deleteLog.mutate(log.id)}
                    disabled={deleteLog.isPending}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
            No books logged yet. Search above to add your first one!
          </p>
        )}
      </div>

      <Toast message="Entry saved to your diary!" visible={toast} onHide={() => setToast(false)} />
    </div>
  )
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
