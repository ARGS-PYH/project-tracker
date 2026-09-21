import { sendTaskCompletedEmail } from '../mailer.js'

const TEAM_EMAILS = {
  'Animasaun Damilare': 'daanimasaun@gmail.com',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }

  const { assigneeName, assigneeEmail, taskText, groupTitle, completedBy, projectName } = req.body || {}

  if (!assigneeName || !taskText) {
    return res.status(400).json({ error: 'Missing assigneeName or taskText' })
  }

  const targetEmail = assigneeEmail || TEAM_EMAILS[assigneeName] || ''

  try {
    const result = await sendTaskCompletedEmail({
      assigneeName,
      assigneeEmail: targetEmail,
      taskText,
      groupTitle: groupTitle || 'Task Group',
      completedBy: completedBy || 'Team Member',
      projectName: projectName || 'Project Launcher'
    })
    return res.status(200).json(result)
  } catch (error) {
    console.error('Completion notify handler error:', error)
    return res.status(500).json({ error: error.message })
  }
}
