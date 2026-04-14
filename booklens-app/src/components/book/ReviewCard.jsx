import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import styles from './ReviewCard.module.css'

/**
 * ReviewCard — works with both API shape (ReviewDto) and normalised shape.
 *
 * API shape (ReviewDto):
 *   bookTitle, bookAuthor, bookCoverUrl, bookExternalId,
 *   username, displayName, content, likesCount, createdAt, rating
 *
 * Normalised legacy shape (used by HomePage etc.):
 *   bookTitle, bookAuthor, coverColor, coverUrl,
 *   username, userInitial, userColor, text, likes, date, rating
 */
export default function ReviewCard({ review, onEdit, onDelete, isOwn = false }) {
  const navigate = useNavigate()

  // Resolve fields — handle both API and normalised shapes
  const bookTitle = review.bookTitle || review.book?.title || ''
  const bookAuthor = review.bookAuthor || review.book?.author || ''
  const bookCoverUrl = review.bookCoverUrl || review.coverUrl || null
  const coverColor = review.coverColor || 'bc1'
  const externalId = review.bookExternalId || null
  const username = review.username || review.user?.username || 'Anonymous'
  const userInitial = review.userInitial || username.charAt(0).toUpperCase()
  const userColor = review.userColor || 'linear-gradient(135deg,#1c5e3a,#0d2e1a)'
  const text = review.content || review.text || ''
  const rating = typeof review.rating === 'number' ? review.rating : 0
  const initLikes = review.likesCount ?? review.likes ?? 0
  const date = review.date || (review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '')
  const isPopular = review.isPopular || initLikes > 50

  const [imgFailed, setImgFailed] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initLikes)

  const stars = rating > 0 ? '★'.repeat(Math.min(5, Math.max(1, Math.round(rating)))) : ''

  function toggleLike() {
    setLiked(p => !p)
    setLikeCount(p => liked ? p - 1 : p + 1)
  }

  function handleCardClick() {
    if (externalId) navigate(`/book/${externalId}`)
  }

  return (
    <div className={styles.card} onClick={handleCardClick}>
      {/* Header */}
      <div className={styles.header}>
        {/* Book cover */}
        <div className={`${styles.cover} ${(!bookCoverUrl || imgFailed) ? coverColor : ''}`}>
          {bookCoverUrl && !imgFailed && (
            <img
              src={bookCoverUrl}
              alt={bookTitle}
              className={styles.coverImg}
              onError={() => setImgFailed(true)}
            />
          )}
        </div>

        <div className={styles.meta}>
          <div className={styles.bookTitle}>{bookTitle || 'Unknown book'}</div>
          <div className={styles.bookAuthor}>{bookAuthor}</div>
          <div className={styles.userRow}>
            <span className={styles.userAvatar} style={{ background: userColor }}>
              {userInitial}
            </span>
            <span className={styles.username}>{username}</span>
            {stars && <><span className={styles.dot}>·</span><span className={styles.stars}>{stars}</span></>}
          </div>
          {isPopular && <Badge variant="amber">Popular</Badge>}
        </div>

        {/* Owner actions */}
        {isOwn && (onEdit || onDelete) && (
          <div className={styles.ownerActions} onClick={e => e.stopPropagation()}>
            {onEdit && <button className={styles.actionBtn} onClick={onEdit}>Edit</button>}
            {onDelete && <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={onDelete}>Delete</button>}
          </div>
        )}
      </div>

      {/* Review text */}
      {text && <p className={styles.text}>{text}</p>}

      {/* Footer */}
      <div className={styles.footer} onClick={e => e.stopPropagation()}>
        <button
          className={`${styles.likes} ${liked ? styles.liked : ''}`}
          onClick={toggleLike}
          type="button"
        >
          ♥ {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </button>
        <span className={styles.date}>{date}</span>
      </div>
    </div>
  )
}