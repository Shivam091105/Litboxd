import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
// Google OAuth components are imported at the bottom of the file
import useAuthStore from '../store/authStore'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [mode, setMode] = useState('signin')
  const { login, register, googleLogin, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({ usernameOrEmail: '', password: '' })
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '', displayName: '' })

  // Google OAuth is available only when VITE_GOOGLE_CLIENT_ID is set
  const hasGoogleOAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  async function handleLogin(e) {
    e.preventDefault()
    clearError()
    const result = await login(loginForm.usernameOrEmail, loginForm.password)
    if (result.success) navigate('/')
  }

  async function handleRegister(e) {
    e.preventDefault()
    clearError()
    const result = await register(
      regForm.username, regForm.email, regForm.password, regForm.displayName
    )
    if (result.success) navigate('/')
  }

  // Called by the hidden Google button via credential response
  async function handleGoogleCredential(credentialResponse) {
    clearError()
    const result = await googleLogin(credentialResponse.credential)
    if (result.success) navigate('/')
  }

  return (
    <div className={styles.page}>

      {/* ── LEFT: Atmospheric panel ── */}
      <div className={styles.visual}>
        <div className={styles.visualBg} />
        <div className={styles.visualGrid} />
        <div className={styles.spinesWrap}>
          <div className={`${styles.spine} ${styles.s1}`}>DOSTOEVSKY</div>
          <div className={`${styles.spine} ${styles.s2}`}>WOOLF</div>
          <div className={`${styles.spine} ${styles.s3}`}>KAFKA</div>
          <div className={`${styles.spine} ${styles.s4}`}>TOLSTOY</div>
          <div className={`${styles.spine} ${styles.s5}`}>BORGES</div>
        </div>
        <div className={styles.quoteBlock}>
          <blockquote className={styles.quote}>
            "A reader lives a thousand lives before he dies. The man who never reads lives only one."
          </blockquote>
          <cite className={styles.quoteBy}>— George R.R. Martin</cite>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className={styles.formSide}>
        <div className={styles.formBox}>

          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <span className={styles.logoDot} />
            BookLens
          </Link>

          {/* Mode toggle */}
          <div className={styles.modeTabs}>
            <button
              type="button"
              className={`${styles.modeTab} ${mode === 'signin' ? styles.modeActive : ''}`}
              onClick={() => { setMode('signin'); clearError() }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${mode === 'signup' ? styles.modeActive : ''}`}
              onClick={() => { setMode('signup'); clearError() }}
            >
              Create account
            </button>
          </div>

          {/* Error */}
          {error && <div className={styles.errorBanner}>{error}</div>}

          {/* ── SIGN IN ── */}
          {mode === 'signin' && (
            <>
              <h1 className={styles.heading}>Welcome back.</h1>
              <p className={styles.sub}>Sign in to continue tracking your reading.</p>

              <form onSubmit={handleLogin} className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Email or username</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="you@example.com"
                    value={loginForm.usernameOrEmail}
                    onChange={e => setLoginForm(p => ({ ...p, usernameOrEmail: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.forgotRow}>
                  <button type="button" className={styles.forgotBtn}>Forgot password?</button>
                </div>
                <button type="submit" className={styles.btnSubmit} disabled={isLoading}>
                  {isLoading ? <span className={styles.spinner} /> : null}
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              {hasGoogleOAuth && <Divider />}
              <GoogleButton onCredential={handleGoogleCredential} label="Sign in with Google" enabled={hasGoogleOAuth} />

              <p className={styles.switchLine}>
                No account?{' '}
                <button className={styles.switchBtn} onClick={() => { setMode('signup'); clearError() }}>
                  Create one — it's free
                </button>
              </p>
            </>
          )}

          {/* ── SIGN UP ── */}
          {mode === 'signup' && (
            <>
              <h1 className={styles.heading}>Create your account.</h1>
              <p className={styles.sub}>Start tracking your reading in seconds.</p>

              <form onSubmit={handleRegister} className={styles.form}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full name</label>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="Aryan Kulkarni"
                      value={regForm.displayName}
                      onChange={e => setRegForm(p => ({ ...p, displayName: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Username</label>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="aryan_reads"
                      value={regForm.username}
                      onChange={e => setRegForm(p => ({ ...p, username: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="you@example.com"
                    value={regForm.email}
                    onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="At least 8 characters"
                    value={regForm.password}
                    onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                    required
                    minLength={8}
                  />
                </div>
                <button type="submit" className={styles.btnSubmit} disabled={isLoading}>
                  {isLoading ? <span className={styles.spinner} /> : null}
                  {isLoading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              {hasGoogleOAuth && <Divider />}
              <GoogleButton onCredential={handleGoogleCredential} label="Sign up with Google" enabled={hasGoogleOAuth} />

              <p className={styles.switchLine}>
                Already have an account?{' '}
                <button className={styles.switchBtn} onClick={() => { setMode('signin'); clearError() }}>
                  Sign in
                </button>
              </p>
              <p className={styles.terms}>
                By creating an account you agree to our{' '}
                <a href="#" className={styles.termsLink}>Terms</a> and{' '}
                <a href="#" className={styles.termsLink}>Privacy Policy</a>.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      margin: '20px 0', fontSize: 12, color: 'var(--text-muted)'
    }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span>or</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

// ── Real Google button using @react-oauth/google ───────────────────────────
import { GoogleLogin } from '@react-oauth/google'

function GoogleButton({ onCredential, label, enabled }) {
  if (!enabled) return null
  return (
    <div className={styles.googleWrap}>
      <GoogleLogin
        onSuccess={onCredential}
        onError={() => console.error('Google login failed')}
        useOneTap={false}
        shape="rectangular"
        size="large"
        width="400"
        text={label === 'Sign up with Google' ? 'signup_with' : 'signin_with'}
        theme="filled_black"
        logo_alignment="left"
      />
    </div>
  )
}
