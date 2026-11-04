import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    console.warn('GMAIL_USER or GMAIL_APP_PASSWORD not set — email notifications disabled')
    return null
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  })

  transporter.verify().then(() => {
    console.log('Gmail SMTP connected and ready')
  }).catch(error => {
    console.error('Gmail SMTP connection failed:', error.message)
    transporter = null
  })
  return transporter
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character])
}

export async function sendTaskAssignmentEmail({
  assigneeName,
  assigneeEmail,
  taskText,
  taskDescription = '',
  dueDate = '',
  groupTitle = 'Launch task',
  assignedBy = 'A workspace manager',
  projectName = 'PLTK',
  launchUrl = 'https://projectluncher.web.app/app'
}) {
  const transport = getTransporter()
  if (!transport) return { sent: false, reason: 'no_smtp' }
  if (!assigneeEmail) return { sent: false, reason: 'no_email' }

  const safeName = escapeHtml(assigneeName)
  const safeTask = escapeHtml(taskText)
  const safeDescription = escapeHtml(taskDescription)
  const safeProject = escapeHtml(projectName)
  const safeAssignedBy = escapeHtml(assignedBy)
  const safeDueDate = escapeHtml(dueDate)
  const safeUrl = escapeHtml(launchUrl)
  const subject = 'New task assigned to you — ' + String(projectName).replace(/[\r\n]+/g, ' ').slice(0, 120)

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#14251b">
      <div style="background:#0b5738;color:#fff;padding:20px;border-radius:12px 12px 0 0">
        <div style="font-size:12px;letter-spacing:2px;font-weight:bold">PLTK · PEREGRINE SOLUTION</div>
        <h2 style="margin:10px 0 0;font-size:21px">A task has been assigned to you</h2>
      </div>
      <div style="border:1px solid #d9e8dd;border-top:0;padding:22px;border-radius:0 0 12px 12px">
        <p style="margin:0 0 14px">Hi <strong>${safeName}</strong>,</p>
        <p style="color:#53675d;line-height:1.6"><strong>${safeAssignedBy}</strong> assigned you work in <strong>${safeProject}</strong>.</p>
        <div style="background:#f2f8f4;border:1px solid #d9e8dd;padding:15px;border-radius:9px">
          <div style="font-size:11px;color:#66796e;margin-bottom:7px">${escapeHtml(groupTitle)}</div>
          <div style="font-size:16px;font-weight:bold">${safeTask}</div>
          ${safeDescription ? '<p style="font-size:13px;line-height:1.6;color:#53675d">' + safeDescription + '</p>' : ''}
          ${safeDueDate ? '<div style="font-size:12px;color:#53675d">Due: ' + safeDueDate + '</div>' : ''}
        </div>
        <p style="margin:20px 0"><a href="${safeUrl}" style="display:inline-block;background:#0b9b62;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Open launch in PLTK</a></p>
        <p style="font-size:11px;color:#87968d">PLTK · Product Launch Tracker · Peregrine Solution</p>
      </div>
    </div>
  `

  try {
    const info = await transport.sendMail({
      from: '"PLTK | Peregrine Solution" <' + process.env.GMAIL_USER + '>',
      to: assigneeEmail,
      subject,
      html
    })
    console.log('PLTK task assignment email sent:', info.messageId)
    return { sent: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send PLTK task assignment email:', error.message)
    return { sent: false, reason: 'smtp_error' }
  }
}

export async function sendTaskCompletedEmail({
  assigneeName,
  assigneeEmail,
  taskText,
  groupTitle,
  completedBy,
  projectName
}) {
  const transport = getTransporter()
  if (!transport) return { sent: false, reason: 'no_smtp' }
  if (!assigneeEmail) return { sent: false, reason: 'no_email' }

  const subject = 'Task completed — ' + String(projectName || 'PLTK').replace(/[\r\n]+/g, ' ').slice(0, 120)
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#14251b">
      <div style="background:#0b5738;color:#fff;padding:20px;border-radius:12px 12px 0 0">
        <div style="font-size:12px;letter-spacing:2px;font-weight:bold">PLTK · PEREGRINE SOLUTION</div>
        <h2 style="margin:10px 0 0;font-size:21px">Task completed</h2>
      </div>
      <div style="border:1px solid #d9e8dd;border-top:0;padding:22px;border-radius:0 0 12px 12px">
        <p>Hi <strong>${escapeHtml(assigneeName)}</strong>,</p>
        <p><strong>${escapeHtml(completedBy)}</strong> marked this task as complete:</p>
        <div style="background:#f2f8f4;border:1px solid #d9e8dd;padding:15px;border-radius:9px">
          <div style="font-size:11px;color:#66796e;margin-bottom:7px">${escapeHtml(groupTitle || 'Launch task')}</div>
          <div style="font-size:16px;font-weight:bold">${escapeHtml(taskText)}</div>
        </div>
        <p style="margin-top:20px"><a href="https://projectluncher.web.app/app" style="background:#0b9b62;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Open PLTK</a></p>
      </div>
    </div>
  `

  try {
    const info = await transport.sendMail({
      from: '"PLTK | Peregrine Solution" <' + process.env.GMAIL_USER + '>',
      to: assigneeEmail,
      subject,
      html
    })
    console.log('PLTK task completion email sent:', info.messageId)
    return { sent: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send PLTK task completion email:', error.message)
    return { sent: false, reason: 'smtp_error' }
  }
}

export default { sendTaskAssignmentEmail, sendTaskCompletedEmail }
