import styles from './Badge.module.css'

/** variant: 'amber' | 'green' | 'red' | 'muted' */
export function Badge({ children, variant = 'amber' }) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  )
}

export function Tag({ children }) {
  return <span className={styles.tag}>{children}</span>
}

export function StatusPill({ status }) {
  const map = {
    READ:     { label: 'Read',          cls: styles.read },
    READING:  { label: 'Reading',       cls: styles.reading },
    WANT:     { label: 'Want to Read',  cls: styles.want },
  }
  const { label, cls } = map[status] ?? map.WANT
  return <span className={`${styles.pill} ${cls}`}>{label}</span>
}
