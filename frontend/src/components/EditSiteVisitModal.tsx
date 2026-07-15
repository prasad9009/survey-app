import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import http from '../services/http'
import { AppSelect } from './AppSelect'
import type { InvoicePdfBillingLine } from '../exportInvoicePdf'
import { validateSiteVisitForm } from '../utils/validateSiteVisit'

type BillingLineDraft = { id: string; particular: string; quantity: string; rate: string; amount: string }

function newBillingLineId() {
  return `bl_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function billingLinesToDraft(lines?: InvoicePdfBillingLine[]): BillingLineDraft[] {
  if (!lines?.length) {
    return [{ id: newBillingLineId(), particular: '', quantity: '1', rate: '80', amount: '' }]
  }
  return lines.map((row) => {
    const q = row.quantity ?? 0
    const r = row.rate ?? 0
    const a = row.amount ?? 0
    if (q === 0 && a !== 0) {
      return {
        id: newBillingLineId(),
        particular: row.particular ?? '',
        quantity: '0',
        rate: String(a),
        amount: '',
      }
    }
    return {
      id: newBillingLineId(),
      particular: row.particular ?? '',
      quantity: row.quantity != null ? String(row.quantity) : '',
      rate: row.rate != null ? String(row.rate) : '',
      amount: row.amount != null ? String(row.amount) : '',
    }
  })
}

export type EditSiteVisitInitial = {
  visitMongoId: string
  visitId: string
  date: string
  engineerName?: string
  dwgRefBy?: string
  dwgNo?: string
  machine?: string
  notes?: string
  paymentMode?: string
  paymentStatus?: string
  billingLines?: InvoicePdfBillingLine[]
  billingOtherCharges?: number
  includeDrawingDetails?: boolean
}

type EditSiteVisitModalProps = {
  open: boolean
  initial: EditSiteVisitInitial | null
  onClose: () => void
  onSaved: () => void
}

function parseVisitDateForInput(displayDate: string) {
  const d = new Date(displayDate)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  const parts = displayDate.trim().split(/[\s,/-]+/)
  if (parts.length >= 3) {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    }
    const day = parts[0].padStart(2, '0')
    const mon = months[parts[1].slice(0, 3).toLowerCase()] ?? '01'
    const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`
    return `${year}-${mon}-${day}`
  }
  return new Date().toISOString().slice(0, 10)
}

const fieldClass =
  'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20'

