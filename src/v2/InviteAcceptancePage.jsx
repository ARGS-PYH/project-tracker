import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './auth/AuthProvider.jsx'
import Icon from './icons.jsx'

export default function InviteAcceptancePage() {
  const { orgId, inviteId } = useParams()
  const { user, sendVerification, refreshUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const invitePath = '/invite/' + orgId + '/' + inviteId
  const loginPath = '/app/login?next=' + encodeURIComponent(invitePath)
  const signupPath = '/app/signup?next=' + encodeURIComponent(invitePath)

  useEffect(() => {
    if (!user?.uid || !user.emailVerified) {
      setInvitation(null)
      return undefined
    }
    let active = true
    setLoading(true)
    setError('')
    getDoc(doc(db, 'organisations', orgId, 'invitations', inviteId))
      .then(snapshot => {
        if (!active) return
        if (!snapshot.exists()) {
          setError('This invitation could not be found or is no longer available.')
          setInvitation(null)
          return
        }
        const data = snapshot.data()
        const expiry = data.expiresAt?.toDate?.()
        if (data.status !== 'pending' || (expiry && expiry <= new Date())) {
          setError('This invitation has expired, been revoked or has already been accepted.')
          setInvitation(null)
          return
        }
        setInvitation(data)
      })
      .catch(() => {
        if (active) setError('This invitation is not available to this account. Sign in with the email address it was sent to.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user?.uid, user?.emailVerified, orgId, inviteId])

  const resendVerification = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await sendVerification()
      setNotice('A verification email has been sent to ' + user.email + '.')
    } catch {
      setError('We could not send a verification email. Please try again shortly.')
    } finally {
      setBusy(false)
    }
  }

  const refreshVerification = async () => {
    setBusy(true)
    setError('')
    try {
      await refreshUser()
      setNotice('Account status refreshed. If your email is verified, the invitation will load.')
    } catch {
      setError('We could not refresh your account. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const accept = async () => {
    if (!user?.uid || !user.emailVerified || !invitation) return
    setBusy(true)
    setError('')
    try {
      const inviteRef = doc(db, 'organisations', orgId, 'invitations', inviteId)
      const memberRef = doc(db, 'organisations', orgId, 'members', user.uid)
      const userOrgRef = doc(db, 'users', user.uid, 'organisations', orgId)
      const batch = writeBatch(db)
      batch.set(memberRef, {
        uid: user.uid,
        email: user.email || invitation.email,
        displayName: user.displayName || '',
        role: invitation.role,
        status: 'active',
        invitationId: inviteId,
        joinedAt: serverTimestamp()
      })
      batch.set(userOrgRef, {
        organisationId: orgId,
        name: invitation.orgName || 'Organisation',
        role: invitation.role,
        status: 'active',
        createdAt: serverTimestamp()
      })
      batch.update(inviteRef, {
        status: 'accepted',
        acceptedUid: user.uid,
        acceptedAt: serverTimestamp()
      })
      await batch.commit()
      navigate('/app/overview', { replace: true })
    } catch {
      setError('We could not accept this invitation. Confirm that you are signed in with the invited email and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="v2-invite-page">
      <section className="v2-invite-card">
        <Link to="/" className="v2-brand"><span className="v2-brand-mark">P</span><span>PLTK</span></Link>
        <span className="v2-invite-icon"><Icon name="users" size={23}/></span>
        <span className="v2-eyebrow">WORKSPACE INVITATION</span>
        <h1>Join your team on PLTK</h1>
        {!user ? (
          <>
            <p>You've received an invitation to collaborate in an organisation workspace. Sign in or create an account using the email address the invitation was sent to, then reopen this link.</p>
            <div className="v2-invite-actions"><Link to={loginPath} className="v2-button v2-button-primary">Sign in <Icon name="arrow" size={16}/></Link><Link to={signupPath} className="v2-button v2-button-secondary">Create account</Link></div>
          </>
        ) : !user.emailVerified ? (
          <>
            <p>You're signed in as <strong>{user.email}</strong>. Verify this email address before accepting the invitation.</p>
            {notice && <div className="v2-alert v2-alert-success">{notice}</div>}
            {error && <div className="v2-alert v2-alert-error">{error}</div>}
            <button className="v2-button v2-button-primary v2-button-full" onClick={resendVerification} disabled={busy}>Resend verification email</button>
            <button className="v2-button v2-button-secondary v2-button-full" onClick={refreshVerification} disabled={busy}>I've verified my email</button>
          </>
        ) : loading ? (
          <div className="v2-loading-inline"><span className="v2-spinner"/>Checking invitation…</div>
        ) : invitation ? (
          <>
            <p><strong>{invitation.createdByName || 'A workspace administrator'}</strong> invited you to join <strong>{invitation.orgName || 'an organisation'}</strong> as a <strong>{invitation.role}</strong>.</p>
            <div className="v2-invite-detail"><span>Invitation sent to</span><strong>{invitation.email}</strong><span>Signed in as</span><strong>{user.email}</strong></div>
            {error && <div className="v2-alert v2-alert-error">{error}</div>}
            <button className="v2-button v2-button-primary v2-button-full" onClick={accept} disabled={busy}>Accept invitation <Icon name="arrow" size={16}/></button>
            <p className="v2-invite-footnote">By accepting, you'll join this organisation with the role shown above.</p>
          </>
        ) : (
          <>
            <p>{error || 'This invitation is not available.'}</p>
            <Link to="/app/overview" className="v2-button v2-button-secondary">Go to PLTK</Link>
          </>
        )}
      </section>
    </main>
  )
}
