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
  }).catch(err => {
    console.error('Gmail SMTP connection failed:', err.message)
    transporter = null
  })

  return transporter
}

export async function sendTaskAssignmentEmail({ assigneeName, assigneeEmail, taskText, groupTitle, assignedBy, projectName }) {
  const transport = getTransporter()
  if (!transport) {
    console.warn('Skipping email — no SMTP configured')
    return { sent: false, reason: 'no_smtp' }
  }

  if (!assigneeEmail) {
    console.warn('Skipping email — no email address for', assigneeName)
    return { sent: false, reason: 'no_email' }
  }

  const projName = projectName || 'Project Tracker'
  const subject = `📌 New task assigned to you — ${projName}`
  const html = `
    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: #10B981; color: #fff; padding: 16px 20px; border-radius: 10px 10px 0 0;">
        <h2 style="margin: 0; font-size: 16px;">🚀 ${projName} — Task Assigned</h2>
      </div>
      <div style="background: #fff; border: 1px solid #E5E7EB; border-top: none; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="color: #1A1A1A; font-size: 14px; margin: 0 0 12px;">Hi <strong>${assigneeName}</strong>,</p>
        <p style="color: #6B7280; font-size: 13px; margin: 0 0 16px;">
          <strong>${assignedBy}</strong> has assigned you a task:
        </p>
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
          <div style="font-size: 11px; color: #9CA3AF; margin-bottom: 4px;">Group: ${groupTitle}</div>
          <div style="font-size: 14px; color: #1A1A1A; font-weight: 500;">${taskText}</div>
        </div>
        <a href="https://projectluncher.web.app" style="display: inline-block; background: #10B981; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
          Open Tracker →
        </a>
        <p style="color: #D1D5DB; font-size: 11px; margin: 16px 0 0;">Project Launcher · Internal tool</p>
      </div>
    </div>
  `

  try {
    const info = await transport.sendMail({
      from: `"Project Tracker" <${process.env.GMAIL_USER}>`,
      to: assigneeEmail,
      subject,
      html
    })
    console.log('Assignment email sent:', info.messageId)
    return { sent: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send assignment email:', error.message)
    return { sent: false, reason: error.message }
  }
}

export default { sendTaskAssignmentEmail }
