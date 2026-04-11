import { useState } from 'react'
import { Badge } from '../ui/Badge'
import styles from './ReviewCard.module.css'

/**
 * ReviewCard
 * Props: review { bookTitle, bookAuthor, bookYear, coverColor,
 *                 username, userInitial, userColor,
 *                 rating, text, likes, date, isPopular }
 */
export default function ReviewCard({ review }) {
  const {
    bookTitle, bookAuthor, bookYear, coverColor = 'bc1',
    username, userInitial, userColor,
    rating = 0, text, likes = 0, date, isPopular = false,
  } = review

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(likes)

  function toggleLike() {
    setLiked(p => !p)
    setLikeCount(p => liked ? p - 1 : p + 1)
  }

  const stars = '★'.repeat(rating)

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={`${styles.cover} ${coverColor}`} />
        <div className={styles.meta}>
          <div className={styles.bookTitle}>{bookTitle}</div>
          <div className={styles.bookAuthor}>{bookAuthor}{bookYear ? `, ${bookYear}` : ''}</div>
          <div className={styles.userRow}>
            <span className={styles.userAvatar} style={{ background: userColor }}>
              {userInitial}
            </span>
            <span className={styles.username}>{username}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.stars}>{stars}</span>
          </div>
          {isPopular && <Badge variant="amber">⭑ Popular</Badge>}
        </div>
      </div>

      {/* Review text */}
      <p className={styles.text}>{text}</p>

      {/* Footer */}
      <div className={styles.footer}>
        <button
          className={`${styles.likes} ${liked ? styles.liked : ''}`}
          onClick={toggleLike}
          type="button"
        >
          ♥ {likeCount} likes
        </button>
        <span className={styles.date}>{date}</span>
      </div>
    </div>
  )
}
