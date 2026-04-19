import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllUsers, useFollowUser } from '../hooks/useUser'
import { Skeleton } from '../components/ui/Skeleton'
import useAuthStore from '../store/authStore'
import styles from './MembersPage.module.css'

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function avatarGradient(username) {
    const gradients = [
        'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
        'linear-gradient(135deg,#1c3a5e,#0a1f3a)',
        'linear-gradient(135deg,#5e1c3a,#2e0a1f)',
        'linear-gradient(135deg,#3a3a1c,#1f1f0a)',
        'linear-gradient(135deg,#2d1b4e,#180f2e)',
        'linear-gradient(135deg,#4e2d1b,#2e180f)',
        'linear-gradient(135deg,#1b4e2d,#0f2e18)',
        'linear-gradient(135deg,#1b2d4e,#0f182e)',
    ]
    let h = 0
    for (let i = 0; i < (username?.length || 0); i++) h = (h * 31 + username.charCodeAt(i)) >>> 0
    return gradients[h % gradients.length]
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function MembersPage() {
    const { user: me, isAuthenticated } = useAuthStore()
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [page, setPage] = useState(0)
    const navigate = useNavigate()

    // Debounce search
    const [timer, setTimer] = useState(null)
    function handleSearchChange(value) {
        setSearch(value)
        if (timer) clearTimeout(timer)
        const t = setTimeout(() => {
            setDebouncedSearch(value)
            setPage(0)
        }, 400)
        setTimer(t)
    }

    const { data, isLoading } = useAllUsers(page, 20, debouncedSearch)
    const members = data?.content ?? []
    const totalPages = data?.totalPages ?? 0
    const totalMembers = data?.totalElements ?? 0

    return (
        <div className={styles.page}>
            {/* Page header */}
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderInner}>
                    <div>
                        <h1 className={styles.pageTitle}>Members</h1>
                        <p className={styles.pageSubtitle}>
                            Discover readers, explore their shelves, and follow the ones who share your taste.
                        </p>
                    </div>
                    <div className={styles.memberCount}>
                        <span className={styles.memberCountNum}>{totalMembers}</span>
                        <span className={styles.memberCountLabel}>readers</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarInner}>
                    <div className={styles.searchWrap}>
                        <span className={styles.searchIcon}>⌕</span>
                        <input
                            className={styles.searchInput}
                            placeholder="Search by name or username…"
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                        />
                        {search && (
                            <button className={styles.searchClear} onClick={() => { setSearch(''); setDebouncedSearch(''); setPage(0) }}>×</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Members grid */}
            <div className={styles.content}>
                {isLoading ? (
                    <div className={styles.membersGrid}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={styles.memberCard} style={{ padding: 24 }}>
                                <Skeleton height="56px" width="56px" borderRadius="50%" style={{ marginBottom: 16 }} />
                                <Skeleton height="18px" width="140px" style={{ marginBottom: 8 }} />
                                <Skeleton height="13px" width="100px" style={{ marginBottom: 12 }} />
                                <Skeleton height="48px" width="100%" borderRadius="8px" />
                            </div>
                        ))}
                    </div>
                ) : members.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyTitle}>No members found</div>
                        <div className={styles.emptyDesc}>
                            {debouncedSearch ? 'Try a different search term.' : 'Be the first to create an account!'}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={styles.membersGrid}>
                            {members.map(member => (
                                <MemberCard
                                    key={member.id}
                                    member={member}
                                    meId={me?.id}
                                    isAuthenticated={isAuthenticated}
                                    onViewProfile={() => navigate(`/profile/${member.username}`)}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    ← Previous
                                </button>
                                <span className={styles.pageInfo}>
                                    Page {page + 1} of {totalPages}
                                </span>
                                <button
                                    className={styles.pageBtn}
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

/* ── Member Card ─────────────────────────────────────────────────────────── */
function MemberCard({ member, meId, isAuthenticated, onViewProfile }) {
    const followMutation = useFollowUser()
    const [optimisticFollowing, setOptimisticFollowing] = useState(member.isFollowedByViewer)
    const [followerDelta, setFollowerDelta] = useState(0)

    const isSelf = meId && String(meId) === String(member.id)

    function handleFollow(e) {
        e.stopPropagation()
        if (!isAuthenticated) return
        const next = !optimisticFollowing
        setOptimisticFollowing(next)
        setFollowerDelta(next ? 1 : -1)
        followMutation.mutate({
            userId: member.id,
            isFollowing: optimisticFollowing,
            username: member.username,
        })
    }

    const initials = member.displayName
        ? member.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : member.username.slice(0, 2).toUpperCase()

    return (
        <div className={styles.memberCard} onClick={onViewProfile}>
            <div className={styles.cardTop}>
                <div className={styles.memberAvatar} style={{ background: avatarGradient(member.username) }}>
                    {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : initials}
                </div>
                {!isSelf && isAuthenticated && (
                    <button
                        className={`${styles.followBtn} ${optimisticFollowing ? styles.followingBtn : ''}`}
                        onClick={handleFollow}
                        type="button"
                    >
                        {optimisticFollowing ? 'Following' : 'Follow'}
                    </button>
                )}
            </div>

            <div className={styles.memberName}>{member.displayName}</div>
            <div className={styles.memberHandle}>@{member.username}</div>
            {member.location && <div className={styles.memberLocation}>📍 {member.location}</div>}
            {member.bio && <p className={styles.memberBio}>{member.bio}</p>}

            <div className={styles.memberStats}>
                <div className={styles.memberStat}>
                    <span className={styles.statNum}>{(member.booksRead || 0).toLocaleString()}</span>
                    <span className={styles.statLabel}>books</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.memberStat}>
                    <span className={styles.statNum}>{((member.followersCount || 0) + followerDelta).toLocaleString()}</span>
                    <span className={styles.statLabel}>followers</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.memberStat}>
                    <span className={styles.statNum}>{(member.followingCount || 0).toLocaleString()}</span>
                    <span className={styles.statLabel}>following</span>
                </div>
            </div>

            <div className={styles.viewProfile}>View full profile →</div>
        </div>
    )
}