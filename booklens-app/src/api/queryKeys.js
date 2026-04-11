export const keys = {
  books: {
    all:        ['books'],
    search:     (q)           => ['books', 'search', q],
    detail:     (externalId)  => ['books', externalId],
    ratingDist: (externalId)  => ['books', externalId, 'rating-dist'],
  },
  reviews: {
    popular:    ['reviews', 'popular'],
    byBook:     (externalId)  => ['reviews', 'book', externalId],
    byUser:     (userId)      => ['reviews', 'user', userId],
  },
  logs: {
    diary:      (status)  => ['diary', status ?? 'all'],
    feed:       ['feed'],
    challenge:  (year)    => ['challenge', year],
  },
  users: {
    profile:    (username) => ['users', username],
    suggestions: ['users', 'suggestions'],
  },
  recommendations: ['recommendations'],
}
