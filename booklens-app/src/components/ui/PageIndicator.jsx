import { useLocation } from 'react-router-dom'
import styles from './PageIndicator.module.css'

const labels = {
  '/':        'Home',
  '/log':     'Log Book',
  '/profile': 'Profile',
}

export default function PageIndicator() {
  const { pathname } = useLocation()
  const label = labels[pathname] ?? 'BookLens'

  return (
    <div className={styles.indicator}>
      <span className={styles.dot} />
      <span>{label}</span>
    </div>
  )
}
