import { createZipBlob } from './createZip.js'

const encoder = new TextEncoder()

function valueText(value) {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (value?.toDate && typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function displayDate(value) {
  if (!value) return ''
  let date = value?.toDate && typeof value.toDate === 'function' ? value.toDate() : value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return valueText(value)
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(date)
}

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function columnName(index) {
  let value = index + 1
  let name = ''
  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }
  return name
}

function worksheetXml(rows) {
  const columnCount = Math.max(1, ...rows.map(row => row.length))
  const columns = Array.from({ length: columnCount }, (_, columnIndex) => {
    const maxLength = Math.max(10, ...rows.map(row => String(valueText(row[columnIndex]) || '').length))
    const width = Math.min(48, Math.max(12, maxLength + 2))
    return '<col min="' + (columnIndex + 1) + '" max="' + (columnIndex + 1) + '" width="' + width + '" customWidth="1"/>'
  }).join('')
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const reference = columnName(columnIndex) + (rowIndex + 1)
      const text = xmlEscape(valueText(value))
      const style = rowIndex === 0 ? ' s="1"' : ''
      return '<c r="' + reference + '" t="inlineStr"' + style + '><is><t xml:space="preserve">' + text + '</t></is></c>'
    }).join('')
    return '<row r="' + (rowIndex + 1) + '">' + cells + '</row>'
  }).join('')
  const lastCell = columnName(columnCount - 1) + Math.max(1, rows.length)
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    + '<cols>' + columns + '</cols><sheetData>' + rowXml + '</sheetData>'
    + '<autoFilter ref="A1:' + lastCell + '"/></worksheet>'
}

function buildXlsxBlob(sheets) {
  const entries = []
  const sheetOverrides = sheets.map((sheet, index) =>
    '<Override PartName="/xl/worksheets/sheet' + (index + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
  ).join('')
  entries.push({
    name: '[Content_Types].xml',
    bytes: encoder.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
      + sheetOverrides + '</Types>')
  })
  entries.push({
    name: '_rels/.rels',
    bytes: encoder.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
      + '</Relationships>')
  })
  const sheetXml = sheets.map((sheet, index) =>
    '<sheet name="' + xmlEscape(sheet.name) + '" sheetId="' + (index + 1) + '" r:id="rId' + (index + 1) + '"/>'
  ).join('')
  entries.push({
    name: 'xl/workbook.xml',
    bytes: encoder.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      + '<sheets>' + sheetXml + '</sheets></workbook>')
  })
  const relationships = sheets.map((sheet, index) =>
    '<Relationship Id="rId' + (index + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (index + 1) + '.xml"/>'
  ).join('') + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
  entries.push({
    name: 'xl/_rels/workbook.xml.rels',
    bytes: encoder.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + relationships + '</Relationships>')
  })
  entries.push({
    name: 'xl/styles.xml',
    bytes: encoder.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>'
      + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF176B45"/><bgColor indexed="64"/></patternFill></fill></fills>'
      + '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFDCE8DF"/></left><right style="thin"><color rgb="FFDCE8DF"/></right><top style="thin"><color rgb="FFDCE8DF"/></top><bottom style="thin"><color rgb="FFDCE8DF"/></bottom><diagonal/></border></borders>'
      + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs>'
      + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
      + '</styleSheet>')
  })
  sheets.forEach((sheet, index) => entries.push({
    name: 'xl/worksheets/sheet' + (index + 1) + '.xml',
    bytes: encoder.encode(worksheetXml(sheet.rows))
  }))
  const zip = createZipBlob(entries)
  return new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

function safeAscii(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\s+/g, ' ')
    .trim()
}

