import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import invoiceLogo from '../assets/logo.jpeg'
import { downloadCsv, savePdf } from './downloadFile'
import {
  formatPdfAmountCell,
  PDF_AMOUNT_COL,
  PDF_MARGIN,
  PDF_TABLE_BASE_STYLES,
  PDF_TABLE_WIDTH,
} from './pdfTableStyles'
import { drawWatermarkOnAllPages, loadPdfLogoDataUrl } from './pdfWatermark'

export type ClientExportRow = {
  name: string
  phone: string
  sites: number
  revenue: string
  received: string
  pending: string
}

export type SiteExportRow = {
  name: string
  location: string
  lastVisit: string
  status: string
  pending: string
}

export type ClientVisitExportRow = {
  id: string
  visitNo?: number
  date: string
  site: string
  machine: string
  paymentMode: string
  paymentStatus: string
  amount: string
}

export type ClientCreditExportRow = {
  date: string
  site: string
  amount: string
  paymentMode: string
  receivedBy: string
  notes?: string
}

export type ClientReportExportData = {
  client: ClientExportRow
  sites: SiteExportRow[]
  visits?: ClientVisitExportRow[]
  credits?: ClientCreditExportRow[]
  totals?: {
    revenue: number
    received: number
    creditTotal: number
    pending: number
    advance?: number
  }
  companyName?: string
  adminName?: string
  adminPhone?: string
  coworkerName?: string
  coworkerPhone?: string
  adminContacts?: Array<{ fullName: string; phone: string }>
}

