import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoDot} />
            BookLens
          </Link>
          <p className={styles.desc}>
            The social platform for readers. Track every book you've read,
            share your literary journey, and discover what to read next.
          </p>
        </div>

        <div>
          <div className={styles.colTitle}>Explore</div>
          <ul className={styles.links}>
            <li><a href="#">Popular books</a></li>
            <li><a href="#">New releases</a></li>
            <li><a href="#">Top lists</a></li>
            <li><a href="#">Genres</a></li>
            <li><a href="#">Awards</a></li>
          </ul>
        </div>

        <div>
          <div className={styles.colTitle}>Community</div>
          <ul className={styles.links}>
            <li><a href="#">Members</a></li>
            <li><a href="#">Reviews</a></li>
            <li><a href="#">Reading groups</a></li>
            <li><a href="#">Journal</a></li>
          </ul>
        </div>

        <div>
          <div className={styles.colTitle}>Company</div>
          <ul className={styles.links}>
            <li><a href="#">About</a></li>
            <li><a href="#">API</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© 2025 BookLens. All rights reserved.</span>
        <span className={styles.version}>v1.0.0-beta</span>
      </div>
    </footer>
  )
}