function pdfEscape(value) {
  return safeAscii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapPdfLine(value, width) {
  const text = safeAscii(value)
  if (!text) return ['']
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  words.forEach(word => {
    if (!line) {
      line = word.slice(0, width)
      if (word.length > width) {
        const pieces = word.match(new RegExp('.{1,' + width + '}', 'g')) || [word]
        lines.push(...pieces.slice(0, -1))
        line = pieces[pieces.length - 1]
      }
      return
    }
    if ((line + ' ' + word).length <= width) line += ' ' + word
    else {
      lines.push(line)
      if (word.length > width) {
        const pieces = word.match(new RegExp('.{1,' + width + '}', 'g')) || [word]
        lines.push(...pieces.slice(0, -1))
        line = pieces[pieces.length - 1]
      } else line = word
    }
  })
  if (line) lines.push(line)
  return lines
}

function createPdfBytes(lines, projectName, generatedAt) {
  const expanded = []
  lines.forEach(line => {
    const width = line.type === 'heading' ? 78 : 100
    wrapPdfLine(line.text, width).forEach(text => expanded.push({ text, type: line.type || 'body' }))
  })
  const pageCapacity = 48
  const pages = []
  for (let index = 0; index < expanded.length; index += pageCapacity) {
    pages.push(expanded.slice(index, index + pageCapacity))
  }
  if (!pages.length) pages.push([])
  const fontRegularId = 3 + pages.length * 2
  const fontBoldId = fontRegularId + 1
  const objects = new Map()
  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>')
  const pageRefs = pages.map((page, index) => (3 + index * 2) + ' 0 R').join(' ')
  objects.set(2, '<< /Type /Pages /Kids [' + pageRefs + '] /Count ' + pages.length + ' >>')

  pages.forEach((page, index) => {
    const pageId = 3 + index * 2
    const contentId = pageId + 1
    let content = 'q 0.04 0.30 0.18 rg 0 798 595 44 re f Q\n'
    content += 'BT /F2 16 Tf 48 813 Td (PLTK PROJECT CLOSEOUT REPORT) Tj ET\n'
    content += 'BT /F1 9 Tf 48 782 Td (' + pdfEscape(projectName) + ') Tj ET\n'
    content += 'BT /F1 8 Tf 48 768 Td (Generated ' + pdfEscape(generatedAt) + ') Tj ET\n'
    let y = 742
    page.forEach(line => {
      if (line.type === 'heading') {
        y -= 5
        content += 'BT /F2 11 Tf 48 ' + y + ' Td (' + pdfEscape(line.text) + ') Tj ET\n'
        y -= 16
      } else {
        content += 'BT /F1 8 Tf 52 ' + y + ' Td (' + pdfEscape(line.text) + ') Tj ET\n'
        y -= 12
      }
    })
    content += 'BT /F1 8 Tf 48 28 Td (PLTK - Product Launch Tracker | Peregrine Solution) Tj ET\n'
    objects.set(pageId, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 '
      + fontRegularId + ' 0 R /F2 ' + fontBoldId + ' 0 R >> >> /Contents ' + contentId + ' 0 R >>')
    objects.set(contentId, '<< /Length ' + encoder.encode(content).length + ' >>\nstream\n' + content + 'endstream')
  })
  objects.set(fontRegularId, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  objects.set(fontBoldId, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')

  let pdf = '%PDF-1.4\n%PLTK\n'
  const offsets = [0]
  const lastId = fontBoldId
  for (let id = 1; id <= lastId; id += 1) {
    offsets[id] = encoder.encode(pdf).length
    pdf += id + ' 0 obj\n' + objects.get(id) + '\nendobj\n'
  }
  const xrefOffset = encoder.encode(pdf).length
  pdf += 'xref\n0 ' + (lastId + 1) + '\n0000000000 65535 f \n'
  for (let id = 1; id <= lastId; id += 1) {
    pdf += String(offsets[id]).padStart(10, '0') + ' 00000 n \n'
  }
  pdf += 'trailer\n<< /Size ' + (lastId + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF'
  return encoder.encode(pdf)
}

function taskRows(tasks) {
  return [['Task', 'Description', 'Status', 'Priority', 'Assignee', 'Due date', 'Created', 'Last updated', 'Subtasks']]
    .concat(tasks.map(task => [
      task.title,
      task.description,
      (task.status || 'todo').replace(/_/g, ' '),
      task.priority || 'medium',
      task.assignedToName || task.assigneeName || '',
      task.dueDate || '',
      displayDate(task.createdAt),
      displayDate(task.updatedAt),
      (task.subtasks || []).map(item => (item.complete ? '[x] ' : '[ ] ') + item.title).join('; ')
    ]))
}

export async function createProjectCloseoutPackage(input) {
  const project = input.project || {}
  const tasks = input.tasks || []
  const milestones = input.milestones || []
  const files = input.files || []
  const activity = input.activity || []
  const members = input.members || []
  const commentGroups = input.commentsByTask || []
  const comments = commentGroups.flatMap(group => (group.comments || []).map(comment => ({
    ...comment,
    taskId: group.taskId,
    taskTitle: group.taskTitle || 'Task'
  })))
  const commentCount = comments.length
  const evidenceCount = comments.reduce((total, comment) => total + (Array.isArray(comment.attachments) ? comment.attachments.length : 0), 0)
  const completedTasks = tasks.filter(task => task.status === 'done').length
  const taskProgress = tasks.length ? Math.round(completedTasks / tasks.length * 100) : 0
  const createdAt = displayDate(project.createdAt)
  const updatedAt = displayDate(project.updatedAt)
  const generatedAt = new Date().toLocaleString()
  const readiness = project.readinessChecks || []

  const summary = [
    ['Field', 'Value'],
    ['Project', project.name || 'Untitled launch'],
    ['Organisation', input.organisationName || ''],
    ['Description', project.description || ''],
    ['Owner', project.ownerName || ''],
    ['Lifecycle status', (project.status || 'planning').replace(/_/g, ' ')],
    ['Target launch date', project.targetLaunchDate || ''],
    ['Created', createdAt],
    ['Last updated', updatedAt],
    ['Task count', tasks.length],
    ['Completed tasks', completedTasks],
    ['Task progress', taskProgress + '%'],
    ['Milestone count', milestones.length],
    ['Team members', members.length],
    ['Project files', files.length],
    ['Task comments', commentCount],
    ['Comment attachments (metadata)', evidenceCount],
    ['Activity records', activity.length],
    ['Generated', generatedAt],
    ['Export note', 'Uploaded file contents are not embedded in this report package. The Files and Discussions sheets list the available file and attachment metadata.']
  ]

  const milestoneSheet = [['Milestone', 'Description', 'Status', 'Due date', 'Linked tasks', 'Completed linked tasks']]
    .concat(milestones.map(item => {
      const linked = tasks.filter(task => task.milestoneId === item.id)
      return [
        item.title,
        item.description,
        (item.status || 'not_started').replace(/_/g, ' '),
        item.dueDate || '',
        linked.length,
        linked.filter(task => task.status === 'done').length
      ]
    }))

  const memberSheet = [['Name', 'Email', 'Role', 'Membership status']]
    .concat(members.map(member => [
      member.displayName || member.name || 'Team member',
      member.email || '',
      (member.role || 'member').replace(/_/g, ' '),
      member.status || 'active'
    ]))

  const activitySheet = [['Date', 'Person', 'Event type', 'Details', 'Related record']]
    .concat(activity.map(item => [
      displayDate(item.createdAt),
      item.actorName || '',
      (item.type || '').replace(/_/g, ' '),
      item.message || '',
      item.entityId || ''
    ]))

  const discussionSheet = [['Task', 'Date', 'Commenter', 'Comment', 'Attachment names']]
    .concat(comments.map(comment => [
      comment.taskTitle,
      displayDate(comment.createdAt),
      comment.authorName || '',
      comment.text || '',
      (comment.attachments || []).map(item => item.name || 'Attachment').join('; ')
    ]))

  const fileSheet = [['File name', 'Content type', 'Size (bytes)', 'Uploaded by', 'Upload date', 'Binary included']]
    .concat(files.map(file => [
      file.name || '',
      file.contentType || '',
      Number(file.size || 0),
      file.uploadedByName || '',
      displayDate(file.createdAt),
      'No - metadata only'
    ]))

  const readinessSheet = [['Category', 'Readiness check', 'Complete', 'Evidence / notes']]
    .concat(readiness.map(item => [
      item.category || '',
      item.label || '',
      item.complete ? 'Yes' : 'No',
      item.evidence || ''
    ]))

  const sheets = [
    { name: 'Overview', rows: summary },
    { name: 'Tasks', rows: taskRows(tasks) },
    { name: 'Milestones', rows: milestoneSheet },
    { name: 'Team', rows: memberSheet },
    { name: 'Activity', rows: activitySheet },
    { name: 'Discussions', rows: discussionSheet },
    { name: 'Files Register', rows: fileSheet },
    { name: 'Readiness', rows: readinessSheet }
  ]
  const workbook = buildXlsxBlob(sheets)

  const pdfLines = [
    { type: 'heading', text: 'PROJECT OVERVIEW' },
    { text: 'Launch: ' + (project.name || 'Untitled launch') },
    { text: 'Organisation: ' + (input.organisationName || 'Not recorded') },
    { text: 'Owner: ' + (project.ownerName || 'Not recorded') },
    { text: 'Status: ' + (project.status || 'planning') },
    { text: 'Target launch date: ' + (project.targetLaunchDate || 'Not set') },
    { text: 'Created: ' + (createdAt || 'Not recorded') },
    { text: 'Last updated: ' + (updatedAt || 'Not recorded') },
    { text: 'Description: ' + (project.description || 'No description recorded.') },
    { type: 'heading', text: 'DELIVERY SUMMARY' },
    { text: 'Tasks: ' + tasks.length + ' total; ' + completedTasks + ' completed; ' + (tasks.length - completedTasks) + ' remaining.' },
    { text: 'Task completion: ' + taskProgress + '%' },
    { text: 'Milestones: ' + milestones.length },
    { text: 'Team members: ' + members.length },
    { text: 'Project files: ' + files.length + ' (metadata only)' },
    { text: 'Task discussions: ' + commentCount + '; comment attachments: ' + evidenceCount + ' (metadata only)' },
    { text: 'Activity records: ' + activity.length },
    { type: 'heading', text: 'TASK REGISTER' }
  ]
  tasks.forEach(task => {
    pdfLines.push({ type: 'body', text: '- ' + task.title + ' | ' + (task.status || 'todo') + ' | ' + (task.priority || 'medium') + ' | Assignee: ' + (task.assignedToName || task.assigneeName || 'Unassigned') + ' | Due: ' + (task.dueDate || 'Not set') })
    if (task.description) pdfLines.push({ type: 'body', text: '  Description: ' + task.description })
  })
  pdfLines.push({ type: 'heading', text: 'MILESTONE REGISTER' })
  milestones.forEach(item => pdfLines.push({
    type: 'body',
    text: '- ' + item.title + ' | ' + (item.status || 'not_started') + ' | Due: ' + (item.dueDate || 'Not set') + ' | ' + (item.description || '')
  }))
  pdfLines.push({ type: 'heading', text: 'TEAM' })
  members.forEach(member => pdfLines.push({
    type: 'body',
    text: '- ' + (member.displayName || member.name || 'Team member') + ' | ' + (member.email || '') + ' | ' + (member.role || 'member')
  }))
  pdfLines.push({ type: 'heading', text: 'DISCUSSION SUMMARY' })
  comments.forEach(comment => {
    pdfLines.push({ type: 'body', text: '- ' + comment.taskTitle + ' | ' + (comment.authorName || 'Team member') + ' | ' + displayDate(comment.createdAt) })
    if (comment.text) pdfLines.push({ type: 'body', text: '  ' + comment.text })
    ;(comment.attachments || []).forEach(attachment => {
      pdfLines.push({ type: 'body', text: '  Attachment: ' + (attachment.name || 'File') + ' (' + (attachment.contentType || 'unknown type') + ', ' + (attachment.size || 0) + ' bytes)' })
    })
  })
  pdfLines.push({ type: 'heading', text: 'ACTIVITY HISTORY' })
  activity.forEach(item => pdfLines.push({
    type: 'body',
    text: '- ' + displayDate(item.createdAt) + ' | ' + (item.actorName || 'Team member') + ' | ' + (item.type || 'event') + ' | ' + (item.message || '')
  }))
  pdfLines.push({ type: 'heading', text: 'FILE REGISTER' })
  files.forEach(file => pdfLines.push({
    type: 'body',
    text: '- ' + (file.name || 'Unnamed file') + ' | ' + (file.contentType || 'unknown type') + ' | ' + (file.size || 0) + ' bytes | Uploaded by: ' + (file.uploadedByName || 'Unknown')
  }))
  pdfLines.push({ type: 'heading', text: 'EXPORT LIMITATION' })
  pdfLines.push({ type: 'body', text: 'This closeout package includes a multi-sheet Excel workbook and this PDF report. Original uploaded file and image contents are not embedded; the workbook records their available names, types, sizes and related discussion metadata.' })
  pdfLines.push({ type: 'body', text: 'This action moves the launch to Deleted Projects. It does not permanently erase its Firestore records or uploaded files.' })

  const pdfBytes = createPdfBytes(pdfLines, project.name || 'PLTK launch', generatedAt)
  const readme = [
    'PLTK PROJECT CLOSEOUT PACKAGE',
    '',
    'This archive contains:',
    '1. PLTK_Project_Report.xlsx - a multi-sheet workbook with launch, task, milestone, team, activity, discussion, file-register and readiness records.',
    '2. PLTK_Project_Summary.pdf - a readable project summary and delivery history.',
    '',
    'Original uploaded file and image contents are not embedded in this package. Their available metadata is listed in the workbook.',
    'Moving a launch to Deleted Projects is a reversible soft-delete action. It does not permanently erase project records or uploaded files.',
    ''
  ].join('\n')
  const xlsxBytes = new Uint8Array(await workbook.arrayBuffer())
  return createZipBlob([
    { name: 'PLTK_Project_Report.xlsx', bytes: xlsxBytes },
    { name: 'PLTK_Project_Summary.pdf', bytes: pdfBytes },
    { name: 'READ_ME.txt', bytes: encoder.encode(readme) }
  ])
}

export function downloadProjectCloseoutPackage(blob, projectName) {
  const safeName = String(projectName || 'PLTK-launch')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'PLTK-launch'
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = safeName + '-closeout.zip'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
