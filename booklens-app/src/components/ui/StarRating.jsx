import { useState } from 'react'
import styles from './StarRating.module.css'

const LABELS = {
  0: '',
  1: "Didn't like it",
  2: 'It was ok',
  3: 'Liked it',
  4: 'Really liked it',
  5: 'It was amazing ✦',
}

/**
 * StarRating
 * Props:
 *   initialRating  number  (0-5, default 0)
 *   onChange       fn(rating: number)
 *   size           'sm' | 'md' | 'lg'   (default 'md')
 *   readOnly       boolean
 */
export default function StarRating({
  initialRating = 0,
  onChange,
  size = 'md',
  readOnly = false,
}) {
  const [rating, setRating] = useState(initialRating)
  const [hovered, setHovered] = useState(0)

  function handleClick(n) {
    if (readOnly) return
    setRating(n)
    onChange?.(n)
  }

  const active = hovered || rating

  return (
    <div className={styles.wrapper}>
      <div className={styles.stars} data-size={size}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            className={`${styles.star} ${n <= active ? styles.lit : ''}`}
            onClick={() => handleClick(n)}
            onMouseEnter={() => !readOnly && setHovered(n)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
            disabled={readOnly}
          >
            ★
          </button>
        ))}
      </div>
      {size === 'lg' && !readOnly && (
        <span className={styles.label}>{LABELS[active]}</span>
      )}
    </div>
  )
}