function escapeCsvCell(value: string | number) {
  const t = String(value).replace(/"/g, '""')
  if (/[",\n\r]/.test(t)) return `"${t}"`
  return t
}

function rowsToCsv(headers: string[], rows: (string | number)[][]) {
  const lines = [headers.map(escapeCsvCell).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(','))
  }
  return lines.join('\n')
}

function formatInrPlain(n: number) {
  return `Rs ${Math.round(n).toLocaleString('en-IN')}`
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

const CLIENT_ALL_TABLE_COLS = {
  0: { cellWidth: 44 },
  1: { cellWidth: 32 },
  2: { cellWidth: 22, halign: 'right' as const },
  3: { cellWidth: 42, ...PDF_AMOUNT_COL },
  4: { cellWidth: 42, ...PDF_AMOUNT_COL },
}

const CLIENT_SITE_TABLE_COLS = {
  0: { cellWidth: 36 },
  1: { cellWidth: 42 },
  2: { cellWidth: 28 },
  3: { cellWidth: 22 },
  4: { cellWidth: 54, ...PDF_AMOUNT_COL },
}

const CLIENT_VISIT_TABLE_COLS = {
  0: { cellWidth: 26 },
  1: { cellWidth: 14 },
  2: { cellWidth: 24 },
  3: { cellWidth: 32 },
  4: { cellWidth: 28 },
  5: { cellWidth: 20 },
  6: { cellWidth: 38, ...PDF_AMOUNT_COL },
}

const CLIENT_CREDIT_TABLE_COLS = {
  0: { cellWidth: 22 },
  1: { cellWidth: 30 },
  2: { cellWidth: 26, ...PDF_AMOUNT_COL },
  3: { cellWidth: 28 },
  4: { cellWidth: 32 },
  5: { cellWidth: 44 },
}

export type AllClientsReportPdfOpts = {
  clients: ClientExportRow[]
  companyName?: string
  adminName?: string
  adminPhone?: string
  coworkerName?: string
  coworkerPhone?: string
}

export async function exportAllClientsPdf(opts: AllClientsReportPdfOpts) {
  const {
    clients,
    companyName = 'Samarth Land Surveyors',
    adminName,
    adminPhone,
    coworkerName,
    coworkerPhone,
  } = opts

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const marginX = PDF_MARGIN
  const pageWidth = doc.internal.pageSize.getWidth()
  let startY = 36

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
  doc.text('All Clients Report', pageWidth / 2, 20, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(82, 82, 82)
  doc.text('Client Summary', pageWidth / 2, 25, { align: 'center' })

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

  const exportedOn = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(23, 23, 23)
  doc.text('All Clients', marginX, startY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(82, 82, 82)
  doc.text(`Total Clients: ${clients.length}`, marginX, startY + 12)
  doc.text(`Exported: ${exportedOn}`, marginX, startY + 17)

  const body =
    clients.length === 0
      ? [['—', '—', '—', '—', 'No clients found']]
      : clients.map((c) => [
          c.name,
          c.phone,
          String(c.sites),
          formatPdfAmountCell(c.received),
          formatPdfAmountCell(c.pending),
        ])

  autoTable(doc, {
    startY: startY + 22,
    tableWidth: PDF_TABLE_WIDTH,
    head: [['Client Name', 'Phone', 'Total Sites', 'Received (Rs)', 'Pending (Rs)']],
    body,
    headStyles: { fillColor: [243, 155, 3], textColor: 255, fontStyle: 'bold' },
    styles: PDF_TABLE_BASE_STYLES,
    margin: { left: marginX, right: marginX },
    columnStyles: CLIENT_ALL_TABLE_COLS,
  })

  try {
    const watermarkLogo = await loadPdfLogoDataUrl()
    drawWatermarkOnAllPages(doc, watermarkLogo)
  } catch {
    // Skip watermark if logo cannot load.
  }

  const safeDate = new Date().toISOString().slice(0, 10)
  await savePdf(doc, `all-clients-report-${safeDate}.pdf`)
}

export async function exportAllClientsExcel(clients: ClientExportRow[]) {
  const csv = rowsToCsv(
    ['Client Name', 'Phone', 'Total Sites', 'Revenue', 'Received', 'Pending'],
    clients.map((c) => [c.name, c.phone, c.sites, c.revenue, c.received, c.pending]),
  )
  const safeDate = new Date().toISOString().slice(0, 10)
  await downloadCsv(csv, `all-clients-report-${safeDate}.csv`)
}

export async function exportClientPdf(data: ClientReportExportData) {
  const { client, sites, visits = [], credits = [], totals } = data
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const marginX = PDF_MARGIN
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 36

  try {
    const logoDataUrl = await loadImageAsDataUrl(
      typeof invoiceLogo === 'string' ? invoiceLogo : String(invoiceLogo),
    )
    doc.addImage(logoDataUrl, 'JPEG', marginX, 8, 22, 22)
  } catch {
    // Keep header spacing even when logo is unavailable.
  }

  const companyName = (data.companyName ?? 'Samarth Land Surveyors').trim() || 'Samarth Land Surveyors'
  const adminLine = [data.adminName?.trim(), data.adminPhone?.trim()].filter(Boolean).join(' - ')
  const coworkerLine = [data.coworkerName?.trim(), data.coworkerPhone?.trim()].filter(Boolean).join(' - ')
  const contactRightX = pageWidth - marginX

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(23, 23, 23)
  doc.text(companyName, pageWidth / 2, 14, { align: 'center' })
  doc.setFontSize(10)
  doc.text('Client Report', pageWidth / 2, 20, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(82, 82, 82)
  doc.text('Client Summary & Visits', pageWidth / 2, 25, { align: 'center' })

  doc.setTextColor(45, 45, 45)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.text(adminLine || '—', contactRightX, 12, { align: 'right' })
  doc.text(coworkerLine || '—', contactRightX, 17, { align: 'right' })
  doc.setDrawColor(60, 60, 60)
  doc.line(marginX, 30, pageWidth - marginX, 30)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(23, 23, 23)
  doc.text(`Client Report: ${client.name}`, marginX, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(82, 82, 82)
  doc.text(`Phone: ${client.phone}`, marginX, y)
  y += 5
  doc.text(`Total Sites: ${client.sites}`, marginX, y)
  y += 7

  const summaryCol1 = marginX
  const summaryCol2 = marginX + 58
  const summaryCol3 = marginX + 116
  const summaryFontSize = 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(summaryFontSize)
  doc.setTextColor(82, 82, 82)
  doc.text('Total Revenue', summaryCol1, y)
  doc.text('Received', summaryCol2, y)
  doc.text('Pending', summaryCol3, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(summaryFontSize)
  doc.setTextColor(82, 82, 82)
  doc.text(client.revenue, summaryCol1, y)
  doc.text(client.received, summaryCol2, y)
  doc.text(client.pending, summaryCol3, y)
  if (totals) {
    y += 5
    doc.text(`Credits (transactions): ${formatInrPlain(totals.creditTotal)}`, marginX, y)
  }
  y += 5
  doc.text(
    `Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
    marginX,
    y,
  )
  y += 8

  doc.setFontSize(11)
  doc.setTextColor(35, 35, 35)
  doc.text('Sites', marginX, y)
  y += 2

  const siteBody =
    sites.length === 0
      ? [['—', '—', '—', 'No sites found', '—']]
      : sites.map((s) => [
          s.name,
          s.location,
          s.lastVisit,
          s.status,
          formatPdfAmountCell(s.pending),
        ])

  autoTable(doc, {
    startY: y,
    tableWidth: PDF_TABLE_WIDTH,
    head: [['Site Name', 'Location', 'Last Visit', 'Status', 'Pending (Rs)']],
    body: siteBody,
    headStyles: { fillColor: [243, 155, 3], textColor: 255, fontStyle: 'bold' },
    styles: PDF_TABLE_BASE_STYLES,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    columnStyles: CLIENT_SITE_TABLE_COLS,
  })

  y = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 10

  doc.setFontSize(11)
  doc.text('Site Visits', marginX, y)
  y += 2

  const visitBody =
    visits.length === 0
      ? [['—', '—', '—', '—', '—', '—', 'No visits']]
      : visits.map((v) => [
          v.id,
          v.visitNo != null ? String(v.visitNo) : '—',
          v.date,
          v.site,
          v.machine,
          v.paymentStatus,
          formatPdfAmountCell(v.amount),
        ])

  autoTable(doc, {
    startY: y,
    tableWidth: PDF_TABLE_WIDTH,
    head: [['Visit ID', 'Visit No.', 'Date', 'Site', 'Machine', 'Status', 'Amount (Rs)']],
    body: visitBody,
    headStyles: { fillColor: [243, 155, 3], textColor: 255, fontStyle: 'bold' },
    styles: { ...PDF_TABLE_BASE_STYLES, fontSize: 8 },
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    columnStyles: CLIENT_VISIT_TABLE_COLS,
  })

  y = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 10

  if (y > 250) {
    doc.addPage()
    y = 20
  }

  doc.setFontSize(11)
  doc.text('Client Credit Transactions', marginX, y)
  y += 2

  const creditBody =
    credits.length === 0
      ? [['—', '—', '—', '—', '—', 'No credit transactions']]
      : credits.map((c) => [
          c.date,
          c.site,
          formatPdfAmountCell(c.amount),
          c.paymentMode,
          c.receivedBy,
          c.notes || '—',
        ])

  autoTable(doc, {
    startY: y,
    tableWidth: PDF_TABLE_WIDTH,
    head: [['Date', 'Site', 'Amount (Rs)', 'Payment Mode', 'Received By', 'Notes']],
    body: creditBody,
    headStyles: { fillColor: [243, 155, 3], textColor: 255, fontStyle: 'bold' },
    styles: { ...PDF_TABLE_BASE_STYLES, fontSize: 8 },
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    columnStyles: CLIENT_CREDIT_TABLE_COLS,
  })

  y = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 12

  if (totals) {
    doc.setFontSize(10)
    doc.setTextColor(55, 55, 55)
    doc.text(`Total revenue: ${formatInrPlain(totals.revenue)}`, marginX, y)
    y += 5
    doc.text(`Total received / credits: ${formatInrPlain(totals.received)}`, marginX, y)
    y += 5
    doc.text(`Credit transactions total: ${formatInrPlain(totals.creditTotal)}`, marginX, y)
    y += 5
    doc.setFont('helvetica', 'bold')
    doc.text(`Pending amount: ${formatInrPlain(totals.pending)}`, marginX, y)
  }

  const safeName = client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const safeDate = new Date().toISOString().slice(0, 10)
  await savePdf(doc, `client-report-${safeName || 'client'}-${safeDate}.pdf`)
}

export async function exportClientExcel(data: ClientReportExportData) {
  const { client, sites, visits = [], credits = [] } = data
  const sections: string[] = []

  sections.push(
    rowsToCsv(
      ['Client', 'Phone', 'Sites', 'Revenue', 'Received', 'Pending'],
      [[client.name, client.phone, client.sites, client.revenue, client.received, client.pending]],
    ),
  )
  sections.push('')
  sections.push(
    rowsToCsv(
      ['Site Name', 'Location', 'Last Visit', 'Status', 'Pending'],
      sites.length
        ? sites.map((s) => [s.name, s.location, s.lastVisit, s.status, s.pending])
        : [['—', '—', '—', '—', 'No sites']],
    ),
  )
  sections.push('')
  sections.push(
    rowsToCsv(
      ['Visit ID', 'Visit No.', 'Date', 'Site', 'Machine', 'Status', 'Amount'],
      visits.length
        ? visits.map((v) => [v.id, v.visitNo ?? '', v.date, v.site, v.machine, v.paymentStatus, v.amount])
        : [['—', '—', '—', '—', '—', '—', 'No visits']],
    ),
  )
  sections.push('')
  sections.push(
    rowsToCsv(
      ['Date', 'Site', 'Amount', 'Payment Mode', 'Received By', 'Notes'],
      credits.length
        ? credits.map((c) => [c.date, c.site, c.amount, c.paymentMode, c.receivedBy, c.notes ?? ''])
        : [['—', '—', '—', '—', '—', 'No credits']],
    ),
  )

  const safeName = client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const safeDate = new Date().toISOString().slice(0, 10)
  await downloadCsv(sections.join('\n'), `client-report-${safeName || 'client'}-${safeDate}.csv`)
}
