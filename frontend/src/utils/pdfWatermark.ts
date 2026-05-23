import jsPDF from 'jspdf'
import invoiceLogo from '../assets/logo.jpeg'

export async function loadPdfLogoDataUrl(): Promise<string> {
  const src = typeof invoiceLogo === 'string' ? invoiceLogo : String(invoiceLogo)
  const response = await fetch(src)
  const blob = await response.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Unable to load logo'))
    reader.readAsDataURL(blob)
  })
}

function dataUrlImageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.includes('image/jpeg')) return 'JPEG'
  if (dataUrl.includes('image/webp')) return 'WEBP'
  return 'PNG'
}

function drawWatermark(
  doc: jsPDF,
  logoDataUrl: string,
  pageWidth: number,
  pageHeight: number,
  opacity = 0.08,
) {
  const fmt = dataUrlImageFormat(logoDataUrl)
  const watermarkSize = 105
  const watermarkX = (pageWidth - watermarkSize) / 2
  const watermarkY = (pageHeight - watermarkSize) / 2 + 10
  const pdfDoc = doc as jsPDF & {
    GState?: new (options: { opacity?: number }) => unknown
    setGState?: (state: unknown) => void
  }
  if (pdfDoc.GState && pdfDoc.setGState) {
    pdfDoc.setGState(new pdfDoc.GState({ opacity }))
    doc.addImage(logoDataUrl, fmt, watermarkX, watermarkY, watermarkSize, watermarkSize)
    pdfDoc.setGState(new pdfDoc.GState({ opacity: 1 }))
  } else {
    doc.addImage(logoDataUrl, fmt, watermarkX, watermarkY, watermarkSize, watermarkSize)
  }
}

/** Centered logo watermark on every page (drawn before save). */
export function drawWatermarkOnAllPages(doc: jsPDF, logoDataUrl: string, opacity = 0.06) {
  const totalPages = doc.getNumberOfPages()
  const activePage = doc.getCurrentPageInfo().pageNumber
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    drawWatermark(doc, logoDataUrl, pageWidth, pageHeight, opacity)
  }
  doc.setPage(activePage)
}
