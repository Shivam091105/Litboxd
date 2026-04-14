import api from './client'

export const listsApi = {
    getAll: () => api.get('/me/lists').then(r => r.data),
    ensureDefaults: () => api.post('/me/lists/ensure-defaults').then(r => r.data),
    create: (title, description = '') => api.post('/me/lists', { title, description }).then(r => r.data),
    update: (listId, title, description) => api.put(`/me/lists/${listId}`, { title, description }).then(r => r.data),
    delete: (listId) => api.delete(`/me/lists/${listId}`).then(r => r.data),
    addBook: (listId, externalId) => api.post(`/me/lists/${listId}/books`, { externalId }).then(r => r.data),
    removeBook: (listId, externalId) => api.delete(`/me/lists/${listId}/books/${externalId}`).then(r => r.data),
}