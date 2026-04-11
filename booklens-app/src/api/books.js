import api from './client'

export const booksApi = {
  /**
   * Search Open Library for books.
   * Returns paginated results with externalId as the book identifier.
   */
  search: (query, page = 0, size = 20) =>
    api.get('/books/search', { params: { q: query, page, size } }).then(r => r.data),

  /**
   * Get full detail for a book by Open Library work ID (e.g. "OL45804W").
   * Enriched with our DB stats and (if authenticated) user's log status.
   */
  getById: (externalId) =>
    api.get(`/books/${externalId}`).then(r => r.data),

  /**
   * Rating distribution from our users for a specific book.
   */
  getRatingDistribution: (externalId) =>
    api.get(`/books/${externalId}/rating-distribution`).then(r => r.data),

  /**
   * Browse books by subject/genre using Open Library's subjects API.
   * e.g. subject = "science_fiction", limit = 12
   */
  browseBySubject: (subject, limit = 20, offset = 0) =>
    api.get(`/books/subjects/${subject}`, { params: { limit, offset } }).then(r => r.data),
}
