export async function sendTaskAssignmentNotification({ user, orgId, projectId, taskId }) {
  const baseUrl = String(
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_RENDER_API_URL || ''
  ).trim().replace(/\/+$/, '')

  if (!baseUrl) return { sent: false, reason: 'missing_api_url' }
  if (!user?.getIdToken) return { sent: false, reason: 'missing_authenticated_user' }

  const idToken = await user.getIdToken()
  const response = await fetch(baseUrl + '/api/notify/assign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + idToken
    },
    body: JSON.stringify({ orgId, projectId, taskId })
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) return { sent: false, reason: result.error || ('email_service_http_' + response.status) }
  return result
}
