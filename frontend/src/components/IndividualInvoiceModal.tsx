import { useEffect, useState, type FormEvent } from 'react'
import { Calculator, Calendar, X } from 'lucide-react'
import { buildInvoiceNumber } from '../exportInvoicePdf'
import { todayInvoiceDate } from '../utils/invoiceDate'

export type IndividualInvoiceModalProps = {
  open: boolean
  visitId?: string
  client: string
  site: string
  generating?: boolean
  onClose: () => void
  onGenerate: (invoiceNumber: string, invoiceDate: string) => void | Promise<void>
}

const fieldClass =
  'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20'

export function IndividualInvoiceModal({
  open,
  visitId,
  client,
  site,
  generating = false,
  onClose,
  onGenerate,
}: IndividualInvoiceModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(todayInvoiceDate())

  useEffect(() => {
    if (!open) return
    setInvoiceNumber(buildInvoiceNumber(visitId))
    setInvoiceDate(todayInvoiceDate())
  }, [open, visitId])

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const num = invoiceNumber.trim()
    const date = invoiceDate.trim()
    if (!num || !date) return
    void onGenerate(num, date)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="individual-invoice-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={() => {
          if (!generating) onClose()
        }}
      />
      <div className="relative z-[71] w-full max-w-md rounded-2xl bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-black/10 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f39b03]/12 text-[#c97702] ring-1 ring-[#f39b03]/25">
              <Calculator size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 id="individual-invoice-title" className="text-base font-extrabold text-neutral-950">
                Individual invoice
              </h2>
              <p className="mt-1 text-xs font-semibold text-neutral-600">
                {client} · {site}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-neutral-500 hover:bg-neutral-100"
            aria-label="Close"
            disabled={generating}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wide text-neutral-600" htmlFor="invoice-number">
              Invoice number
            </label>
            <input
              id="invoice-number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className={fieldClass}
              placeholder="INV-4006"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wide text-neutral-600" htmlFor="invoice-date">
              Invoice date
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#f39b03]"
              />
              <input
                id="invoice-date"
                type="text"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className={`${fieldClass} pl-9`}
                placeholder="DD/MM/YYYY"
                required
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={generating}
              className="h-11 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-extrabold text-neutral-700 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating || !invoiceNumber.trim() || !invoiceDate.trim()}
              className="h-11 rounded-xl bg-[#f39b03] px-5 text-sm font-extrabold text-white disabled:opacity-60"
            >
              {generating ? 'Generating…' : 'Generate PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
