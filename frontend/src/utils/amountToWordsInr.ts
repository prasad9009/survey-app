import { parsePdfAmount } from './pdfTableStyles'

const BELOW_20 = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
] as const

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'] as const

function wordsBelow100(n: number): string {
  if (n < 20) return BELOW_20[n] ?? ''
  const t = Math.floor(n / 10)
  const o = n % 10
  return o ? `${TENS[t]} ${BELOW_20[o]}` : TENS[t]
}

function wordsBelow1000(n: number): string {
  if (n < 100) return wordsBelow100(n)
  const h = Math.floor(n / 100)
  const rest = n % 100
  const head = `${BELOW_20[h]} Hundred`
  return rest ? `${head} ${wordsBelow100(rest)}` : head
}

/** Indian numbering: crore → lakh → thousand → remainder (up to 999). */
function integerToIndianWords(n: number): string {
  if (n === 0) return 'Zero'
  const parts: string[] = []
  let rem = n

  const crore = Math.floor(rem / 10_000_000)
  rem %= 10_000_000
  const lakh = Math.floor(rem / 100_000)
  rem %= 100_000
  const thousand = Math.floor(rem / 1000)
  rem %= 1000

  if (crore) parts.push(`${wordsBelow100(crore)} Crore`)
  if (lakh) parts.push(`${wordsBelow100(lakh)} Lakh`)
  if (thousand) parts.push(`${wordsBelow1000(thousand)} Thousand`)
  if (rem) parts.push(wordsBelow1000(rem))

  return parts.join(' ').trim()
}

function parseAmountValue(amount: string | number): number | null {
  if (typeof amount === 'number') return Number.isFinite(amount) ? amount : null
  const raw = String(amount).trim()
  if (!raw || raw === '—' || !/\d/.test(raw)) return null
  const n = parsePdfAmount(raw)
  return Number.isFinite(n) ? n : null
}

/** e.g. "Rupees Twelve Thousand Five Hundred Only" */
export function amountToWordsInr(amount: string | number): string {
  const value = parseAmountValue(amount)
  if (value == null || value <= 0) return ''

  const rupees = Math.floor(value)
  const paise = Math.round((value - rupees) * 100)

  const rupeeWords = integerToIndianWords(rupees)
  if (paise > 0) {
    const paiseWords = integerToIndianWords(paise)
    return `Rupees ${rupeeWords} and ${paiseWords} Paise Only`
  }
  return `Rupees ${rupeeWords} Only`
}
