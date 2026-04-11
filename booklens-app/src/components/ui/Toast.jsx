import { useEffect, useState } from 'react'
import styles from './Toast.module.css'

/**
 * Toast
 * Props: message, visible, onHide
 */
export default function Toast({ message, visible, onHide }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onHide, 2800)
      return () => clearTimeout(t)
    }
  }, [visible, onHide])

  return (
    <div className={`${styles.toast} ${visible ? styles.show : ''}`}>
      <span className={styles.check}>✓</span>
      <span>{message}</span>
    </div>
  )
}
