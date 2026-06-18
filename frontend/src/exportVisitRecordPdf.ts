import jsPDF from 'jspdf'
import invoiceLogo from './assets/logo.jpeg'
import { savePdf } from './utils/downloadFile'
import { formatEngineerLine } from './utils/formatEngineerContact'
import { amountToWordsInr } from './utils/amountToWordsInr'
import { formatPdfAmountCell } from './utils/pdfTableStyles'

export type VisitRecordPdfAdminContact = {
  fullName: string
  phone: string
}

export type VisitRecordPdfData = {
  visitId: string
  /** 1-based visit number for this site (shown as Visit No.). */
  visitNo?: number | string
  client: string
  siteName: string
  location?: string
  /** Company admin contacts for PDF header (name + phone). */
  adminContacts?: VisitRecordPdfAdminContact[]
  companyEmail?: string
  date: string
  /** Instrument make/model for Inst Make row (falls back to machine). */
  instMake?: string
  machine: string
  paymentMode: string
  paymentStatus?: string
  amount: string
  notes?: string
  work?: string
  contactPerson?: string
  phone?: string
  dwgRefBy?: string
  dwgNo?: string
  engineerName?: string
  /** HTTPS image URLs (e.g. Cloudinary); rendered on PDF page 2+ */
  photoUrls?: string[]
}

