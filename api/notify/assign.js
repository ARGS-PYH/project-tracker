import { sendTaskAssignmentEmail } from '../mailer.js'

function field(document, name) {
  const value = document?.fields?.[name]
  if (!value) return undefined
  if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue
  if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue
  if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue)
  if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return Number(value.doubleValue)
  if (Object.prototype.hasOwnProperty.call(value, 'timestampValue')) return value.timestampValue
  if (Object.prototype.hasOwnProperty.call(value, 'nullValue')) return null
  if (value.arrayValue) return (value.arrayValue.values || []).map(item => {
    if (item.stringValue !== undefined) return item.stringValue
    if (item.integerValue !== undefined) return Number(item.integerValue)
    if (item.booleanValue !== undefined) return item.booleanValue
    return null
  })
  return undefined
}

function documentUrl(projectId, path) {
  const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/')
  return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projectId)
    + '/databases/(default)/documents/' + encodedPath
}

async function readDocument(projectId, path, idToken) {
  const response = await fetch(documentUrl(projectId, path), {
    headers: { Authorization: 'Bearer ' + idToken }
  })
  if (response.status === 404) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'Firestore rejected the notification request.')
    error.status = response.status
    throw error
  }
  return payload
}

async function markAssignmentEmailSent(projectId, path, idToken, notificationId) {
  const query = new URLSearchParams()
  query.append('updateMask.fieldPaths', 'assignmentEmailNotificationId')
  query.append('updateMask.fieldPaths', 'assignmentEmailNotifiedAt')
  const response = await fetch(documentUrl(projectId, path) + '?' + query.toString(), {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + idToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        assignmentEmailNotificationId: { stringValue: notificationId },
        assignmentEmailNotifiedAt: { timestampValue: new Date().toISOString() }
      }
    })
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.error?.message || 'Could not record assignment email delivery.')
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const idToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  const { orgId, projectId, taskId } = req.body || {}
  if (!idToken || !orgId || !projectId || !taskId) {
    return res.status(400).json({ error: 'Missing authentication or task reference.' })
  }

  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'pltk-e38ef'
  if (!apiKey) {
    return res.status(503).json({ error: 'FIREBASE_API_KEY is not configured on the Render email service.' })
  }

  try {
    // Verify the Firebase ID token with Firebase Authentication before using
    // its identity to authorise the task assignment.
    const authResponse = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    })
    const authPayload = await authResponse.json().catch(() => ({}))
    const authUser = authPayload?.users?.[0]
    if (!authResponse.ok || !authUser?.localId || authUser.emailVerified !== true) {
      return res.status(401).json({ error: 'A verified PLTK sign-in is required to send assignment email.' })
    }

    const senderUid = authUser.localId
    const base = 'organisations/' + orgId
    const projectPath = base + '/projects/' + projectId
    const taskPath = projectPath + '/tasks/' + taskId
    const [senderOrgMember, senderProjectMember, project, task] = await Promise.all([
      readDocument(firebaseProjectId, base + '/members/' + senderUid, idToken),
      readDocument(firebaseProjectId, projectPath + '/members/' + senderUid, idToken),
      readDocument(firebaseProjectId, projectPath, idToken),
      readDocument(firebaseProjectId, taskPath, idToken)
    ])

    if (!senderOrgMember || field(senderOrgMember, 'status') !== 'active') {
      return res.status(403).json({ error: 'Active organisation membership is required.' })
    }
    if (!project || !task) return res.status(404).json({ error: 'Launch or task was not found.' })

    const orgRole = field(senderOrgMember, 'role')
    const projectRole = field(senderProjectMember, 'role')
    const projectMemberActive = field(senderProjectMember, 'status') === 'active'
    const canAssign = ['owner', 'admin'].includes(orgRole)
      || (projectMemberActive && ['project_manager', 'contributor'].includes(projectRole))
    if (!canAssign) {
      return res.status(403).json({ error: 'You do not have permission to assign tasks in this launch.' })
    }

    const assignedToUid = field(task, 'assignedToUid')
      || (field(task, 'assigneeUids') || [])[0]
    if (!assignedToUid) return res.status(409).json({ error: 'This task has no assigned team member.' })

    const notificationId = field(task, 'assignmentNotificationId')
    if (!notificationId) return res.status(409).json({ error: 'The task assignment is missing its notification reference. Re-save the assignment and try again.' })
    if (field(task, 'assignmentEmailNotificationId') === notificationId) {
      return res.status(200).json({ sent: true, alreadySent: true })
    }

    const [assigneeOrgMember, assigneeProjectMember] = await Promise.all([
      readDocument(firebaseProjectId, base + '/members/' + assignedToUid, idToken),
      readDocument(firebaseProjectId, projectPath + '/members/' + assignedToUid, idToken)
    ])
    if (!assigneeOrgMember || field(assigneeOrgMember, 'status') !== 'active'
      || !assigneeProjectMember || field(assigneeProjectMember, 'status') !== 'active') {
      return res.status(422).json({ error: 'The assigned user is no longer an active member of this launch.' })
    }

    const assigneeEmail = field(assigneeOrgMember, 'email')
    if (!assigneeEmail) return res.status(422).json({ error: 'The assigned team member does not have an email address on their organisation profile.' })

    const emailResult = await sendTaskAssignmentEmail({
      assigneeName: field(assigneeOrgMember, 'displayName') || assigneeEmail,
      assigneeEmail,
      taskText: field(task, 'title') || 'Assigned task',
      taskDescription: field(task, 'description') || '',
      dueDate: field(task, 'dueDate') || '',
      groupTitle: 'Launch task',
      assignedBy: field(senderOrgMember, 'displayName') || authUser.displayName || authUser.email || 'A workspace manager',
      projectName: field(project, 'name') || 'PLTK launch',
      launchUrl: 'https://projectluncher.web.app/app/launches/' + encodeURIComponent(projectId)
    })

    if (!emailResult.sent) {
      const status = emailResult.reason === 'no_smtp' ? 503 : 502
      return res.status(status).json({ sent: false, error: emailResult.reason || 'Email delivery failed.' })
    }

    try {
      await markAssignmentEmailSent(firebaseProjectId, taskPath, idToken, notificationId)
    } catch (trackingError) {
      // Keep the successful delivery visible, but log that idempotency tracking
      // could not be recorded so an administrator can investigate.
      console.error('Assignment email was sent but delivery tracking failed:', trackingError.message)
    }

    return res.status(200).json({ sent: true, alreadySent: false, recipient: assigneeEmail })
  } catch (error) {
    console.error('PLTK assignment email handler failed:', error?.message || error)
    const status = error.status === 403 ? 403 : error.status === 404 ? 404 : 500
    return res.status(status).json({ sent: false, error: error.message || 'Assignment email could not be sent.' })
  }
}
