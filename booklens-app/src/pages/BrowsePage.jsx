import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { booksApi } from '../api/books'
import styles from './BrowsePage.module.css'

const GENRES = [
  { key: 'fiction', label: 'Fiction', },
  { key: 'science_fiction', label: 'Science Fiction', },
  { key: 'fantasy', label: 'Fantasy', },
  { key: 'mystery', label: 'Mystery', },
  { key: 'romance', label: 'Romance', },
  { key: 'thriller', label: 'Thriller', },
  { key: 'historical_fiction', label: 'Historical Fiction', },
  { key: 'horror', label: 'Horror', },
  { key: 'biography', label: 'Biography', },
  { key: 'philosophy', label: 'Philosophy', },
  { key: 'poetry', label: 'Poetry', },
  { key: 'psychology', label: 'Psychology', },
  { key: 'history', label: 'History', },
  { key: 'adventure', label: 'Adventure', },
  { key: 'classics', label: 'Classics', },
  { key: 'young_adult', label: 'Young Adult', },
]

export default function BrowsePage() {
  const [selectedGenre, setSelectedGenre] = useState(null)
  const navigate = useNavigate()

  return (
    <div className={styles.wrap}>
      {/* Page header */}
      <div className={`${styles.pageHeader} fade-up`}>
        <div className={styles.pageLabel}>
          <span className={styles.labelDot} />
          Discover
        </div>
        <h1 className={styles.pageTitle}>Browse books</h1>
        <p className={styles.pageSub}>
          Explore books by genre. Click any category to dive deeper.
        </p>
      </div>

      {/* Genre pills */}
      <div className={`${styles.genrePills} fade-up`}>
        {GENRES.map(g => (
          <button
            key={g.key}
            className={`${styles.genrePill} ${selectedGenre === g.key ? styles.genrePillActive : ''}`}
            onClick={() => setSelectedGenre(selectedGenre === g.key ? null : g.key)}
          >
            <span className={styles.genreEmoji}>{g.emoji}</span>
            {g.label}
          </button>
        ))}
      </div>

      {/* Selected genre: full view */}
      {selectedGenre && (
        <GenreSection
          genre={GENRES.find(g => g.key === selectedGenre)}
          limit={40}
          navigate={navigate}
        />
      )}

      {/* Default: show rows for all genres */}
      {!selectedGenre && (
        <div className={styles.genreRows}>
          {GENRES.slice(0, 8).map(g => (
            <GenreRow
              key={g.key}
              genre={g}
              onSeeAll={() => setSelectedGenre(g.key)}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function GenreRow({ genre, onSeeAll, navigate }) {
  const { data, isLoading } = useQuery({
    queryKey: ['books', 'subject', genre.key],
    queryFn: () => booksApi.browseBySubject(genre.key, 12),
    staleTime: 10 * 60 * 1000,
  })

  const books = data?.books ?? []

  return (
    <div className={styles.genreRow}>
      <div className={styles.rowHeader}>
        <h2 className={styles.rowTitle}>
          <span className={styles.genreEmoji}>{genre.emoji}</span>
          {genre.label}
        </h2>
        <button className={styles.seeAll} onClick={onSeeAll}>See all →</button>
      </div>
      <div className={styles.rowScroll}>
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.bookSkeleton}>
              <div className={styles.coverSkeleton} />
              <div className={styles.titleSkeleton} />
              <div className={styles.authorSkeleton} />
            </div>
          ))
          : books.map(book => (
            <BookMini key={book.externalId} book={book} navigate={navigate} />
          ))
        }
      </div>
    </div>
  )
}

function GenreSection({ genre, limit, navigate }) {
  const { data, isLoading } = useQuery({
    queryKey: ['books', 'subject', genre.key, limit],
    queryFn: () => booksApi.browseBySubject(genre.key, limit),
    staleTime: 10 * 60 * 1000,
  })

  const books = data?.books ?? []

  return (
    <div className={`${styles.genreSection} fade-up`}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.genreEmoji}>{genre.emoji}</span>
        {genre.label}
        {data?.totalResults > 0 && (
          <span className={styles.totalCount}>
            {data.totalResults.toLocaleString()} books
          </span>
        )}
      </h2>
      <div className={styles.booksGrid}>
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={styles.bookSkeleton}>
              <div className={styles.coverSkeleton} />
              <div className={styles.titleSkeleton} />
              <div className={styles.authorSkeleton} />
            </div>
          ))
          : books.map(book => (
            <BookMini key={book.externalId} book={book} navigate={navigate} />
          ))
        }
      </div>
    </div>
  )
}

function BookMini({ book, navigate }) {
  return (
    <div
      className={styles.bookMini}
      onClick={() => navigate(`/book/${book.externalId}`)}
      title={book.title}
    >
      {book.coverUrl ? (
        <img
          src={book.coverUrlSmall || book.coverUrl}
          alt={book.title}
          className={styles.bookCover}
          loading="lazy"
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }}
        />
      ) : null}
      <div
        className={`${styles.bookCoverFallback} bc${((book.externalId?.charCodeAt(2) ?? 1) % 8) + 1}`}
        style={book.coverUrl ? { display: 'none' } : {}}
      >
        <span>{book.title?.charAt(0) ?? '?'}</span>
      </div>
      <div className={styles.bookTitle}>{book.title}</div>
      <div className={styles.bookAuthor}>{book.author}</div>
      {book.publishYear && (
        <div className={styles.bookYear}>{book.publishYear}</div>
      )}
    </div>
  )
}
