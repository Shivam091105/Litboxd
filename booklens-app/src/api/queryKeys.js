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
    all:        (page, q) => ['users', 'all', page, q ?? ''],
    profile:    (username) => ['users', username],
    suggestions: ['users', 'suggestions'],
    followers:  (userId)  => ['users', userId, 'followers'],
    following:  (userId)  => ['users', userId, 'following'],
  },
  recommendations: ['recommendations'],
}
