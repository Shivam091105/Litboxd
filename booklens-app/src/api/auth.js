import api from './client'

export const authApi = {
  register: (data) =>
    api.post('/auth/register', data).then(r => r.data),

  login: (data) =>
    api.post('/auth/login', data).then(r => r.data),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }).then(r => r.data),

  // Google OAuth — send Google credential token, get back our JWT
  googleSignIn: (credential) =>
    api.post('/auth/google', { credential }).then(r => r.data),
}
