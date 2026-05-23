import type { CompanyAdminContact } from '../context/AuthContext'



export type AdminContactLine = { fullName: string; phone: string }



export type InstrumentCoworkerPeer = {

  adminId: string

  fullName: string

  phone: string

}



/** Company admins visible for the active instrument (same rules as Site Details PDF). */

export function instrumentScopedAdmins(

  companyAdmins: CompanyAdminContact[],

  activeInstrumentId: string | null | undefined,

): CompanyAdminContact[] {

  return companyAdmins.filter((a) => {

    if (!activeInstrumentId) return true

    const ids = a.instrumentIds ?? []

    if (ids.length === 0) return true

    return ids.includes(activeInstrumentId)

  })

}



/** Merge instrument coworker peers (from /instruments/coworkers) into scoped company admins. */

export function scopedAdminsForInstrumentReports(

  companyAdmins: CompanyAdminContact[],

  activeInstrumentId: string | null | undefined,

  instrumentCoworkers?: InstrumentCoworkerPeer[],

): CompanyAdminContact[] {

  const scoped = instrumentScopedAdmins(companyAdmins, activeInstrumentId)

  const byId = new Map(scoped.map((a) => [a.id, a]))

  for (const peer of instrumentCoworkers ?? []) {

    const id = peer.adminId.trim()

    if (!id || byId.has(id)) continue

    const fullName = peer.fullName?.trim() || ''

    const phone = peer.phone?.trim() || ''

    if (!fullName && !phone) continue

    byId.set(id, {

      id,

      fullName,

      phone,

      instrumentIds: activeInstrumentId ? [activeInstrumentId] : [],

    })

  }

  return [...byId.values()]

}



/**

 * PDF header: ledger owner admin on line 1, coworker admin on line 2.

 * Falls back to logged-in user when ledger admin is unknown.

 */

export function resolveLedgerReportHeaderContacts(opts: {

  user?: { id?: string; fullName?: string; phone?: string } | null

  companyAdmins: CompanyAdminContact[]

  activeInstrumentId: string | null | undefined

  ledgerAdminId?: string | null

  instrumentCoworkers?: InstrumentCoworkerPeer[]

}): { admin: AdminContactLine; coworker: AdminContactLine | null } {

  const scoped = scopedAdminsForInstrumentReports(

    opts.companyAdmins,

    opts.activeInstrumentId,

    opts.instrumentCoworkers,

  ).filter((a) => (a.fullName || '').trim() || (a.phone || '').trim())



  const ledgerAdminId = (opts.ledgerAdminId ?? '').trim()

  const ledgerOwner =

    (ledgerAdminId ? scoped.find((a) => a.id === ledgerAdminId) : null) ??

    (opts.user?.id ? scoped.find((a) => a.id === opts.user.id) : null) ??

    scoped[0] ??

    null



  const coworker = ledgerOwner ? scoped.find((a) => a.id !== ledgerOwner.id) ?? null : scoped[1] ?? null



  const admin: AdminContactLine = {

    fullName: ledgerOwner?.fullName?.trim() || opts.user?.fullName?.trim() || '',

    phone: ledgerOwner?.phone?.trim() || opts.user?.phone?.trim() || '',

  }



  const coworkerContact: AdminContactLine | null = coworker

    ? { fullName: coworker.fullName?.trim() || '', phone: coworker.phone?.trim() || '' }

    : null



  return { admin, coworker: coworkerContact }

}

/**
 * PDF header for instrument-scoped list reports (site visits, all clients):
 * first two admins assigned to the active instrument (plus instrument coworkers).
 */
export function resolveInstrumentReportHeaderContacts(opts: {
  companyAdmins: CompanyAdminContact[]
  activeInstrumentId: string | null | undefined
  instrumentCoworkers?: InstrumentCoworkerPeer[]
}): { admin: AdminContactLine; coworker: AdminContactLine | null } {
  const scoped = scopedAdminsForInstrumentReports(
    opts.companyAdmins,
    opts.activeInstrumentId,
    opts.instrumentCoworkers,
  ).filter((a) => (a.fullName || '').trim() || (a.phone || '').trim())

  const first = scoped[0] ?? null
  const second = scoped[1] ?? null

  return {
    admin: {
      fullName: first?.fullName?.trim() ?? '',
      phone: first?.phone?.trim() ?? '',
    },
    coworker: second
      ? { fullName: second.fullName?.trim() || '', phone: second.phone?.trim() || '' }
      : null,
  }
}

