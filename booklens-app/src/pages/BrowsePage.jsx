import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { booksApi } from '../api/books'
import styles from './BrowsePage.module.css'

const GENRES = [
  { key: 'fiction', label: 'Fiction' },
  { key: 'science_fiction', label: 'Sci-Fi' },
  { key: 'fantasy', label: 'Fantasy' },
  { key: 'mystery', label: 'Mystery' },
  { key: 'romance', label: 'Romance' },
  { key: 'thriller', label: 'Thriller' },
  { key: 'historical_fiction', label: 'Historical' },
  { key: 'horror', label: 'Horror' },
  { key: 'biography', label: 'Biography' },
  { key: 'philosophy', label: 'Philosophy' },
  { key: 'poetry', label: 'Poetry' },
  { key: 'psychology', label: 'Psychology' },
  { key: 'history', label: 'History' },
  { key: 'adventure', label: 'Adventure' },
  { key: 'classics', label: 'Classics' },
  { key: 'young_adult', label: 'Young Adult' },
]

function colorIndex(str) {
  if (!str) return 1
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return (h % 8) + 1
}

export default function BrowsePage() {
  const [selectedGenre, setSelectedGenre] = useState(null)
  const navigate = useNavigate()
  const active = GENRES.find(g => g.key === selectedGenre)

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Discover</p>
        <h1 className={styles.pageTitle}>Browse books</h1>
        <p className={styles.pageSub}>Explore curated lists by genre. Click any category to dive in.</p>
      </header>

      <nav className={styles.filterBar}>
        <button
          className={`${styles.filterBtn} ${!selectedGenre ? styles.filterBtnActive : ''}`}
          onClick={() => setSelectedGenre(null)}
        >
          All genres
        </button>
        {GENRES.map(g => (
          <button
            key={g.key}
            className={`${styles.filterBtn} ${selectedGenre === g.key ? styles.filterBtnActive : ''}`}
            onClick={() => setSelectedGenre(selectedGenre === g.key ? null : g.key)}
          >
            {g.label}
          </button>
        ))}
      </nav>

      {active ? (
        <GenreGrid genre={active} navigate={navigate} />
      ) : (
        <div className={styles.genreRows}>
          {GENRES.slice(0, 8).map(g => (
            <GenreRow key={g.key} genre={g} onSeeAll={() => setSelectedGenre(g.key)} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}

function GenreRow({ genre, onSeeAll, navigate }) {
  const { data, isLoading } = useQuery({
    queryKey: ['books', 'subject', genre.key],
    queryFn: () => booksApi.browseBySubject(genre.key, 14),
    staleTime: 10 * 60 * 1000,
  })
  const books = data?.books ?? []

  return (
    <section className={styles.genreRow}>
      <div className={styles.rowHeader}>
        <h2 className={styles.rowTitle}>{genre.label}</h2>
        <button className={styles.seeAllBtn} onClick={onSeeAll}>
          See all
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className={styles.rowScroll}>
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <BookSkeleton key={i} />)
          : books.map(book => <BookCard key={book.externalId} book={book} navigate={navigate} />)
        }
      </div>
    </section>
  )
}

function GenreGrid({ genre, navigate }) {
  const { data, isLoading } = useQuery({
    queryKey: ['books', 'subject', genre.key, 40],
    queryFn: () => booksApi.browseBySubject(genre.key, 40),
    staleTime: 10 * 60 * 1000,
  })
  const books = data?.books ?? []

  return (
    <section className={styles.genreGrid}>
      <div className={styles.genreGridHeader}>
        <h2 className={styles.genreGridTitle}>{genre.label}</h2>
        {data?.totalResults > 0 && (
          <span className={styles.totalBadge}>{data.totalResults.toLocaleString()} books</span>
        )}
      </div>
      <div className={styles.booksGrid}>
        {isLoading
          ? Array.from({ length: 20 }).map((_, i) => <BookSkeleton key={i} />)
          : books.length > 0
            ? books.map(book => <BookCard key={book.externalId} book={book} navigate={navigate} />)
            : <p className={styles.empty}>No books found for this genre.</p>
        }
      </div>
    </section>
  )
}

function BookCard({ book, navigate }) {
  const [imgFailed, setImgFailed] = useState(false)
  const coverSrc = book.coverUrlSmall || book.coverUrl
  const showImg = !!coverSrc && !imgFailed
  const ci = colorIndex(book.externalId)

  return (
    <article
      className={styles.bookCard}
      onClick={() => navigate(`/book/${book.externalId}`)}
    >
      <div className={styles.coverWrap}>
        {showImg ? (
          <img
            src={coverSrc}
            alt={book.title}
            className={styles.coverImg}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className={`${styles.coverFallback} bc${ci}`}>
            <span className={styles.fallbackInitial}>{book.title?.charAt(0) ?? '?'}</span>
          </div>
        )}
        <div className={styles.coverSheen} />
      </div>
      <div className={styles.cardMeta}>
        <p className={styles.cardTitle}>{book.title}</p>
        {book.author && <p className={styles.cardAuthor}>{book.author}</p>}
        {book.averageRating > 0 && (
          <p className={styles.cardRating}>
            <span className={styles.star}>★</span>
            {book.averageRating.toFixed(1)}
          </p>
        )}
      </div>
    </article>
  )
}

function BookSkeleton() {
  return (
    <div className={styles.bookCard}>
      <div className={`${styles.coverWrap} ${styles.skeletonCover}`} />
      <div className={styles.cardMeta}>
        <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonAuthor}`} />
      </div>
    </div>
  )
}