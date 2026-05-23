import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import invoiceLogo from './assets/logo.jpeg'
import { savePdf } from './utils/downloadFile'
import {
  formatPdfAmountCell,
  PDF_AMOUNT_COL,
  PDF_MARGIN,
  PDF_TABLE_BASE_STYLES,
  PDF_TABLE_WIDTH,
} from './utils/pdfTableStyles'
import { drawWatermarkOnAllPages, loadPdfLogoDataUrl } from './utils/pdfWatermark'

export type SiteVisitExportRow = {
  id: string
  client: string
  site: string
  date: string
  amount: string
  paymentStatus: string
  machine: string
}

function formatReportFilenameDate(d = new Date()) {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

async function loadImageAsDataUrl(src: string) {
  const response = await fetch(src)
  const blob = await response.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Unable to load logo'))
    reader.readAsDataURL(blob)
  })
}

const SITE_VISITS_TABLE_COLS = {
  0: { cellWidth: 24 },
  1: { cellWidth: 31 },
  2: { cellWidth: 31 },
  3: { cellWidth: 22 },
  4: { cellWidth: 28, ...PDF_AMOUNT_COL },
  5: { cellWidth: 20 },
  6: { cellWidth: 26 },
}

export type ExportSiteVisitsPdfOpts = {
  year?: string
  /** Active instrument label (export is scoped to this instrument). */
  instrumentName?: string
  /** Shown under title when list is filtered (search / pay status). */
  filterNote?: string
  companyName?: string
  adminName?: string
  adminPhone?: string
  coworkerName?: string
  coworkerPhone?: string
}

export async function exportSiteVisitsPdf(rows: SiteVisitExportRow[], opts: ExportSiteVisitsPdfOpts = {}) {
  const {
    year,
    instrumentName,
    filterNote,
    companyName = 'Samarth Land Surveyors',
    adminName,
    adminPhone,
    coworkerName,
    coworkerPhone,
  } = opts

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = PDF_MARGIN
  const startY = 36

  try {
    const logoDataUrl = await loadImageAsDataUrl(
      typeof invoiceLogo === 'string' ? invoiceLogo : String(invoiceLogo),
    )
    doc.addImage(logoDataUrl, 'JPEG', marginX, 8, 22, 22)
  } catch {
    // Keep letterhead spacing even when logo is unavailable.
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(23, 23, 23)
  doc.text(companyName, pageWidth / 2, 14, { align: 'center' })
  doc.setFontSize(10)
  doc.text('Site Visits Report', pageWidth / 2, 20, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(82, 82, 82)
  doc.text('Visit Records', pageWidth / 2, 25, { align: 'center' })

  const adminLine = [adminName?.trim(), adminPhone?.trim()].filter(Boolean).join(' - ')
  const coworkerLine = [coworkerName?.trim(), coworkerPhone?.trim()].filter(Boolean).join(' - ')
  const contactRightX = pageWidth - marginX
  doc.setTextColor(45, 45, 45)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.text(adminLine || '—', contactRightX, 12, { align: 'right' })
  doc.text(coworkerLine || '—', contactRightX, 17, { align: 'right' })
  doc.setDrawColor(60, 60, 60)
  doc.line(marginX, 30, pageWidth - marginX, 30)

  const generated = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(23, 23, 23)
  doc.text('Site Visits', marginX, startY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(82, 82, 82)
  doc.text(`Export date: ${generated}`, marginX, startY + 12)
  let metaY = startY + 17
  if (instrumentName) {
    doc.text(`Instrument: ${instrumentName}`, marginX, metaY)
    metaY += 5
  }
  if (year) {
    doc.text(`Year: ${year}`, marginX, metaY)
    metaY += 5
  }
  if (filterNote) {
    doc.text(filterNote, marginX, metaY)
    metaY += 5
  }
  const tableStartY = metaY + 3

  const body =
    rows.length === 0
      ? [['—', '—', '—', '—', '—', '—', '—']]
      : rows.map((r) => [
          r.id,
          r.client,
          r.site,
          r.date,
          formatPdfAmountCell(r.amount),
          r.paymentStatus,
          r.machine || '—',
        ])

  autoTable(doc, {
    startY: tableStartY,
    tableWidth: PDF_TABLE_WIDTH,
    head: [['Visit ID', 'Client', 'Site', 'Date', 'Amount (Rs)', 'Status', 'Machine']],
    body,
    headStyles: { fillColor: [243, 155, 3], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    styles: { ...PDF_TABLE_BASE_STYLES, fontSize: 8.5 },
    columnStyles: SITE_VISITS_TABLE_COLS,
    margin: { left: marginX, right: marginX },
    didDrawPage: (data) => {
      const pageH = doc.internal.pageSize.getHeight()
      const pageNum = doc.getCurrentPageInfo().pageNumber
      const total = doc.getNumberOfPages()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(`Page ${pageNum} of ${total}`, pageWidth - marginX, pageH - 8, { align: 'right' })
      if (data.cursor) {
        doc.setDrawColor(230, 230, 230)
        doc.line(marginX, pageH - 12, pageWidth - marginX, pageH - 12)
      }
    },
  })

  try {
    const watermarkLogo = await loadPdfLogoDataUrl()
    drawWatermarkOnAllPages(doc, watermarkLogo)
  } catch {
    // Skip watermark if logo cannot load.
  }

  const filename = `Site_Visits_Report_${formatReportFilenameDate()}.pdf`
  await savePdf(doc, filename)
}
