import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useBookSearch } from '../hooks/useBooks'
import styles from './SearchPage.module.css'

export default function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const initialQ = params.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ)

  // Debounce: wait 400ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        setDebouncedQuery(query.trim())
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  // Also react to URL changes (from navbar)
  useEffect(() => {
    const q = params.get('q')
    if (q) {
      setQuery(q)
      setDebouncedQuery(q)
    }
  }, [params])

  const { data, isLoading, isFetching } = useBookSearch(debouncedQuery, { enabled: debouncedQuery.length >= 2 })
  const results = data?.books ?? []
  const isSearching = isLoading || isFetching

  return (
    <div className={styles.wrap}>
      {/* Page header */}
      <div className={`${styles.pageHeader} fade-up`}>
        <div className={styles.pageLabel}>
          <span className={styles.labelDot} />
          Search
        </div>
        <h1 className={styles.pageTitle}>Find your next read</h1>
        <p className={styles.pageSub}>
          Search by title, author, ISBN, or genre — powered by the Open Library catalogue.
        </p>
      </div>

      {/* Search bar */}
      <div className={`${styles.searchRow} fade-up`}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search books, authors, genres…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {isSearching && <span className={styles.spinner} />}
      </div>

      {/* Results meta */}
      {debouncedQuery && !isSearching && (
        <div className={styles.resultsMeta}>
          {results.length > 0 ? (
            <span>
              {data?.totalResults?.toLocaleString() ?? results.length} results for "<strong>{debouncedQuery}</strong>"
            </span>
          ) : (
            <span>No results for "<strong>{debouncedQuery}</strong>". Try a different search term.</span>
          )}
        </div>
      )}

      {/* Results grid */}
      <div className={styles.resultsGrid}>
        {isSearching && !results.length
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonCover} />
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonAuthor} />
              </div>
            ))
          : results.map(book => (
              <SearchResultCard key={book.externalId} book={book} navigate={navigate} />
            ))
        }
      </div>

      {/* Has more indicator */}
      {data?.hasMore && results.length > 0 && (
        <div className={styles.hasMore}>
          Showing {results.length} of {data.totalResults.toLocaleString()} results — refine your search for more precise results
        </div>
      )}
    </div>
  )
}

function SearchResultCard({ book, navigate }) {
  return (
    <div className={styles.resultCard} onClick={() => navigate('/log')}>
      <div className={styles.resultCoverWrap}>
        {book.coverUrl ? (
          <img
            src={book.coverUrlSmall || book.coverUrl}
            alt={book.title}
            className={styles.resultCover}
            loading="lazy"
            onError={e => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <div
          className={`${styles.resultCoverFallback} bc${((book.externalId?.charCodeAt(2) ?? 1) % 8) + 1}`}
          style={book.coverUrl ? { display: 'none' } : {}}
        >
          <span>{book.title?.charAt(0) ?? '?'}</span>
        </div>
      </div>
      <div className={styles.resultInfo}>
        <div className={styles.resultTitle}>{book.title}</div>
        <div className={styles.resultAuthor}>{book.author}</div>
        <div className={styles.resultMeta}>
          {book.publishYear && <span>{book.publishYear}</span>}
          {book.genres?.[0] && <span> · {book.genres[0]}</span>}
          {book.pageCount && <span> · {book.pageCount} pages</span>}
        </div>
        {book.genres && book.genres.length > 0 && (
          <div className={styles.genreTags}>
            {book.genres.slice(0, 3).map((g, i) => (
              <span key={i} className={styles.genreTag}>{g}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
