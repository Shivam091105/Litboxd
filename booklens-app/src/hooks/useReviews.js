import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '../api/reviews'
import { keys }       from '../api/queryKeys'

// ── Popular reviews (home page) ───────────────────────────────────────────────
export function usePopularReviews(size = 6) {
  return useQuery({
    queryKey: keys.reviews.popular,
    queryFn:  () => reviewsApi.getPopular(0, size),
    staleTime: 5 * 60 * 1000,
  })
}

// ── Reviews for a book ────────────────────────────────────────────────────────
export function useBookReviews(bookId, size = 10) {
  return useQuery({
    queryKey: keys.reviews.byBook(bookId),
    queryFn:  () => reviewsApi.getByBook(bookId, 0, size),
    enabled:  !!bookId,
  })
}

// ── Reviews by a user ─────────────────────────────────────────────────────────
export function useUserReviews(userId, size = 10) {
  return useQuery({
    queryKey: keys.reviews.byUser(userId),
    queryFn:  () => reviewsApi.getByUser(userId, 0, size),
    enabled:  !!userId,
  })
}

// ── Create review (mutation) ──────────────────────────────────────────────────
export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookId, content, hasSpoiler }) =>
      reviewsApi.create(bookId, content, hasSpoiler),
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: keys.reviews.byBook(bookId) })
      queryClient.invalidateQueries({ queryKey: keys.reviews.popular })
      queryClient.invalidateQueries({ queryKey: keys.books.detail(bookId) })
    },
  })
}

// ── Toggle like (mutation) ────────────────────────────────────────────────────
export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reviewId) => reviewsApi.toggleLike(reviewId),
    onSuccess: () => {
      // Refetch popular reviews and any open book review lists
      queryClient.invalidateQueries({ queryKey: keys.reviews.popular })
    },
  })
}

// ── Delete review (mutation) ──────────────────────────────────────────────────
export function useDeleteReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reviewId) => reviewsApi.delete(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}
