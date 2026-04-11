import styles from './ActivityItem.module.css'

/**
 * ActivityItem
 * Props: item {
 *   userInitial, userColor, username,
 *   action (jsx/string), bookMini { title, author, coverColor, rating },
 *   quote, coverList, time, likes, comments
 * }
 */
export default function ActivityItem({ item }) {
  const { userInitial, userColor, username, action, bookMini, quote, coverList, time, likes = 0, comments = 0 } = item

  return (
    <div className={styles.item}>
      {/* Avatar */}
      <div className={styles.avatar} style={{ background: userColor }}>
        {userInitial}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.text}>{action}</div>

        {/* Single book mini */}
        {bookMini && (
          <div className={styles.bookMini}>
            <div className={`${styles.miniCover} ${bookMini.coverColor}`} />
            <div className={styles.miniInfo}>
              <div className={styles.miniTitle}>{bookMini.title}</div>
              <div className={styles.miniAuthor}>
                {bookMini.author}{bookMini.rating ? ` · ${'★'.repeat(bookMini.rating)}` : ''}
              </div>
            </div>
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
