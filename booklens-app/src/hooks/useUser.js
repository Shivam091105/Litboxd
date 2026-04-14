import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logsApi }   from '../api/logs'
import { usersApi }  from '../api/users'
import { keys }      from '../api/queryKeys'
import useAuthStore  from '../store/authStore'

// ── Activity feed ─────────────────────────────────────────────────────────────
export function useFeed(size = 20) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return useQuery({
    queryKey: keys.logs.feed,
    queryFn:  () => logsApi.getFeed(0, size),
    enabled:  isAuthenticated,
    staleTime: 60 * 1000,  // 1 min — feeds update often
  })
}

// ── User diary ────────────────────────────────────────────────────────────────
export function useDiary(status = null, size = 20) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return useQuery({
    queryKey: keys.logs.diary(status),
    queryFn:  () => logsApi.getDiary(status, 0, size),
    enabled:  isAuthenticated,
  })
}

// ── Reading challenge ─────────────────────────────────────────────────────────
export function useChallenge(year = new Date().getFullYear()) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return useQuery({
    queryKey: keys.logs.challenge(year),
    queryFn:  () => logsApi.getChallengeProgress(year),
    enabled:  isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Personalised recommendations ──────────────────────────────────────────────
export function useRecommendations() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return useQuery({
    queryKey: keys.recommendations,
    queryFn:  () => usersApi.getRecommendations(),
    enabled:  isAuthenticated,
    // staleTime: 0 so React Query always treats this as stale and will
    // refetch whenever useLogBook calls invalidateQueries({ refetchType: 'all' }).
    // The heavy lifting (actual computation) is cached on the backend in Redis
    // and evicted on every log action, so the API round-trip is cheap.
    staleTime: 0,
  })
}

// ── User profile ──────────────────────────────────────────────────────────────
export function useProfile(username) {
  return useQuery({
    queryKey: keys.users.profile(username),
    queryFn:  () => usersApi.getProfile(username),
    enabled:  !!username,
    staleTime: 2 * 60 * 1000,
  })
}

// ── Suggested users to follow ─────────────────────────────────────────────────
export function useSuggestions(limit = 4) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return useQuery({
    queryKey: keys.users.suggestions,
    queryFn:  () => usersApi.getSuggestions(limit),
    enabled:  isAuthenticated,
    staleTime: 10 * 60 * 1000,
  })
}

// ── Follow / Unfollow (mutation) ──────────────────────────────────────────────
export function useFollowUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, isFollowing }) =>
      isFollowing ? usersApi.unfollow(userId) : usersApi.follow(userId),
    onSuccess: (_, { username }) => {
      queryClient.invalidateQueries({ queryKey: keys.users.profile(username) })
      queryClient.invalidateQueries({ queryKey: keys.users.suggestions })
    },
  })
}

// ── Update profile (mutation) ─────────────────────────────────────────────────
export function useUpdateProfile() {
  const queryClient  = useQueryClient()
  const updateUser   = useAuthStore(s => s.updateUser)

  return useMutation({
    mutationFn: (updates) => usersApi.updateProfile(updates),
    onSuccess: (data) => {
      // Sync auth store with new profile data
      updateUser(data)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}