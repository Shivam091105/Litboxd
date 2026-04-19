import { useNavigate } from 'react-router-dom'
import styles from './ActivityItem.module.css'

/**
 * ActivityItem — Letterboxd-style activity feed card
 * Props: item {
 *   userInitial, userColor, username,
 *   action (jsx/string), bookMini { title, author, coverUrl, coverColor, rating, externalId },
 *   quote, coverList, time, likes, comments
 * }
 */
export default function ActivityItem({ item }) {
  const { userInitial, userColor, username, action, bookMini, quote, coverList, time, likes = 0, comments = 0 } = item
  const navigate = useNavigate()

  function handleBookClick() {
    if (bookMini?.externalId) {
      navigate(`/book/${bookMini.externalId}`)
    }
  }

  return (
    <div className={styles.item}>
      {/* Avatar — clickable to profile */}
      <div
        className={styles.avatar}
        style={{ background: userColor, cursor: 'pointer' }}
        onClick={() => username ? navigate(`/profile/${username}`) : navigate('/members')}
        title={username ? `View ${username}'s profile` : undefined}
      >
        {userInitial}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.text}>{action}</div>

        {/* Single book mini — with cover image support */}
        {bookMini && (
          <div
            className={styles.bookMini}
            onClick={handleBookClick}
            style={bookMini.externalId ? { cursor: 'pointer' } : {}}
          >
            {bookMini.coverUrl ? (
              <img
                src={bookMini.coverUrl}
                alt={bookMini.title}
                className={styles.miniCoverImg}
                loading="lazy"
                onError={e => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'block')
                }}
              />
            ) : null}
            <div
              className={`${styles.miniCover} ${bookMini.coverColor}`}
              style={bookMini.coverUrl ? { display: 'none' } : {}}
            />
            <div className={styles.miniInfo}>
              <div className={styles.miniTitle}>{bookMini.title}</div>
              <div className={styles.miniAuthor}>
                {bookMini.author}{bookMini.rating ? ` · ${'★'.repeat(bookMini.rating)}` : ''}
              </div>
            </div>
            {bookMini.externalId && <span className={styles.miniArrow}>→</span>}
          </div>
        )}

        {/* Multiple covers (for logged lists) */}
        {coverList && (
          <div className={styles.coverList}>
            {coverList.map((c, i) => (
              <div key={i} className={`${styles.miniCoverSm} ${c}`} />
            ))}
          </div>
        )}

        {/* Review quote */}
        {quote && <blockquote className={styles.quote}>"{quote}"</blockquote>}

        {/* Timestamp + reactions */}
        <div className={styles.footer}>
          <span className={styles.time}>{time}</span>
          {likes > 0 && <span className={styles.reaction}>♥ {likes} likes</span>}
          {comments > 0 && <span className={styles.reaction}>💬 {comments} comments</span>}
        </div>
      </div>
    </div>
  )
}