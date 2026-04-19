import api from './client'

export const usersApi = {
  // Get a public profile by username
  getProfile: (username) =>
    api.get(`/users/${username}`).then(r => r.data),

  // Update own profile
  updateProfile: (updates) =>
    api.patch('/me', updates).then(r => r.data),

  // Follow a user
  follow: (userId) =>
    api.post(`/users/${userId}/follow`).then(r => r.data),

  // Unfollow a user
  unfollow: (userId) =>
    api.delete(`/users/${userId}/follow`).then(r => r.data),

  // Suggested users to follow
  getSuggestions: (limit = 4) =>
    api.get('/me/suggestions', { params: { limit } }).then(r => r.data),

  // Personalised book recommendations
  getRecommendations: () =>
    api.get('/me/recommendations').then(r => r.data),

  // List all users (for Members page)
  getAllUsers: (page = 0, size = 20, query = '') =>
    api.get('/users', { params: { page, size, ...(query ? { q: query } : {}) } }).then(r => r.data),

  // Get a user's followers
  getFollowers: (userId) =>
    api.get(`/users/${userId}/followers`).then(r => r.data),

  // Get who a user follows
  getFollowing: (userId) =>
    api.get(`/users/${userId}/following`).then(r => r.data),
}
