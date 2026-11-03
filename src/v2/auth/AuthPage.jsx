import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'
import Icon from '../icons.jsx'
import Brand from '../Brand.jsx'
import ThemeToggle from '../../components/ThemeToggle.jsx'

export default function AuthPage({ mode = 'login' }) {
  const isSignup = mode === 'signup'
  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedNextPath = searchParams.get('next')
  const nextPath = requestedNextPath && requestedNextPath.startsWith('/') && !requestedNextPath.startsWith('//')
    ? requestedNextPath
    : '/app'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async event => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!email.trim() || !password) {
      setError('Enter your email address and password.')
      return
    }
    if (isSignup && !name.trim()) {
      setError('Enter your name to create an account.')
      return
    }
    if (isSignup && password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      if (isSignup) {
        await signUp({ name, email, password })
        navigate(nextPath || '/app', { replace: true })
      } else {
        await signIn(email, password)
        navigate(nextPath, { replace: true })
      }
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'An account already exists with this email address.',
        'auth/invalid-credential': 'The email address or password is incorrect.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.'
      }
      setError(messages[err.code] || 'We could not complete that request. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const forgotPassword = async () => {
    setError('')
    setNotice('')
    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }
    setBusy(true)
    try {
      await resetPassword(email)
      setNotice('Password reset instructions have been sent if the account exists.')
    } catch {
      setError('We could not send a reset email. Check the address and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="v2-auth-page">
      <section className="v2-auth-card">
        <div className="v2-auth-topline"><Brand to="/app/login" className="v2-auth-brand" /><ThemeToggle /></div>
        <div className="v2-auth-heading">
          <span className="v2-eyebrow">{isSignup ? 'GET STARTED' : 'WELCOME BACK'}</span>
          <h1>{isSignup ? 'Create your account' : 'Sign in to PLTK'}</h1>
          <p>{isSignup ? 'Start organising launches with your team.' : 'Pick up where your team left off.'}</p>
        </div>

        {error && <div className="v2-alert v2-alert-error" role="alert">{error}</div>}
        {notice && <div className="v2-alert v2-alert-success" role="status">{notice}</div>}

        <form onSubmit={submit} className="v2-form">
          {isSignup && (
            <label className="v2-field">
              <span>Full name</span>
              <input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </label>
          )}
          <label className="v2-field">
            <span>Email address</span>
            <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
          </label>
          <label className="v2-field">
            <span>Password</span>
            <input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </label>
          {!isSignup && (
            <button type="button" className="v2-text-button v2-forgot" onClick={forgotPassword} disabled={busy}>
              Forgot password?
            </button>
          )}
          <button type="submit" className="v2-button v2-button-primary v2-button-full" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
            {!busy && <Icon name="arrow" size={17}/>}
          </button>
        </form>

        <p className="v2-auth-switch">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <Link to={isSignup ? (nextPath ? '/app/login?next=' + encodeURIComponent(nextPath) : '/app/login') : (nextPath ? '/app/signup?next=' + encodeURIComponent(nextPath) : '/app/signup')}>{isSignup ? 'Sign in' : 'Create account'}</Link>
        </p>
        <p className="v2-auth-legal">By continuing, you agree to use PLTK in accordance with your organisation's policies.</p>
      </section>
      <aside className="v2-auth-aside">
        <div className="v2-auth-aside-inner">
          <div className="v2-auth-orbit"><span/><span/><span/></div>
          <span className="v2-eyebrow">PRODUCT LAUNCH MANAGEMENT</span>
          <h2>Bring every launch team into focus.</h2>
          <p>Coordinate work, surface blockers and know what needs to happen before launch day.</p>
          <div className="v2-auth-proof">
            <div><strong>One workspace</strong><span>For every organisation</span></div>
            <div><strong>Clear ownership</strong><span>From plan to launch</span></div>
            <div><strong>Shared visibility</strong><span>Across every team</span></div>
          </div>
        </div>
      </aside>
    </main>
  )
}