export function EditSiteVisitModal({ open, initial, onClose, onSaved }: EditSiteVisitModalProps) {
  const [visitDate, setVisitDate] = useState('')
  const [engineerName, setEngineerName] = useState('')
  const [dwgRefBy, setDwgRefBy] = useState('')
  const [dwgNo, setDwgNo] = useState('')
  const [machine, setMachine] = useState('Total Station')
  const [notes, setNotes] = useState('')
  const [paymentMode, setPaymentMode] = useState('�')
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [billingLines, setBillingLines] = useState<BillingLineDraft[]>(() => billingLinesToDraft())
  const [billingOtherCharges, setBillingOtherCharges] = useState('0')
  const [showDrawingFields, setShowDrawingFields] = useState(true)
  const [disableToggle, setDisableToggle] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  useEffect(() => {
    if (!open || !initial) return
    setVisitDate(parseVisitDateForInput(initial.date))
    setEngineerName(initial.engineerName ?? '')
    setDwgRefBy(initial.dwgRefBy ?? '')
    setDwgNo(initial.dwgNo ?? '')
    setMachine(initial.machine ?? 'Total Station')
    setNotes(initial.notes ?? '')
    setPaymentMode(initial.paymentMode ?? '')
    const status = (initial.paymentStatus ?? 'pending').toLowerCase()
    setPaymentStatus(status === 'paid' || status === 'partial' || status === 'waived' ? status : 'pending')
    setBillingLines(billingLinesToDraft(initial.billingLines))
    setBillingOtherCharges(String(initial.billingOtherCharges ?? 0))

    const hasDwgInfo = typeof initial.includeDrawingDetails === 'boolean'
      ? initial.includeDrawingDetails
      : Boolean(
          (initial.engineerName ?? '').trim() ||
          (initial.dwgRefBy ?? '').trim() ||
          (initial.dwgNo ?? '').trim() ||
          (initial.machine && initial.machine.trim() !== '' && initial.machine !== '—' && initial.machine !== 'Total Station')
        )
    setShowDrawingFields(hasDwgInfo)
    setDisableToggle(true)
  }, [open, initial])

  const amountRupees = useMemo(() => {
    const lineSum = billingLines.reduce((sum, line) => {
      const q = parseFloat(line.quantity.replace(/[^\d.-]/g, '')) || 0
      const r = parseFloat(line.rate.replace(/[^\d.-]/g, '')) || 0
      if (q !== 0 && r !== 0) return sum + q * r
      if (q === 0 && r !== 0) return sum + r
      return sum + (parseFloat(line.amount.replace(/[^\d.-]/g, '')) || 0)
    }, 0)
    return Math.round(lineSum + (parseFloat(billingOtherCharges.replace(/[^\d.-]/g, '')) || 0))
  }, [billingLines, billingOtherCharges])

  if (!open || !initial) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (savingRef.current) return
    const validationError = validateSiteVisitForm({
      client: 'x', site: 'x', siteAddress: 'x', machine, billingLines, billingOtherCharges, amountRupees,
      requireMachine: showDrawingFields,
    })
    if (validationError) { toast.error(validationError); return }
    savingRef.current = true
    setSaving(true)
    try {
      const res = await http.put<{ ok: boolean; error?: string }>(`/api/site-visits/${initial.visitMongoId}`, {
        visitDate,
        engineerName: showDrawingFields ? engineerName.trim() : '',
        dwgRefBy: showDrawingFields ? dwgRefBy.trim() : '',
        dwgNo: showDrawingFields ? dwgNo.trim() : '',
        machineLabel: showDrawingFields ? machine : '',
        includeDrawingDetails: showDrawingFields,
        workDescription: notes, notes: notes.trim(), paymentMode: paymentMode.trim(), paymentStatus,
        billingLines: billingLines.map((line) => {
          const q = parseFloat(line.quantity.replace(/[^\d.-]/g, '')) || 0
          const r = parseFloat(line.rate.replace(/[^\d.-]/g, '')) || 0
          const flat = parseFloat(line.amount.replace(/[^\d.-]/g, '')) || 0
          if (q !== 0 && r !== 0) return { particular: line.particular.trim(), quantity: q, rate: r }
          if (q === 0 && r !== 0) return { particular: line.particular.trim(), quantity: 0, rate: 0, amount: r }
          return { particular: line.particular.trim(), quantity: 0, rate: 0, ...(flat > 0 ? { amount: flat } : {}) }
        }),
        billingOtherCharges: parseFloat(billingOtherCharges.replace(/[^\d.-]/g, '')) || 0,
        amount: amountRupees,
      })
      if (!res.data?.ok) { toast.error(res.data?.error ?? 'Could not update visit'); return }
      toast.success('Site visit updated')
      onSaved()
      onClose()
    } catch { toast.error('Could not update visit') } finally {
      savingRef.current = false
      setSaving(false)
    }
  }


  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
          <div>
            <div className="text-base font-extrabold text-neutral-900">Edit site visit</div>
            <div className="text-xs font-semibold text-neutral-500">{initial.visitId}</div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <label className="grid gap-1"><span className="text-xs font-bold text-neutral-700">Visit Date</span><input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className={fieldClass} /></label>

            {/* Form Toggle Switch */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 transition-all hover:bg-neutral-50">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-neutral-800">
                  Include Engg & Drawing Details
                </span>
                {disableToggle && (
                  <p className="text-[10px] font-semibold text-neutral-400">
                    {showDrawingFields
                      ? 'Locked: details included on creation'
                      : 'Locked: details not included on creation'}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={disableToggle}
                onClick={() => setShowDrawingFields(!showDrawingFields)}
                className={[
                  'relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#f39b03]/30 focus:ring-offset-2',
                  showDrawingFields ? 'bg-[#f39b03]' : 'bg-neutral-200',
                  disableToggle ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
                role="switch"
                aria-checked={showDrawingFields}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    showDrawingFields ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </div>

            {showDrawingFields && (
              <>
                <label className="grid gap-1"><span className="text-xs font-bold text-neutral-700">Engg. Name</span><input value={engineerName} onChange={(e) => setEngineerName(e.target.value)} className={fieldClass} placeholder="Engineer name" /></label>
                <label className="grid gap-1"><span className="text-xs font-bold text-neutral-700">DWG Ref. By</span><input value={dwgRefBy} onChange={(e) => setDwgRefBy(e.target.value)} className={fieldClass} placeholder="Enter DWG reference by" /></label>
                <label className="grid gap-1"><span className="text-xs font-bold text-neutral-700">DWG No.</span><input value={dwgNo} onChange={(e) => setDwgNo(e.target.value)} className={fieldClass} placeholder="Enter DWG number" /></label>
                <label className="grid gap-1"><span className="text-xs font-bold text-neutral-700">Machine</span><input value={machine} onChange={(e) => setMachine(e.target.value)} className={fieldClass} /></label>
              </>
            )}
            <label className="grid gap-1"><span className="text-xs font-bold text-neutral-700">Payment mode</span><input value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={fieldClass} /></label>
            <label className="grid gap-1"><span className="text-xs font-bold text-neutral-700">Payment status</span><AppSelect value={paymentStatus} onChange={setPaymentStatus} className={fieldClass} options={[{ value: 'pending', label: 'Pending' }, { value: 'partial', label: 'Partial' }, { value: 'paid', label: 'Paid' }, { value: 'waived', label: 'Waived' }]} /></label>
            {billingLines.map((line, idx) => (
              <div key={line.id} className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                <label className="grid gap-1 col-span-2">
                  <span className="text-xs font-bold text-neutral-700">Particular #{idx + 1}</span>
                  <input value={line.particular} onChange={(e) => setBillingLines((prev) => prev.map((r) => r.id === line.id ? { ...r, particular: e.target.value } : r))} placeholder="Enter description/particular" className={fieldClass} />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-bold text-neutral-700">Quantity</span>
                  <input value={line.quantity} onChange={(e) => setBillingLines((prev) => prev.map((r) => r.id === line.id ? { ...r, quantity: e.target.value } : r))} placeholder="Quantity" className={fieldClass} />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-bold text-neutral-700">Rate</span>
                  <input value={line.rate} onChange={(e) => setBillingLines((prev) => prev.map((r) => r.id === line.id ? { ...r, rate: e.target.value } : r))} placeholder="Rate" className={fieldClass} />
                </label>
              </div>
            ))}
            <label className="grid gap-1"><span className="text-xs font-bold text-neutral-700">Other charges</span><input value={billingOtherCharges} onChange={(e) => setBillingOtherCharges(e.target.value)} className={fieldClass} /></label>
            <label className="grid gap-1"><span className="text-xs font-bold text-neutral-700">Notes / work details</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none focus:border-[#f39b03]/80 focus:ring-2 focus:ring-[#f39b03]/20" /></label>
            <div className="text-sm font-extrabold text-emerald-700">Amount: Rs {amountRupees.toLocaleString('en-IN')}</div>
          </div>
          <div className="flex justify-end gap-2 border-t border-neutral-100 px-4 py-3">
            <button type="button" onClick={onClose} className="h-11 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-extrabold text-neutral-700">Cancel</button>
            <button type="submit" disabled={saving} className="h-11 rounded-xl bg-[#f39b03] px-5 text-sm font-extrabold text-white disabled:opacity-60">{saving ? 'Saving�' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
