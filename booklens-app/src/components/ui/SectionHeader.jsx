import styles from './SectionHeader.module.css'

/**
 * SectionHeader
 * Props: title, linkLabel, onLinkClick
 */
export default function SectionHeader({ title, linkLabel, onLinkClick }) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {linkLabel && (
        <button className={styles.link} onClick={onLinkClick} type="button">
          {linkLabel}
        </button>
      )}
    </div>
  )
}
