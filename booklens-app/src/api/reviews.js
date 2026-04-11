import api from './client'

export const reviewsApi = {
  // Write a review — externalBookId is the Open Library work ID
  create: (bookExternalId, content, hasSpoiler = false) =>
    api.post(`/books/${bookExternalId}/reviews`, { content, hasSpoiler }).then(r => r.data),

  update: (reviewId, content, hasSpoiler = false) =>
    api.put(`/reviews/${reviewId}`, { content, hasSpoiler }).then(r => r.data),

  delete: (reviewId) =>
    api.delete(`/reviews/${reviewId}`).then(r => r.data),

  toggleLike: (reviewId) =>
    api.post(`/reviews/${reviewId}/like`).then(r => r.data),

  getByBook: (bookExternalId, page = 0, size = 10) =>
    api.get(`/books/${bookExternalId}/reviews`, { params: { page, size } }).then(r => r.data),

  getPopular: (page = 0, size = 6) =>
    api.get('/reviews/popular', { params: { page, size } }).then(r => r.data),

  getByUser: (userId, page = 0, size = 10) =>
    api.get(`/users/${userId}/reviews`, { params: { page, size } }).then(r => r.data),
}
