import React, { createContext, useContext, useEffect, useState } from 'react'
import { collection, doc, getDoc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './auth/AuthProvider.jsx'

const WorkspaceContext = createContext(null)

function makeSlug(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
}

export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [organisations, setOrganisations] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState(() => {
    try { return localStorage.getItem('pltk_selected_org') || '' } catch { return '' }
  })
  const [projects, setProjects] = useState([])
  const [organisationLoading, setOrganisationLoading] = useState(true)
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [error, setError] = useState('')
  const selectedOrganisation = organisations.find(item => item.id === selectedOrgId) || null

  useEffect(() => {
    if (!user?.uid || !user.emailVerified) {
      setOrganisations([])
      setOrganisationLoading(false)
      return undefined
    }

    setOrganisationLoading(true)
    const ref = collection(db, 'users', user.uid, 'organisations')
    const unsubscribe = onSnapshot(ref, snapshot => {
      const records = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() }))
        .filter(item => item.status !== 'suspended')
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setOrganisations(records)
      setSelectedOrgId(current => {
        const preferred = current || (() => {
          try { return localStorage.getItem('pltk_selected_org') || '' } catch { return '' }
        })()
        return records.some(item => item.id === preferred) ? preferred : (records[0]?.id || '')
      })
      setOrganisationLoading(false)
    }, () => {
      setError('We could not load your organisations. Check your connection and access.')
      setOrganisationLoading(false)
    })

    return unsubscribe
  }, [user?.uid, user?.emailVerified])

  useEffect(() => {
    if (!selectedOrgId || !user?.uid || !user.emailVerified) {
      setProjects([])
      setProjectsLoading(false)
      return undefined
    }
    if (organisationLoading) {
      setProjects([])
      setProjectsLoading(false)
      return undefined
    }

    // Clear the previous organisation's projects immediately so data from
    // the last workspace is never displayed while the next listener starts.
    setProjects([])
    setProjectsLoading(true)

    // Guests only query their own explicit project access index. Standard
    // organisation members can query the organisation's launch summaries.
    if (selectedOrganisation?.role === 'guest') {
      let active = true
      let requestVersion = 0
      const indexRef = collection(db, 'organisations', selectedOrgId, 'members', user.uid, 'projects')
      const unsubscribe = onSnapshot(indexRef, async snapshot => {
        const version = ++requestVersion
        try {
          const projectSnapshots = await Promise.all(snapshot.docs.map(item =>
            getDoc(doc(db, 'organisations', selectedOrgId, 'projects', item.id))
          ))
          if (!active || version !== requestVersion) return
          const records = projectSnapshots
            .filter(item => item.exists())
            .map(item => ({ id: item.id, ...item.data() }))
            .sort((a, b) => {
              const aTime = a.updatedAt?.toMillis?.() || 0
              const bTime = b.updatedAt?.toMillis?.() || 0
              return bTime - aTime
            })
          setProjects(records)
          setProjectsLoading(false)
        } catch {
          if (!active || version !== requestVersion) return
          setProjects([])
          setError('We could not load projects shared with this guest account.')
          setProjectsLoading(false)
        }
      }, () => {
        if (!active) return
        setProjects([])
        setError('We could not load projects shared with this guest account.')
        setProjectsLoading(false)
      })
      return () => { active = false; unsubscribe() }
    }

    const ref = collection(db, 'organisations', selectedOrgId, 'projects')
    const unsubscribe = onSnapshot(ref, snapshot => {
      const records = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() }))
        .sort((a, b) => {
          const aTime = a.updatedAt?.toMillis?.() || 0
          const bTime = b.updatedAt?.toMillis?.() || 0
          return bTime - aTime
        })
      setProjects(records)
      setProjectsLoading(false)
    }, () => {
      setProjects([])
      setError('We could not load launches for this organisation.')
      setProjectsLoading(false)
    })

    return unsubscribe
  }, [selectedOrgId, user?.uid, user?.emailVerified, selectedOrganisation?.role, organisationLoading])

  useEffect(() => {
    if (!selectedOrgId) return
    try { localStorage.setItem('pltk_selected_org', selectedOrgId) } catch {}
  }, [selectedOrgId])

  const createOrganisation = async name => {
    const cleanName = name.trim()
    if (!user?.uid || !user.emailVerified) throw new Error('Verify your email address before creating an organisation.')
    if (cleanName.length < 2 || cleanName.length > 80) throw new Error('Organisation name must be between 2 and 80 characters.')

    const batch = writeBatch(db)
    const orgRef = doc(collection(db, 'organisations'))
    const orgId = orgRef.id
    const createdAt = serverTimestamp()

    batch.set(orgRef, {
      name: cleanName,
      slug: makeSlug(cleanName),
      ownerUid: user.uid,
      status: 'active',
      createdAt,
      updatedAt: createdAt
    })
    batch.set(doc(db, 'organisations', orgId, 'members', user.uid), {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role: 'owner',
      status: 'active',
      joinedAt: createdAt
    })
    batch.set(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      updatedAt: createdAt
    }, { merge: true })
    batch.set(doc(db, 'users', user.uid, 'organisations', orgId), {
      organisationId: orgId,
      name: cleanName,
      role: 'owner',
      status: 'active',
      createdAt
    })

    await batch.commit()
    setSelectedOrgId(orgId)
    return orgId
  }

  const createLaunch = async ({ name, description = '', targetLaunchDate = '' }) => {
    if (!user?.uid || !selectedOrgId) throw new Error('Select an organisation before creating a launch.')
    const cleanName = name.trim()
    if (cleanName.length < 3 || cleanName.length > 100) throw new Error('Launch name must be between 3 and 100 characters.')
    if (targetLaunchDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetLaunchDate)) throw new Error('Enter a valid target launch date.')

    const batch = writeBatch(db)
    const projectRef = doc(collection(db, 'organisations', selectedOrgId, 'projects'))
    const createdAt = serverTimestamp()
    batch.set(projectRef, {
      organisationId: selectedOrgId,
      name: cleanName,
      description: description.trim().slice(0, 2000),
      ownerUid: user.uid,
      ownerName: user.displayName || user.email || 'Workspace owner',
      status: 'planning',
      readinessStatus: 'not_started',
      progress: 0,
      targetLaunchDate: targetLaunchDate || null,
      createdAt,
      updatedAt: createdAt
    })
    batch.set(doc(db, 'organisations', selectedOrgId, 'projects', projectRef.id, 'members', user.uid), {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      role: 'project_manager',
      status: 'active',
      joinedAt: createdAt
    })
    await batch.commit()
    return projectRef.id
  }

  const value = {
    organisations,
    selectedOrgId,
    setSelectedOrgId,
    selectedOrganisation,
    projects,
    organisationLoading,
    projectsLoading,
    error,
    clearError: () => setError(''),
    createOrganisation,
    createLaunch
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider.')
  return context
}
