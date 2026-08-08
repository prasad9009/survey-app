import {
  Activity,
  Briefcase,
  Building2,
  CheckCircle2,
  CircleUserRound,
  ClipboardList,
  FileCheck,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  LogOut,
  Menu,
  Save,
  ShieldCheck,
  Upload,
  UsersRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { AccountManagerSidebarBlock } from '../AccountManagerSidebarBlock'
import { CollaborationBrandMark } from '../CollaborationBrandMark'
import { LayoutFooter } from '../LayoutFooter'
import { BackgroundRefreshIndicator } from '../components/BackgroundRefreshIndicator'
import { HeaderAdminBadge } from '../components/HeaderAdminBadge'
import { HeaderYearSelect } from '../components/HeaderYearSelect'
import { PageRefreshButton } from '../components/PageRefreshButton'
import { SuperAdminNav } from '../components/SuperAdminNav'
import { SuperAdminSidebar } from '../components/SuperAdminSidebar'
import { CardPanel, CardShell, StatCard } from '../dashboardCards'
import http from '../services/http'
import { getApiErrorMessage } from '../services/request'
import { signOut } from '../signOut'
import { notify } from '../utils/notify'

type CompanySettingsProps = {
  onNavigate: (path: string) => void
}

export default function CompanySettings({ onNavigate }: CompanySettingsProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Profile metadata
  const [legalName, setLegalName] = useState('')
  const [gstin, setGstin] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  // Invoice defaults
  const [invoiceTerms, setInvoiceTerms] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Asset URLs / File Upload states
  const [logoUrl, setLogoUrl] = useState('')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [stampUrl, setStampUrl] = useState('')

  const fetchCompanySettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await http.get('/api/settings/company')
      const data = res.data?.company || res.data
      if (data) {
        setLegalName(data.name || data.legalName || '')
        setGstin(data.gstin || '')
        setOwnerName(data.ownerName || '')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setAddress(data.address || '')
        setInvoiceTerms(data.invoiceTerms || data.settings?.invoiceTerms || '')
        setPaymentNotes(data.paymentNotes || data.settings?.paymentNotes || '')
        if (data.logoUrl) setLogoUrl(data.logoUrl)
        if (data.signatureUrl) setSignatureUrl(data.signatureUrl)
        if (data.stampUrl) setStampUrl(data.stampUrl)
      }
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to load company settings'), 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanySettings()
  }, [fetchCompanySettings])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await http.put('/api/settings/company', {
        name: legalName,
        gstin,
        ownerName,
        phone,
        email,
        address,
        invoiceTerms,
        paymentNotes,
      })
      notify('Company profile and invoice defaults saved successfully.', 'success')
      fetchCompanySettings()
    } catch (err) {
      notify(getApiErrorMessage(err, 'Failed to save company settings'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAssetUpload = async (endpoint: string, file: File, label: string) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      await http.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      notify(`${label} uploaded successfully.`, 'success')
      fetchCompanySettings()
    } catch (err) {
      notify(getApiErrorMessage(err, `Failed to upload ${label}`), 'error')
    }
  }

  return (
    <div className="app-layout-root flex min-h-dvh flex-col bg-neutral-100 text-neutral-900 font-sans antialiased">
      <SuperAdminSidebar
        currentPath="/super-admin/company"
        onNavigate={onNavigate}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Wrapper */}
      <div className="flex flex-1 flex-col lg:ml-[280px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Company Settings</h1>
          </div>
          <div className="flex items-center gap-3">
            <HeaderAdminBadge onNavigate={onNavigate} />
            <HeaderYearSelect />
            <BackgroundRefreshIndicator />
            <PageRefreshButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">

          {isLoading ? (
            <div className="py-12 text-center text-sm font-medium text-neutral-500">
              Loading organization details...
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Organization Profile */}
              <CardShell>
                <CardPanel>
                  <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-neutral-900">
                    <Building2 className="h-5 w-5 text-neutral-700" />
                    Legal Organization Profile
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Company Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="Samarth Land Surveyors"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">GSTIN Number</label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        placeholder="27ABCDE1234F1Z5"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Owner / Authorized Signee Name</label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Survey Lead"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Official Contact Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Official Address</label>
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Full registered office address for invoice headers"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </CardPanel>
              </CardShell>

              {/* Organization Branding & Digital Assets */}
              <CardShell>
                <CardPanel>
                  <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-neutral-900">
                    <ImageIcon className="h-5 w-5 text-neutral-700" />
                    Branding Assets & Invoice Signatures
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-3">
                    {/* Logo Uploader */}
                    <div className="rounded-xl border border-neutral-200 p-4 text-center">
                      <div className="text-xs font-bold text-neutral-700 mb-2">Company Logo</div>
                      <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-neutral-50 border border-dashed border-neutral-300 overflow-hidden">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="max-h-20 max-w-full object-contain" />
                        ) : (
                          <span className="text-xs text-neutral-400">No logo uploaded</span>
                        )}
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800">
                        <Upload className="h-3.5 w-3.5" />
                        Upload Logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleAssetUpload('/api/settings/company/logo', e.target.files[0], 'Company Logo')
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Signature Uploader */}
                    <div className="rounded-xl border border-neutral-200 p-4 text-center">
                      <div className="text-xs font-bold text-neutral-700 mb-2">Authorized Signature</div>
                      <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-neutral-50 border border-dashed border-neutral-300 overflow-hidden">
                        {signatureUrl ? (
                          <img src={signatureUrl} alt="Signature" className="max-h-20 max-w-full object-contain" />
                        ) : (
                          <span className="text-xs text-neutral-400">No signature uploaded</span>
                        )}
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800">
                        <Upload className="h-3.5 w-3.5" />
                        Upload Signature
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleAssetUpload('/api/settings/company/invoice-signature', e.target.files[0], 'Invoice Signature')
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Stamp Uploader */}
                    <div className="rounded-xl border border-neutral-200 p-4 text-center">
                      <div className="text-xs font-bold text-neutral-700 mb-2">Official Stamp</div>
                      <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-neutral-50 border border-dashed border-neutral-300 overflow-hidden">
                        {stampUrl ? (
                          <img src={stampUrl} alt="Stamp" className="max-h-20 max-w-full object-contain" />
                        ) : (
                          <span className="text-xs text-neutral-400">No stamp uploaded</span>
                        )}
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800">
                        <Upload className="h-3.5 w-3.5" />
                        Upload Stamp
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleAssetUpload('/api/settings/company/invoice-stamp', e.target.files[0], 'Company Stamp')
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </CardPanel>
              </CardShell>

              {/* Invoice Terms & Defaults */}
              <CardShell>
                <CardPanel>
                  <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-neutral-900">
                    <FileText className="h-5 w-5 text-neutral-700" />
                    Invoice Default Terms & Payment Notes
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Default Terms & Conditions</label>
                      <textarea
                        rows={3}
                        value={invoiceTerms}
                        onChange={(e) => setInvoiceTerms(e.target.value)}
                        placeholder="Payment due within 15 days of invoice date. All land boundary measurements are carried out as per field site markers."
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Invoice Payment Footer Notes</label>
                      <textarea
                        rows={2}
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Thank you for choosing Samarth Land Surveyors! For questions regarding this invoice, contact support."
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </CardPanel>
              </CardShell>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-neutral-800 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving Settings...' : 'Save All Company Settings'}
                </button>
              </div>
            </form>
          )}
        </main>

        <LayoutFooter />
      </div>
    </div>
  )
}
