import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { booksApi } from '../api/books'
import { logsApi } from '../api/logs'
import { keys } from '../api/queryKeys'

// ── Popular books — fetch from Open Library using curated search terms ────────
const POPULAR_QUERIES = ['best novels 2024', 'award winning fiction', 'modern classics']

export function usePopularBooks(limit = 8) {
  return useQuery({
    queryKey: ['books', 'popular'],
    queryFn: async () => {
      // Fetch from multiple curated searches and merge
      const results = await booksApi.search('award winning fiction', 0, limit)
      return results.books?.slice(0, limit) ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ── Search books ──────────────────────────────────────────────────────────────
export function useBookSearch(query, { enabled = true } = {}) {
  return useQuery({
    queryKey: keys.books.search(query),
    queryFn: () => booksApi.search(query),
    enabled: enabled && !!query && query.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
    placeholderData: { books: [], totalResults: 0, hasMore: false, query: '' },
  })
}

// ── Single book detail ────────────────────────────────────────────────────────
export function useBook(externalId) {
  return useQuery({
    queryKey: keys.books.detail(externalId),
    queryFn: () => booksApi.getById(externalId),
    enabled: !!externalId,
    staleTime: 30 * 60 * 1000,
  })
}

// ── Rating distribution ───────────────────────────────────────────────────────
export function useRatingDistribution(externalId) {
  return useQuery({
    queryKey: keys.books.ratingDist(externalId),
    queryFn: () => booksApi.getRatingDistribution(externalId),
    enabled: !!externalId,
  })
}

// ── Log a book ────────────────────────────────────────────────────────────────
export function useLogBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookExternalId, payload }) => logsApi.logBook(bookExternalId, payload),
    onSuccess: (_, { bookExternalId }) => {
      queryClient.invalidateQueries({ queryKey: keys.logs.diary() })
      queryClient.invalidateQueries({ queryKey: keys.logs.feed })
      queryClient.invalidateQueries({ queryKey: keys.recommendations })
      queryClient.invalidateQueries({ queryKey: keys.books.detail(bookExternalId) })
    },
  })
}

// ── Delete log ────────────────────────────────────────────────────────────────
export function useDeleteLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (logId) => logsApi.deleteLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.logs.diary() })
      queryClient.invalidateQueries({ queryKey: keys.recommendations })
    },
  })
}

// ── Browse books by subject ───────────────────────────────────────────────────
export function useBrowseBySubject(subject, limit = 12) {
  return useQuery({
    queryKey: ['books', 'subject', subject],
    queryFn: () => booksApi.browseBySubject(subject, limit),
    enabled: !!subject,
    staleTime: 10 * 60 * 1000,
  })
}