async function loadImageAsDataUrl(src: string) {
  const response = await fetch(src)
  const blob = await response.blob()
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Unable to read image: ${src}`))
    reader.readAsDataURL(blob)
  })
  return dataUrl
}

function guessImageFormat(dataUrl: string): 'JPEG' | 'PNG' | 'WEBP' {
  if (dataUrl.startsWith('data:image/png')) return 'PNG'
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP'
  return 'JPEG'
}

async function appendPhotoPages(doc: jsPDF, photoUrls: string[], visitId: string) {
  const urls = photoUrls.filter((u) => typeof u === 'string' && u.trim().length > 0)
  if (!urls.length) return

  const perPage = 4
  const positions: [number, number, number, number][] = [
    [10, 32, 133, 86],
    [154, 32, 133, 86],
    [10, 124, 133, 86],
    [154, 124, 133, 86],
  ]

  for (let i = 0; i < urls.length; i += perPage) {
    doc.addPage()
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageW, pageH, 'F')
    doc.setDrawColor(60, 60, 60)
    doc.rect(6, 6, pageW - 12, pageH - 12)

    doc.setTextColor(35, 35, 35)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('SITE VISIT PHOTOGRAPHS', pageW / 2, 18, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(80, 80, 80)
    doc.text(`Report / Visit: ${visitId}`, pageW / 2, 24, { align: 'center' })

    const slice = urls.slice(i, i + perPage)
    for (let j = 0; j < slice.length; j += 1) {
      const pos = positions[j] ?? [10, 32, 133, 86]
      const [x, y, w, h] = pos
      try {
        const dataUrl = await loadImageAsDataUrl(slice[j])
        const fmt = guessImageFormat(dataUrl)
        doc.addImage(dataUrl, fmt, x, y, w, h)
      } catch {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(12)
        doc.setTextColor(120, 120, 120)
        doc.text('(Photo could not be loaded)', x + 4, y + h / 2)
      }
    }
  }
}
function lineValue(doc: jsPDF, xStart: number, xEnd: number, y: number, value: string) {
  doc.setDrawColor(40, 40, 40)
  doc.line(xStart, y + 0.8, xEnd, y + 0.8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(24, 24, 24)
  doc.setFontSize(12)
  doc.text(value || '-', xStart + 1.2, y)
}

export async function exportVisitRecordPdf(data: VisitRecordPdfData) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = 297
  const logoDataUrl = await loadImageAsDataUrl(invoiceLogo)

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, 210, 'F')
  // Subtle centered watermark logo behind report content.
  try {
    const anyDoc = doc as unknown as {
      GState?: new (options: { opacity: number }) => unknown
      setGState?: (state: unknown) => void
    }
    if (anyDoc.GState && typeof anyDoc.setGState === 'function') {
      const faded = new anyDoc.GState({ opacity: 0.07 })
      anyDoc.setGState(faded)
      doc.addImage(logoDataUrl, 'JPEG', 94, 43, 110, 110)
      const reset = new anyDoc.GState({ opacity: 1 })
      anyDoc.setGState(reset)
    }
  } catch {
    // If gState is unavailable, skip watermark instead of risking opaque overlap.
  }
  doc.setDrawColor(60, 60, 60)
  doc.rect(6, 6, 285, 198)

  // Keep square aspect ratio so the logo stays clear.
  doc.addImage(logoDataUrl, 'JPEG', 10, 8, 32, 32)

  doc.setTextColor(35, 35, 35)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('// SHREE //', pageWidth / 2, 12, { align: 'center' })
  doc.setFontSize(18)
  doc.text('SAMARTH', pageWidth / 2, 19, { align: 'center' })
  doc.text("LAND SURVEYOR'S", pageWidth / 2, 27, { align: 'center' })
  doc.roundedRect(pageWidth / 2 - 38, 29.5, 76, 11, 3, 3)
  doc.setFontSize(16)
  doc.text('DAILY SURVEY REPORT', pageWidth / 2, 37, { align: 'center' })

  const adminLines = (data.adminContacts ?? [])
    .map((a) => formatEngineerLine(a.fullName, a.phone, ' - '))
    .filter((line) => line.length > 0)
  const emailLine = (data.companyEmail ?? 'samarthlandsurveyors@gmail.com').trim()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  let adminY = 15
  const adminLineGap = 8
  if (adminLines.length) {
    for (const line of adminLines) {
      doc.text(line, 211, adminY)
      adminY += adminLineGap
    }
  }
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9.5)
  doc.text(emailLine, 211, adminY)
  doc.setDrawColor(50, 50, 50)
  doc.line(10, 42, 286, 42)

  const leftLabel = 10
  const leftValueStart = 52
  const rightLabel = 117
  const rightValueStart = 152
  const rowGap = 13
  let y = 53

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Site Report No. :', leftLabel, y)
  lineValue(doc, leftValueStart, 108, y, data.visitId)
  doc.text('Visit No. :', rightLabel, y)
  const visitNoDisplay =
    data.visitNo != null && String(data.visitNo).trim() !== ''
      ? String(data.visitNo)
      : data.visitId.replace('SV-', '')
  lineValue(doc, rightValueStart, 197, y, visitNoDisplay)
  doc.text('Date. :', 212, y)
  lineValue(doc, 228, 286, y, data.date)

  y += rowGap
  doc.text('Name of Client :', leftLabel, y)
  lineValue(doc, leftValueStart, 286, y, data.client)

  y += rowGap
  doc.text('Site Name & Address :', leftLabel, y)
  lineValue(doc, leftValueStart, 286, y, `${data.siteName}${data.location ? `, ${data.location}` : ''}`)

  y += rowGap
  doc.text('Contact Person :', leftLabel, y)
  lineValue(doc, leftValueStart, 200, y, data.contactPerson ?? '-')
  doc.text('Site Phone :', 204, y)
  lineValue(doc, 228, 286, y, data.phone ?? '-')

  const hasDwgInfo = Boolean((data.dwgRefBy ?? '').trim() || (data.dwgNo ?? '').trim())
  if (hasDwgInfo) {
    y += rowGap
    doc.text('DWG. Ref. By :', leftLabel, y)
    lineValue(doc, leftValueStart, 138, y, (data.dwgRefBy ?? '').trim() || '-')
    doc.text('DWG. No. :', 142, y)
    lineValue(doc, 168, 286, y, (data.dwgNo ?? '').trim() || '-')
  }

  const instMakeClean = (data.instMake ?? data.machine ?? '').trim()
  const hasInstOrEngg = Boolean(
    (instMakeClean && instMakeClean !== '-' && instMakeClean !== '—') ||
    (data.engineerName ?? '').trim()
  )
  if (hasInstOrEngg) {
    y += rowGap
    const instMake = instMakeClean || '-'
    doc.text('Inst Make :', leftLabel, y)
    lineValue(doc, leftValueStart, 152, y, instMake)
    doc.text('Engg. Name :', 157, y)
    lineValue(doc, 184, 286, y, data.engineerName ?? '-')
  }

  y += rowGap
  doc.text('Work Type :', leftLabel, y)
  const workText = (data.work ?? '-').trim() || '-'
  doc.setDrawColor(40, 40, 40)
  doc.line(leftValueStart, y + 0.8, 286, y + 0.8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(24, 24, 24)
  doc.setFontSize(12)
  const workLines = doc.splitTextToSize(workText, 286 - leftValueStart - 2)
  doc.text(workLines, leftValueStart + 1.2, y)
  if (workLines.length > 1) y += (workLines.length - 1) * 5

  y += rowGap
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(35, 35, 35)
  doc.text('Other Details :', leftLabel, y)
  lineValue(doc, leftValueStart, 200, y, data.notes?.trim() || '-')
  doc.text('Amount (Rs) :', 212, y)
  lineValue(doc, 248, 286, y, formatPdfAmountCell(data.amount))

  const amountWords = amountToWordsInr(data.amount)
  if (amountWords) {
    y += rowGap
    doc.text('Amount in words :', leftLabel, y)
    doc.setDrawColor(40, 40, 40)
    doc.line(leftValueStart, y + 0.8, 286, y + 0.8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(24, 24, 24)
    doc.setFontSize(11)
    const wordsLines = doc.splitTextToSize(amountWords, 286 - leftValueStart - 2)
    doc.text(wordsLines, leftValueStart + 1.2, y)
    if (wordsLines.length > 1) y += (wordsLines.length - 1) * 4.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(35, 35, 35)
  }

  const signY = 182
  doc.line(12, signY, 90, signY)
  doc.line(108, signY, 186, signY)
  doc.line(204, signY, 282, signY)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Survey Engg.', 50, 188, { align: 'center' })
  doc.text('Site Engg Sign', 147, 188, { align: 'center' })
  doc.text('Client Sign', 243, 188, { align: 'center' })

  doc.line(10, 193, 286, 193)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.text('Office Add. - Bhoinagar Shahapur, Ichalkaranji - 416 121', 12, 199)

  await appendPhotoPages(doc, data.photoUrls ?? [], data.visitId)

  const safeDate = new Date().toISOString().slice(0, 10)
  await savePdf(doc, `visit-record-${data.visitId}-${safeDate}.pdf`)
}
