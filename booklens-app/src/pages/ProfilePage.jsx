import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReviewCard from '../components/book/ReviewCard'
import { StatusPill } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { useProfile, useDiary, useChallenge, useUpdateProfile, useFollowUser, useFollowers, useFollowing } from '../hooks/useUser'
import { useUserReviews } from '../hooks/useReviews'
import { listsApi } from '../api/lists'
import useAuthStore from '../store/authStore'
import { keys } from '../api/queryKeys'
import styles from './ProfilePage.module.css'

const TABS = ['Overview', 'Diary', 'Reviews', 'Lists', 'Network']
const DEFAULT_LISTS = ['Read', 'Currently Reading', 'Want to Read']

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function colorIndex(str) {
  if (!str) return 1
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return (h % 8) + 1
}
function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function normaliseReview(r) {
  const username = r.username ?? r.user?.username ?? 'Anonymous'
  return {
    id: r.id,
    bookTitle: r.bookTitle ?? r.book?.title ?? '',
    bookAuthor: r.bookAuthor ?? r.book?.author ?? '',
    bookCoverUrl: r.bookCoverUrl ?? null,
    bookExternalId: r.bookExternalId ?? null,
    coverColor: 'bc' + colorIndex(r.bookExternalId ?? ''),
    username,
    userInitial: (username || '?')[0].toUpperCase(),
    userColor: 'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
    rating: r.rating != null ? Math.round(r.rating) : 0,
    content: r.content ?? '',
    text: r.content ?? '',
    likes: r.likesCount ?? 0,
    likesCount: r.likesCount ?? 0,
    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) : '',
    isPopular: (r.likesCount ?? 0) > 50,
  }
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [showEdit, setShowEdit] = useState(false)
  const [showFavEdit, setShowFavEdit] = useState(false)
  const { user: me, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const params = useParams()

  // Determine whose profile to show:
  // - /profile/:username → show that user's profile (public view)
  // - /profile → show own profile (requires auth)
  const routeUsername = params.username
  const isOwnProfile = !routeUsername || (me && routeUsername === me.username)
  const profileUsername = routeUsername || me?.username

  // If no username (unauthenticated visiting /profile), show login prompt
  if (!profileUsername) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 40px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Your profile
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Sign in to view and manage your profile.
        </p>
        <button onClick={() => navigate('/login')} style={{
          background: 'var(--accent-green)', color: '#0d0f0e', border: 'none',
          borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer'
        }}>Sign in</button>
      </div>
    )
  }

  const { data: profile, isLoading: profileLoading } = useProfile(profileUsername)

  // Only load diary/reviews/challenge for own profile (requires auth)
  const { data: diaryData, isLoading: diaryLoading } = useDiary(null, 50)
  const { data: reviewsData, isLoading: reviewsLoading } = useUserReviews(
    isOwnProfile ? me?.id : profile?.id
  )
  const { data: challenge } = useChallenge()

  const diaryItems = isOwnProfile
    ? (Array.isArray(diaryData) ? diaryData : diaryData?.content ?? [])
    : []
  const reviewItems = Array.isArray(reviewsData) ? reviewsData : reviewsData?.content ?? []

  const initials = profile?.displayName
    ? profile.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : profileUsername?.slice(0, 2).toUpperCase() ?? 'BL'

  // Follow state
  const followMutation = useFollowUser()
  const [optimisticFollowing, setOptimisticFollowing] = useState(null) // null = use server

  const isFollowing = optimisticFollowing !== null
    ? optimisticFollowing
    : profile?.isFollowedByViewer ?? false

  function handleFollowToggle() {
    const next = !isFollowing
    setOptimisticFollowing(next)
    followMutation.mutate({
      userId: profile?.id,
      isFollowing: isFollowing,
      username: profileUsername,
    })
  }

  return (
    <div>
      <div className={styles.banner} />
      <div className={styles.headerWrap}>
        <div className={styles.headerInner}>
          <div className={styles.avatarXl}>{initials}</div>
          <div className={styles.identity}>
            {profileLoading ? (
              <>
                <Skeleton height="26px" width="200px" style={{ marginBottom: 8 }} />
                <Skeleton height="13px" width="120px" />
              </>
            ) : (
              <>
                <div className={styles.name}>{profile?.displayName || profileUsername}</div>
                <div className={styles.handle}>@{profile?.username || profileUsername}</div>
                {profile?.bio && <div className={styles.bio}>{profile.bio}</div>}
                {profile?.location && <div className={styles.location}>{profile.location}</div>}
              </>
            )}
          </div>
          <div className={styles.actions}>
            {isOwnProfile ? (
              /* Own profile: edit + log book */
              <>
                <button className={styles.btnOutline} type="button" onClick={() => setShowEdit(true)}>
                  Edit profile
                </button>
                <Link to="/log" className={styles.btnPrimary}>+ Log book</Link>
              </>
            ) : isAuthenticated ? (
              /* Other user's profile: follow/unfollow */
              <button
                className={`${styles.btnOutline} ${isFollowing ? styles.btnFollowing : ''}`}
                type="button"
                onClick={handleFollowToggle}
              >
                {isFollowing ? '✓ Following' : 'Follow'}
              </button>
            ) : (
              /* Not logged in: prompt to sign in */
              <button className={styles.btnPrimary} onClick={() => navigate('/login')}>
                Sign in to follow
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        <div className={styles.tabBarInner}>
          {TABS.map(t => {
            // Hide Lists tab for other users' profiles (they can't manage lists)
            if (t === 'Lists' && !isOwnProfile) return null
            return (
              <button key={t} type="button"
                className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
                {t === 'Reviews' && reviewItems.length > 0 && (
                  <span className={styles.tabCount}>{reviewItems.length}</span>
                )}
                {t === 'Network' && profile && (
                  <span className={styles.tabCount}>
                    {(profile.followersCount ?? 0) + (profile.followingCount ?? 0)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'Overview' && (
        <div className={styles.body}>
          <div className={styles.main}>
            {/* Stats */}
            <div className={styles.statsGrid}>
              {profileLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={styles.statBox}>
                    <Skeleton height="26px" width="50px" style={{ margin: '0 auto 6px' }} />
                    <Skeleton height="11px" width="44px" style={{ margin: '0 auto' }} />
                  </div>
                ))
                : [
                  ['Books', profile?.booksRead ?? 0, isOwnProfile ? () => setActiveTab('Diary') : null],
                  ['Reviews', profile?.reviewsCount ?? reviewItems.length, () => setActiveTab('Reviews')],
                  ['Lists', profile?.listsCount ?? 0, isOwnProfile ? () => setActiveTab('Lists') : null],
                  ['Followers', profile?.followersCount ?? 0, () => setActiveTab('Network')],
                  ['Following', profile?.followingCount ?? 0, () => setActiveTab('Network')],
                ].map(([label, val, onClick]) => (
                  <div key={label} className={styles.statBox} onClick={onClick || undefined}
                    style={onClick ? { cursor: 'pointer' } : {}}>
                    <div className={styles.sbNum}>{val}</div>
                    <div className={styles.sbLabel}>{label}</div>
                  </div>
                ))
              }
            </div>

            {/* Recent reads — only show diary for own profile */}
            {isOwnProfile && (
              <>
                <div className={styles.subHeader}>
                  <h3 className={styles.subTitle}>Recent reads</h3>
                  <button className={styles.subLink} onClick={() => setActiveTab('Diary')}>View diary</button>
                </div>
                <div className={styles.recentCovers}>
                  {diaryLoading
                    ? Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} width="60px" height="90px" borderRadius="6px" />)
                    : diaryItems.slice(0, 7).map(log => (
                      log.bookCoverUrl ? (
                        <img key={log.id} src={log.bookCoverUrl} alt={log.bookTitle}
                          className={styles.rCover}
                          onClick={() => navigate(`/book/${log.bookExternalId}`)}
                          onError={e => { e.target.style.display = 'none' }} />
                      ) : (
                        <div key={log.id}
                          className={`${styles.rCover} bc${colorIndex(log.bookExternalId)}`}
                          title={log.bookTitle}
                          onClick={() => navigate(`/book/${log.bookExternalId}`)} />
                      )
                    ))
                  }
                  {!diaryLoading && diaryItems.length === 0 && (
                    <p className={styles.emptyInline}>
                      No books logged yet. <Link to="/browse" style={{ color: 'var(--accent-green)' }}>Browse books</Link>
                    </p>
                  )}
                </div>
                <br></br>
                <br></br>
                {/* Reading challenge */}
                <div className={styles.subHeader}>
                  <h3 className={styles.subTitle}>Reading Challenge</h3>
                </div>
                {challenge && (
                  <div className={styles.challengeBox}>
                    <div className={styles.challengeTop}>
                      <div>
                        <span className={styles.challengeNum}>{challenge.booksRead}</span>
                        <span className={styles.challengeOf}> / {challenge.goal || 36} books</span>
                      </div>
                      <span className={styles.challengeYear}>{new Date().getFullYear()} challenge</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${Math.min(100, challenge.percent)}%` }} />
                    </div>
                    <div className={styles.challengeLabel}>{challenge.percent}% complete</div>
                  </div>
                )}
              </>
            )}

            {/* Public profile: show member since and about */}
            {!isOwnProfile && (
              <div style={{ marginBottom: 32 }}>
                <div className={styles.subHeader}>
                  <h3 className={styles.subTitle}>About</h3>
                </div>
                <div className={styles.accountInfo}>
                  {profile?.bio && (
                    <div className={styles.accountRow}>
                      <span className={styles.accountLabel}>Bio</span>
                      <span className={styles.accountValue} style={{ textAlign: 'left', flex: 1 }}>{profile.bio}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className={styles.accountRow}>
                      <span className={styles.accountLabel}>Location</span>
                      <span className={styles.accountValue}>{profile.location}</span>
                    </div>
                  )}
                  <div className={styles.accountRow}>
                    <span className={styles.accountLabel}>Member since</span>
                    <span className={styles.accountValue}>
                      {profile?.memberSince
                        ? new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                  <div className={styles.accountRow}>
                    <span className={styles.accountLabel}>Books read</span>
                    <span className={styles.accountValue}>{profile?.booksRead ?? 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent reviews (both own and public) */}
            <div className={styles.subHeader} style={{ marginTop: isOwnProfile ? 32 : 0 }}>
              <h3 className={styles.subTitle}>Recent reviews</h3>
              {reviewItems.length > 2 && (
                <button className={styles.subLink} onClick={() => setActiveTab('Reviews')}>All reviews</button>
              )}
            </div>
            {reviewsLoading ? (
              <Skeleton height="120px" borderRadius="10px" />
            ) : reviewItems.length > 0 ? (
              <div className={styles.reviewsList}>
                {reviewItems.slice(0, 2).map(r => (
                  <ReviewCard key={r.id} review={normaliseReview(r)} />
                ))}
              </div>
            ) : (
              <p className={styles.emptyInline}>
                {isOwnProfile ? 'No reviews yet. Log a book and share your thoughts.' : 'No reviews yet.'}
              </p>
            )}
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            {isOwnProfile && (
              <div className={styles.widget}>
                <div className={styles.widgetHeader}>
                  <div className={styles.widgetTitle}>Favourite books</div>
                  <button className={styles.widgetEdit} onClick={() => setShowFavEdit(true)}>Edit</button>
                </div>
                <FavouriteBooks diaryItems={diaryItems} navigate={navigate} userId={me?.id} />
              </div>
            )}
            <div className={styles.widget}>
              <div className={styles.widgetTitle}>Account</div>
              <div className={styles.accountInfo}>
                <div className={styles.accountRow}>
                  <span className={styles.accountLabel}>Username</span>
                  <span className={styles.accountValue}>@{profile?.username || profileUsername}</span>
                </div>
                {profile?.location && (
                  <div className={styles.accountRow}>
                    <span className={styles.accountLabel}>Location</span>
                    <span className={styles.accountValue}>{profile.location}</span>
                  </div>
                )}
                <div className={styles.accountRow}>
                  <span className={styles.accountLabel}>Member since</span>
                  <span className={styles.accountValue}>
                    {profile?.memberSince
                      ? new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
                {isOwnProfile && profile?.readingGoal && (
                  <div className={styles.accountRow}>
                    <span className={styles.accountLabel}>Goal</span>
                    <span className={styles.accountValue}>{profile.readingGoal} books / year</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DIARY TAB ── */}
      {activeTab === 'Diary' && (
        <div className={styles.tabContent}>
          <div className={styles.subHeader}>
            <h3 className={styles.subTitle}>Reading diary</h3>
            <span className={styles.subMeta}>{diaryItems.length} entries</span>
          </div>
          {!isOwnProfile ? (
            <p className={styles.emptyInline}>Diary is only visible to the profile owner.</p>
          ) : diaryLoading ? (
            <div className={styles.diaryList}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles.diaryItem}>
                  <Skeleton width="44px" height="66px" borderRadius="6px" />
                  <div style={{ flex: 1 }}>
                    <Skeleton height="14px" width="200px" style={{ marginBottom: 6 }} />
                    <Skeleton height="12px" width="120px" />
                  </div>
                </div>
              ))}
            </div>
          ) : diaryItems.length > 0 ? (
            <div className={styles.diaryList}>
              {diaryItems.map(log => (
                <div key={log.id} className={styles.diaryItem}
                  onClick={() => navigate(`/book/${log.bookExternalId}`)}>
                  {log.bookCoverUrl ? (
                    <img src={log.bookCoverUrl} alt={log.bookTitle} className={styles.diaryCover}
                      onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <div className={`${styles.diaryCover} bc${colorIndex(log.bookExternalId)}`} />
                  )}
                  <div className={styles.diaryInfo}>
                    <div className={styles.diaryTitle}>{log.bookTitle || log.bookExternalId}</div>
                    {log.bookAuthor && <div className={styles.diaryAuthor}>{log.bookAuthor}</div>}
                    {log.rating > 0 && <div className={styles.diaryRating}>{'★'.repeat(Math.round(log.rating))}</div>}
                    <div className={styles.diaryDate}>
                      {log.finishedAt ? `Finished ${formatDate(log.finishedAt)}`
                        : log.startedAt ? `Started ${formatDate(log.startedAt)}`
                          : `Added ${formatDate(log.updatedAt)}`}
                    </div>
                  </div>
                  <StatusPill status={log.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyInline} style={{ padding: '20px 0' }}>
              No books logged yet.{' '}
              <Link to="/browse" style={{ color: 'var(--accent-green)' }}>Browse books →</Link>
            </p>
          )}
        </div>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'Reviews' && (
        <div className={styles.tabContent}>
          <div className={styles.subHeader}>
            <h3 className={styles.subTitle}>Reviews</h3>
            <span className={styles.subMeta}>{reviewItems.length} total</span>
          </div>
          {reviewsLoading ? (
            <div className={styles.reviewsGrid}>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="180px" borderRadius="10px" />)}
            </div>
          ) : reviewItems.length > 0 ? (
            <div className={styles.reviewsGrid}>
              {reviewItems.map(r => <ReviewCard key={r.id} review={normaliseReview(r)} />)}
            </div>
          ) : (
            <div className={styles.emptyTab}>
              <div className={styles.emptyTitle}>No reviews yet</div>
              <div className={styles.emptyDesc}>
                {isOwnProfile
                  ? 'When you write a review on a book page, it will appear here.'
                  : `${profile?.displayName || profileUsername} hasn't written any reviews yet.`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LISTS TAB (own profile only) ── */}
      {activeTab === 'Lists' && isOwnProfile && (
        <ListsTab userId={me?.id} diaryItems={diaryItems} navigate={navigate} />
      )}

      {/* ── NETWORK TAB ── */}
      {activeTab === 'Network' && (
        <NetworkTab
          profile={profile}
          profileLoading={profileLoading}
          isOwnProfile={isOwnProfile}
          isAuthenticated={isAuthenticated}
          meId={me?.id}
        />
      )}

      {showEdit && isOwnProfile && (
        <EditProfileModal profile={profile} username={profileUsername} onClose={() => setShowEdit(false)} />
      )}
      {showFavEdit && isOwnProfile && (
        <EditFavouritesModal diaryItems={diaryItems} userId={me?.id} onClose={() => setShowFavEdit(false)} />
      )}
    </div>
  )
}

/* ── Lists Tab ───────────────────────────────────────────────────────────── */
function ListsTab({ userId, diaryItems, navigate }) {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDesc, setNewListDesc] = useState('')
  const [createError, setCreateError] = useState('')
  const [activeList, setActiveList] = useState(null)
  const [editingList, setEditingList] = useState(null)

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['lists', userId],
    queryFn: async () => {
      return await listsApi.ensureDefaults()
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: ({ title, description }) => listsApi.create(title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', userId] })
      setShowCreate(false); setNewListName(''); setNewListDesc(''); setCreateError('')
    },
    onError: (err) => setCreateError(err?.response?.data?.message || 'Failed to create list.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (listId) => listsApi.delete(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', userId] })
      if (activeList) setActiveList(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ listId, title, description }) => listsApi.update(listId, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', userId] })
      setEditingList(null)
    },
  })

  const addBookMutation = useMutation({
    mutationFn: ({ listId, externalId }) => listsApi.addBook(listId, externalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists', userId] }),
  })

  const removeBookMutation = useMutation({
    mutationFn: ({ listId, externalId }) => listsApi.removeBook(listId, externalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists', userId] }),
  })

  const currentList = activeList ? lists.find(l => l.id === activeList.id) : null

  const listBooks = currentList
    ? currentList.externalBookIds.map(eid => {
      const log = diaryItems.find(d => d.bookExternalId === eid)
      return {
        externalId: eid, title: log?.bookTitle || eid, author: log?.bookAuthor || '',
        coverUrl: log?.bookCoverUrl || null
      }
    })
    : []

  return (
    <div className={styles.tabContent}>
      <div className={styles.subHeader}>
        <h3 className={styles.subTitle}>
          {activeList ? currentList?.title || activeList.title : 'My lists'}
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeList && (
            <button className={styles.subLink} onClick={() => setActiveList(null)}>
              ← All lists
            </button>
          )}
          {!activeList && (
            <button className={styles.btnPrimarySmall} onClick={() => setShowCreate(true)}>
              + New list
            </button>
          )}
        </div>
      </div>

      {showCreate && !activeList && (
        <div className={styles.createListForm}>
          <input
            className={styles.listInput}
            placeholder="List name…"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            maxLength={200}
            autoFocus
          />
          <input
            className={styles.listInput}
            placeholder="Description (optional)"
            value={newListDesc}
            onChange={e => setNewListDesc(e.target.value)}
          />
          {createError && <p className={styles.listError}>{createError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={styles.btnGhost} onClick={() => { setShowCreate(false); setCreateError('') }}>
              Cancel
            </button>
            <button
              className={styles.btnPrimarySmall}
              disabled={!newListName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate({ title: newListName.trim(), description: newListDesc.trim() })}
            >
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {!activeList && (
        isLoading ? (
          <div className={styles.listsGrid}>
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="100px" borderRadius="10px" />)}
          </div>
        ) : (
          <div className={styles.listsGrid}>
            {lists.map(list => (
              <div key={list.id} className={styles.listCard} onClick={() => setActiveList(list)}>
                <div className={styles.listCardHeader}>
                  <div className={styles.listCardTitle}>{list.title}</div>
                  {list.isDefault && <span className={styles.listDefaultBadge}>Default</span>}
                </div>
                {list.description && <p className={styles.listCardDesc}>{list.description}</p>}
                <div className={styles.listCardMeta}>
                  {list.bookCount} {list.bookCount === 1 ? 'book' : 'books'}
                </div>
                {list.externalBookIds?.length > 0 && (
                  <div className={styles.listMiniCovers}>
                    {list.externalBookIds.slice(0, 5).map(eid => {
                      const log = diaryItems.find(d => d.bookExternalId === eid)
                      return log?.bookCoverUrl ? (
                        <img key={eid} src={log.bookCoverUrl} alt={log.bookTitle}
                          className={styles.listMiniCover}
                          onError={e => { e.target.style.display = 'none' }} />
                      ) : (
                        <div key={eid} className={`${styles.listMiniCover} bc${colorIndex(eid)}`} />
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {activeList && currentList && (
        <div>
          {!currentList.isDefault && (
            <div className={styles.listActions}>
              {editingList ? (
                <div className={styles.createListForm}>
                  <input
                    className={styles.listInput}
                    value={editingList.title}
                    onChange={e => setEditingList(p => ({ ...p, title: e.target.value }))}
                    maxLength={200}
                    placeholder="List name"
                  />
                  <input
                    className={styles.listInput}
                    value={editingList.description}
                    onChange={e => setEditingList(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description (optional)"
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className={styles.btnGhost} onClick={() => setEditingList(null)}>Cancel</button>
                    <button
                      className={styles.btnPrimarySmall}
                      disabled={!editingList.title.trim() || updateMutation.isPending}
                      onClick={() => updateMutation.mutate({
                        listId: currentList.id,
                        title: editingList.title.trim(),
                        description: editingList.description.trim(),
                      })}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={styles.btnGhost}
                    onClick={() => setEditingList({ id: currentList.id, title: currentList.title, description: currentList.description })}>
                    Rename
                  </button>
                  <button className={`${styles.btnGhost} ${styles.btnDanger}`}
                    onClick={() => { if (window.confirm(`Delete "${currentList.title}"?`)) deleteMutation.mutate(currentList.id) }}>
                    Delete list
                  </button>
                </div>
              )}
            </div>
          )}

          {diaryItems.length > 0 && (
            <div className={styles.addBooksSection}>
              <div className={styles.addBooksLabel}>Add books from your diary</div>
              <div className={styles.addBooksScroll}>
                {diaryItems
                  .filter(log => !currentList.externalBookIds.includes(log.bookExternalId))
                  .slice(0, 20)
                  .map(log => (
                    <button
                      key={log.id}
                      className={styles.addBookChip}
                      onClick={() => addBookMutation.mutate({ listId: currentList.id, externalId: log.bookExternalId })}
                      title={log.bookTitle}
                    >
                      {log.bookCoverUrl ? (
                        <img src={log.bookCoverUrl} alt={log.bookTitle}
                          className={styles.addBookCover}
                          onError={e => { e.target.style.display = 'none' }} />
                      ) : (
                        <div className={`${styles.addBookCover} bc${colorIndex(log.bookExternalId)}`} />
                      )}
                      <span className={styles.addBookTitle}>{log.bookTitle || log.bookExternalId}</span>
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {listBooks.length > 0 ? (
            <div className={styles.listBookGrid}>
              {listBooks.map(book => (
                <div key={book.externalId} className={styles.listBookCard}>
                  <div className={styles.listBookCoverWrap}
                    onClick={() => navigate(`/book/${book.externalId}`)}>
                    {book.coverUrl && !book._imgFailed ? (
                      <img src={book.coverUrl} alt={book.title}
                        className={styles.listBookCover}
                        onError={e => { e.target.style.display = 'none' }} />
                    ) : (
                      <div className={`${styles.listBookCover} bc${colorIndex(book.externalId)}`} />
                    )}
                  </div>
                  <div className={styles.listBookMeta}>
                    <p className={styles.listBookTitle}>{book.title}</p>
                    {book.author && <p className={styles.listBookAuthor}>{book.author}</p>}
                  </div>
                  <button
                    className={styles.removeBookBtn}
                    onClick={() => removeBookMutation.mutate({ listId: currentList.id, externalId: book.externalId })}
                    title="Remove from list"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyTab}>
              <div className={styles.emptyTitle}>Empty list</div>
              <div className={styles.emptyDesc}>Add books from your diary using the picker above.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Network Tab (real API data) ─────────────────────────────────────────── */
function NetworkTab({ profile, profileLoading, isOwnProfile, isAuthenticated, meId }) {
  const navigate = useNavigate()
  const [networkTab, setNetworkTab] = useState('followers')
  const followMutation = useFollowUser()

  const userId = profile?.id
  const { data: followers = [], isLoading: loadingFollowers } = useFollowers(userId)
  const { data: following = [], isLoading: loadingFollowing } = useFollowing(userId)

  const displayed = networkTab === 'following' ? following : followers
  const isLoading = networkTab === 'following' ? loadingFollowing : loadingFollowers

  function handleFollow(u) {
    if (!isAuthenticated) return navigate('/login')
    followMutation.mutate({
      userId: u.id,
      isFollowing: u.isFollowedByViewer,
      username: u.username,
    })
  }

  return (
    <div className={styles.tabContent}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {[
          ['followers', `Followers (${profile?.followersCount ?? followers.length})`],
          ['following', `Following (${profile?.followingCount ?? following.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`${styles.tab} ${networkTab === key ? styles.tabActive : ''}`}
            onClick={() => setNetworkTab(key)}
            style={{ fontSize: 13, padding: '12px 20px' }}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <Skeleton width="44px" height="44px" borderRadius="50%" />
              <div style={{ flex: 1 }}>
                <Skeleton height="14px" width="140px" style={{ marginBottom: 6 }} />
                <Skeleton height="12px" width="100px" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className={styles.emptyTab}>
          <div className={styles.emptyTitle}>
            {networkTab === 'following' ? 'Not following anyone yet' : 'No followers yet'}
          </div>
          <div className={styles.emptyDesc}>
            {networkTab === 'following'
              ? 'Find readers to follow in the Members section.'
              : 'Share your profile to gain followers.'}
          </div>
          {networkTab === 'following' && (
            <button
              onClick={() => navigate('/members')}
              style={{ marginTop: 16, background: 'var(--accent-green)', color: '#0d0f0e', border: 'none', borderRadius: 20, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Browse members →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {displayed.map((u, i) => {
            const initials = (u.displayName || u.username || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            const isSelf = meId && String(meId) === String(u.id)
            const gradient = avatarGradient(u.username)
            return (
              <div key={u.id || u.username} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.85)', flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/profile/${u.username}`)}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{u.displayName || u.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>@{u.username} · {u.booksRead ?? 0} books</div>
                </div>
                {!isSelf && isAuthenticated && (
                  <button
                    onClick={() => handleFollow(u)}
                    style={{
                      padding: '6px 16px', border: `1px solid ${u.isFollowedByViewer ? 'var(--accent-green)' : 'var(--border-light)'}`,
                      background: u.isFollowedByViewer ? 'var(--accent-green-dim)' : 'transparent',
                      color: u.isFollowedByViewer ? 'var(--accent-green)' : 'var(--text-secondary)',
                      borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                    }}
                  >
                    {u.isFollowedByViewer ? 'Following' : 'Follow'}
                  </button>
                )}
                <button
                  onClick={() => navigate(`/profile/${u.username}`)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'color 0.2s' }}
                  title="View profile"
                >
                  →
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Discover more */}
      <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-muted)', marginBottom: 12 }}>Discover readers</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Find readers who share your taste in books. Browse the Members section to discover literary companions.
        </p>
        <button
          onClick={() => navigate('/members')}
          style={{ background: 'var(--accent-green)', color: '#0d0f0e', border: 'none', borderRadius: 20, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          Browse all members →
        </button>
      </div>
    </div>
  )
}

/* Helper for avatar gradients */
function avatarGradient(username) {
  const gradients = [
    'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
    'linear-gradient(135deg,#1c3a5e,#0a1f3a)',
    'linear-gradient(135deg,#5e1c3a,#2e0a1f)',
    'linear-gradient(135deg,#3a3a1c,#1f1f0a)',
    'linear-gradient(135deg,#2d1b4e,#180f2e)',
    'linear-gradient(135deg,#4e2d1b,#2e180f)',
  ]
  let h = 0
  for (let i = 0; i < (username?.length || 0); i++) h = (h * 31 + username.charCodeAt(i)) >>> 0
  return gradients[h % gradients.length]
}

/* ── FavouriteBooks widget ───────────────────────────────────────────────── */
function FavouriteBooks({ diaryItems, navigate, userId }) {
  const favKey = userId ? `booklens-favourites-${userId}` : 'booklens-favourites'
  const [favIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(favKey) || '[]') } catch { return [] }
  })

  const favItems = favIds.map(id => diaryItems.find(d => d.bookExternalId === id)).filter(Boolean)
  const displayItems = favItems.length > 0 ? favItems.slice(0, 4) : diaryItems.slice(0, 4)
  const empties = Math.max(0, 4 - displayItems.length)

  return (
    <div className={styles.favGrid}>
      {displayItems.map(log => (
        log.bookCoverUrl ? (
          <img key={log.id} src={log.bookCoverUrl} alt={log.bookTitle}
            className={styles.favCover}
            onClick={() => navigate(`/book/${log.bookExternalId}`)}
            onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div key={log.id}
            className={`${styles.favCover} bc${colorIndex(log.bookExternalId)}`}
            title={log.bookTitle}
            onClick={() => navigate(`/book/${log.bookExternalId}`)} />
        )
      ))}
      {Array.from({ length: empties }).map((_, i) => (
        <div key={`e-${i}`} className={styles.favCoverEmpty} />
      ))}
    </div>
  )
}

/* ── Edit Favourites Modal ───────────────────────────────────────────────── */
function EditFavouritesModal({ diaryItems, userId, onClose }) {
  const favKey = userId ? `booklens-favourites-${userId}` : 'booklens-favourites'
  const [selected, setSelected] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(favKey) || '[]')) } catch { return new Set() }
  })

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 4) next.add(id)
      return next
    })
  }

  function save() {
    localStorage.setItem(favKey, JSON.stringify([...selected]))
    onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Choose favourite books</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <p className={styles.modalSub}>Select up to 4 books to pin to your profile.</p>
        <div className={styles.favSelectGrid}>
          {diaryItems.map(log => {
            const id = log.bookExternalId
            const isSel = selected.has(id)
            const isDisabled = !isSel && selected.size >= 4
            return (
              <button key={log.id}
                className={`${styles.favSelectItem} ${isSel ? styles.favSelectItemActive : ''} ${isDisabled ? styles.favSelectItemDisabled : ''}`}
                onClick={() => !isDisabled && toggle(id)} title={log.bookTitle}
              >
                {log.bookCoverUrl ? (
                  <img src={log.bookCoverUrl} alt={log.bookTitle} className={styles.favSelectCover}
                    onError={e => { e.target.style.display = 'none' }} />
                ) : (
                  <div className={`${styles.favSelectCover} bc${colorIndex(id)}`} />
                )}
                {isSel && <div className={styles.favCheckmark}>✓</div>}
              </button>
            )
          })}
        </div>
        <div className={styles.modalActions}>
          <span className={styles.modalCount}>{selected.size} / 4 selected</span>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={save}>Save favourites</button>
        </div>
      </div>
    </div>
  )
}

/* ── Edit Profile Modal ──────────────────────────────────────────────────── */
function EditProfileModal({ profile, username, onClose }) {
  const updateProfile = useUpdateProfile()
  const updateUser = useAuthStore(s => s.updateUser)
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    readingGoal: profile?.readingGoal || 36,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      await updateProfile.mutateAsync({
        displayName: form.displayName.trim() || undefined,
        bio: form.bio.trim() || undefined,
        location: form.location.trim() || undefined,
        readingGoal: Number(form.readingGoal) || 36,
      })
      updateUser({ displayName: form.displayName.trim() || undefined })
      queryClient.invalidateQueries({ queryKey: keys.users.profile(username) })
      setSuccess(true)
      setTimeout(onClose, 700)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit profile</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Display name</label>
          <input className={styles.formInput} value={form.displayName}
            onChange={e => set('displayName', e.target.value)} placeholder="Your display name" maxLength={100} />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Bio</label>
          <textarea className={styles.formTextarea} value={form.bio}
            onChange={e => set('bio', e.target.value)}
            placeholder="Tell other readers about yourself…" rows={3} maxLength={500} />
          <span className={styles.charCount}>{form.bio.length} / 500</span>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Location</label>
          <input className={styles.formInput} value={form.location}
            onChange={e => set('location', e.target.value)} placeholder="City, Country" maxLength={100} />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Reading goal (books per year)</label>
          <input className={styles.formInput} type="number" min={1} max={500}
            value={form.readingGoal} onChange={e => set('readingGoal', e.target.value)} />
        </div>
        {error && <p className={styles.formError}>{error}</p>}
        {success && <p className={styles.formSuccess}>Saved!</p>}
        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}