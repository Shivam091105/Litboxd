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
}
