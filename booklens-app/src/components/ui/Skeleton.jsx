import styles from './Skeleton.module.css'

/**
 * Skeleton
 * Props: width, height, borderRadius, style
 */
export function Skeleton({ width = '100%', height = '16px', borderRadius = '4px', style = {} }) {
  return (
    <div
      className={styles.skeleton}
      style={{ width, height, borderRadius, ...style }}
    />
  )
}

// Pre-built skeletons for common patterns

export function BookCardSkeleton() {
  return (
    <div>
      <Skeleton height="0" style={{ aspectRatio: '2/3', borderRadius: '10px' }} />
      <div style={{ marginTop: 10 }}>
        <Skeleton height="12px" width="80%" style={{ marginBottom: 6 }} />
        <Skeleton height="11px" width="55%" />
      </div>
    </div>
  )
}

export function ReviewCardSkeleton() {
  return (
    <div className={styles.reviewCard}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <Skeleton width="52px" height="78px" borderRadius="6px" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Skeleton height="15px" width="70%" style={{ marginBottom: 6 }} />
          <Skeleton height="12px" width="40%" style={{ marginBottom: 8 }} />
          <Skeleton height="12px" width="55%" />
        </div>
      </div>
      <Skeleton height="13px" style={{ marginBottom: 6 }} />
      <Skeleton height="13px" style={{ marginBottom: 6 }} />
      <Skeleton height="13px" width="75%" />
    </div>
  )
}

export function ActivityItemSkeleton() {
  return (
    <div className={styles.activityItem}>
      <Skeleton width="36px" height="36px" borderRadius="50%" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Skeleton height="13px" width="60%" style={{ marginBottom: 8 }} />
        <Skeleton height="13px" width="40%" style={{ marginBottom: 8 }} />
        <Skeleton height="11px" width="120px" />
      </div>
    </div>
  )
}
