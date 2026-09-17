import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalAlign,
  WidthType,
} from 'docx'
import { attendanceMinutes, attendanceTimes, humanDuration } from './date'
import { plainTextToHtml, sanitizeRichHtml } from './richText'

const FONT = 'Times New Roman'
const BODY_SIZE = 20 // 10 pt, expressed in half-points by docx
const blackBorder = { style: BorderStyle.SINGLE, size: 6, color: '000000' }
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }

function allBorders(border = blackBorder) {
  return { top: border, right: border, bottom: border, left: border, insideHorizontal: border, insideVertical: border }
}

function run(text = '', options = {}) {
  return new TextRun({ text: String(text), font: FONT, size: BODY_SIZE, ...options })
}

function timestampDate(timestamp) {
  if (!timestamp) return null
  if (typeof timestamp?.toDate === 'function') return timestamp.toDate()
  const value = new Date(timestamp)
  return Number.isNaN(value.getTime()) ? null : value
}

function wordTime(timestamp) {
  const date = timestampDate(timestamp)
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
}

function shortDate(dateKey) {
  if (!dateKey) return '—'
  const [year, month, day] = dateKey.split('-').map(Number)
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${String(year).slice(-2)}`
}

function coverageLabel(records) {
  const keys = records.map(record => record.dateKey).filter(Boolean).sort()
  if (!keys.length) return '—'
  const toDate = key => {
    const [year, month, day] = key.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const first = toDate(keys[0])
  const last = toDate(keys[keys.length - 1])
  const full = date => new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)

  if (keys[0] === keys[keys.length - 1]) return full(first)
  if (first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth()) {
    const monthName = new Intl.DateTimeFormat('en-PH', { month: 'long' }).format(first)
    return `${monthName} ${first.getDate()} to ${last.getDate()}, ${last.getFullYear()}`
  }
  return `${full(first)} to ${full(last)}`
}

function alignmentFromElement(element) {
  const value = element?.style?.textAlign
  if (value === 'center') return AlignmentType.CENTER
  if (value === 'right') return AlignmentType.RIGHT
  if (value === 'justify') return AlignmentType.JUSTIFIED
  return AlignmentType.LEFT
}

function inlineRuns(node, inherited = {}) {
  const output = []
  if (!node) return output

  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent) output.push(run(node.textContent, inherited))
    return output
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return output

  if (node.tagName === 'BR') {
    output.push(new TextRun({ text: '', break: 1, font: FONT, size: BODY_SIZE, ...inherited }))
    return output
  }

  const next = { ...inherited }
  if (['STRONG', 'B'].includes(node.tagName)) next.bold = true
  if (['EM', 'I'].includes(node.tagName)) next.italics = true
  if (node.tagName === 'U') next.underline = { type: UnderlineType.SINGLE }

  for (const child of [...node.childNodes]) output.push(...inlineRuns(child, next))
  return output
}

function paragraphFromElement(element, prefix = '') {
  const tag = element.tagName
  let size = BODY_SIZE
  let bold = false
  if (tag === 'H1') { size = 28; bold = true }
  if (tag === 'H2') { size = 24; bold = true }
  if (tag === 'H3') { size = 22; bold = true }

  let children = []
  if (prefix) children.push(run(prefix))
  children.push(...inlineRuns(element, { size, bold }))
  if (!children.length) children = [run('')]

  return new Paragraph({
    children,
    alignment: alignmentFromElement(element),
    spacing: { after: 60, line: 240 },
  })
}

function richHtmlToParagraphs(html, fallbackText = '') {
  const safe = sanitizeRichHtml(html || plainTextToHtml(fallbackText))
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${safe}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  const output = []

  function pushBlock(element) {
    if (element.tagName === 'UL' || element.tagName === 'OL') {
      const ordered = element.tagName === 'OL'
      ;[...element.children].filter(item => item.tagName === 'LI').forEach((item, index) => {
        output.push(paragraphFromElement(item, ordered ? `${index + 1}. ` : '• '))
      })
      return
    }
    output.push(paragraphFromElement(element))
  }

  for (const child of [...root.children]) {
    if (['P', 'DIV', 'H1', 'H2', 'H3', 'UL', 'OL'].includes(child.tagName)) pushBlock(child)
    else output.push(paragraphFromElement(child))
  }

  if (!output.length && root.textContent?.trim()) {
    output.push(new Paragraph({ children: [run(root.textContent.trim())], spacing: { after: 60 } }))
  }
  return output.length ? output : [new Paragraph({ children: [run('')] })]
}

function detailRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        borders: allBorders(noBorder),
        margins: { top: 30, bottom: 30, left: 0, right: 120 },
        children: [new Paragraph({ children: [run(label, { bold: true, underline: { type: UnderlineType.SINGLE } })] })],
      }),
      new TableCell({
        width: { size: 80, type: WidthType.PERCENTAGE },
        borders: { top: noBorder, left: noBorder, right: noBorder, bottom: blackBorder },
        margins: { top: 30, bottom: 30, left: 80, right: 0 },
        children: [new Paragraph({ children: [run(value || '—')] })],
      }),
    ],
  })
}

function timeLogParagraphs(attendance) {
  if (!attendance) {
    return [new Paragraph({ children: [run('No DTR record', { italics: true })], spacing: { after: 0 } })]
  }

  const times = attendanceTimes(attendance)
  const lines = [
    ['Time-in: ', wordTime(times.timeIn1)],
    ['Time-out: ', wordTime(times.timeOut2)],
  ]

  return lines.map(([label, value]) => new Paragraph({
    children: [run(label, { italics: true }), run(value)],
    spacing: { after: 20, line: 220 },
  }))
}

function reportFilename(profile, monthLabel) {
  const name = `${profile?.name || 'Employee'}_${monthLabel || 'Report'}`
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `Individual_Daily_Log_Accomplishment_${name}.docx`
}

export async function downloadAccomplishmentReportDocx({ profile, records, attendanceByDate, monthLabel }) {
  const sorted = [...records].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey)
    return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)
  })

  const title = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 260, after: 0 },
      children: [run('INDIVIDUAL DAILY LOG AND ACCOMPLISHMENT REPORT', { bold: true, size: 23 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [run('(WORK FROM HOME)', { bold: true, size: 22 })],
    }),
  ]

  const details = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allBorders(noBorder),
    rows: [
      detailRow('NAME', profile?.name || '—'),
      detailRow('POSITION', profile?.position || '—'),
      detailRow('OFFICE', profile?.office || profile?.department || '—'),
    ],
  })

  const coverage = new Paragraph({
    spacing: { before: 180, after: 180 },
    children: [run('Date/s Covered: ', { bold: true }), run(coverageLabel(sorted))],
  })

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: 27, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        borders: allBorders(),
        margins: { top: 70, bottom: 70, left: 90, right: 90 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            run('Date and Actual', { bold: true }),
            new TextRun({ text: 'Time logs', break: 1, font: FONT, size: BODY_SIZE, bold: true }),
          ],
        })],
      }),
      new TableCell({
        width: { size: 73, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        borders: allBorders(),
        margins: { top: 70, bottom: 70, left: 90, right: 90 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Actual Accomplishments', { bold: true })] })],
      }),
    ],
  })

  const rows = sorted.map(record => {
    const attendance = attendanceByDate[record.dateKey]
    const logChildren = [
      new Paragraph({ children: [run(shortDate(record.dateKey), { italics: true })], spacing: { after: 40 } }),
      ...timeLogParagraphs(attendance),
    ]


    const accomplishmentChildren = richHtmlToParagraphs(record.accomplishmentHtml, record.accomplishment)
    if (record.remarks) {
      accomplishmentChildren.push(new Paragraph({
        spacing: { before: 80, after: 0 },
        children: [run('Remarks: ', { bold: true, italics: true, size: 18 }), run(record.remarks, { italics: true, size: 18 })],
      }))
    }

    return new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 27, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.TOP,
          borders: allBorders(),
          margins: { top: 70, bottom: 80, left: 90, right: 90 },
          children: logChildren,
        }),
        new TableCell({
          width: { size: 73, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.TOP,
          borders: allBorders(),
          margins: { top: 70, bottom: 80, left: 100, right: 100 },
          children: accomplishmentChildren,
        }),
      ],
    })
  })

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...rows],
  })

  const signatureCell = (heading, name, position, office = '') => new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: allBorders(noBorder),
    margins: { top: 0, bottom: 0, left: 60, right: 60 },
    children: [
      new Paragraph({ spacing: { after: 360 }, children: [run(heading)] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run(name || '—', { bold: true })], spacing: { after: 20 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run(position || '—')], spacing: { after: 20 } }),
      ...(office ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(office)], spacing: { after: 0 } })] : []),
    ],
  })

  const signatures = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allBorders(noBorder),
    rows: [new TableRow({
      cantSplit: true,
      children: [
        signatureCell('Submitted by:', profile?.name || 'Employee', profile?.position || 'Employee'),
        signatureCell(
          'Attested by:',
          profile?.supervisorName || 'IMMEDIATE SUPERVISOR',
          profile?.supervisorPosition || 'Supervisor / Head of Office',
          profile?.office || profile?.department || '',
        ),
      ],
    })],
  })

  const document = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_SIZE },
          paragraph: { spacing: { after: 0, line: 240 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 900, right: 1000, bottom: 850, left: 1000 },
        },
      },
      children: [
        ...title,
        details,
        coverage,
        mainTable,
        new Paragraph({ spacing: { before: 300, after: 0 }, children: [run('')] }),
        signatures,
      ],
    }],
  })

  const blob = await Packer.toBlob(document)
  const url = URL.createObjectURL(blob)
  const link = documentCreateLink(url, reportFilename(profile, monthLabel))
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function documentCreateLink(url, filename) {
  const link = window.document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  window.document.body.appendChild(link)
  return link
}
