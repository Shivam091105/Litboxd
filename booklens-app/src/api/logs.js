import api from './client'

export const logsApi = {
  /**
   * Log or update a book entry.
   * bookExternalId is the Open Library work ID, e.g. "OL45804W"
   *
   * payload: {
   *   status:       "READ" | "READING" | "WANT",
   *   rating?:      4.5,           // 0.5 – 5.0
   *   startedAt?:   "2025-01-01",  // ISO date string
   *   finishedAt?:  "2025-01-20",
   *   reread?:      false,
   *   privateEntry?: false,
   *   tags?:        "favourites,2025-reads"
   * }
   */
  logBook: (bookExternalId, payload) =>
    api.post(`/books/${bookExternalId}/log`, payload).then(r => r.data),

  deleteLog: (logId) =>
    api.delete(`/logs/${logId}`).then(r => r.data),

  getDiary: (status = null, page = 0, size = 20) =>
    api.get('/me/diary', {
      params: { ...(status && { status }), page, size }
    }).then(r => r.data),

  getFeed: (page = 0, size = 20) =>
    api.get('/me/feed', { params: { page, size } }).then(r => r.data),

  getChallengeProgress: (year = new Date().getFullYear()) =>
    api.get('/me/challenge', { params: { year } }).then(r => r.data),
}
