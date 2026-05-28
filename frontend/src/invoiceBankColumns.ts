import http from './services/http'
import type { InvoicePdfBankColumns } from './exportInvoicePdf'

export async function fetchInvoiceBankColumns(
  instrumentId?: string | null,
): Promise<InvoicePdfBankColumns | undefined> {
  try {
    const res = await http.get<{ ok: boolean; bankColumns: InvoicePdfBankColumns }>(
      '/api/settings/invoice-bank-columns',
      {
        params: instrumentId ? { instrumentId } : undefined,
      },
    )
    if (res.data?.ok && res.data.bankColumns) return res.data.bankColumns
  } catch {
    // PDF still renders; empty columns show "—" until the API is reachable
  }
  return undefined
}
