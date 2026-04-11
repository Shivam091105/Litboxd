import StarRating from '../ui/StarRating'
import styles from './BookCard.module.css'

/**
 * BookCard
 *
 * Works with both Open Library API data (externalId, coverUrl)
 * and mock data (coverColor fallback).
 *
 * Props: book {
 *   externalId, title, author,
 *   coverUrl?, coverUrlSmall?,  <- real covers from Open Library
 *   coverColor?,                <- fallback colour swatch
 *   averageRating?, ratingsCount?
 * }
 */
export default function BookCard({ book, badge }) {
  const {
    title         = '',
    author        = '',
    coverUrl,
    coverUrlSmall,
    coverColor    = 'bc1',
    averageRating = 0,
    ratingsCount  = 0,
  } = book

  const stars       = averageRating > 0 ? '★'.repeat(Math.round(averageRating)) : ''
  const countLabel  = ratingsCount >= 1000
    ? `${(ratingsCount / 1000).toFixed(0)}k`
    : String(ratingsCount)
  const displayCover = coverUrlSmall || coverUrl

  return (
    <div className={styles.card}>
      <div className={`${styles.cover} ${!displayCover ? coverColor : ''}`}>
        {displayCover ? (
          <img
            src={displayCover}
            alt={title}
            className={styles.coverImg}
            loading="lazy"
            onError={e => {
              // Fall back to colour swatch if image fails
              e.target.style.display = 'none'
              e.target.parentElement.classList.add(coverColor)
            }}
          />
        ) : (
          <div className={styles.placeholder}>{title}</div>
        )}
        <div className={styles.overlay}>
          <StarRating initialRating={0} size="sm" readOnly={false} />
        </div>
      </div>

      <div className={styles.meta}>
        <div className={styles.title}>{title}</div>
        <div className={styles.author}>{author}</div>
        {(averageRating > 0 || ratingsCount > 0) && (
          <div className={styles.ratingRow}>
            <span className={styles.stars}>{stars}</span>
            {ratingsCount > 0 && (
              <span className={styles.count}>{countLabel}</span>
            )}
          </div>
        )}
        {badge && (
          <div className={styles.badge}>{badge}</div>
        )}
      </div>
    </div>
  )
}
