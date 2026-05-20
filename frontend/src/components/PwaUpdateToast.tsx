type PwaUpdateToastProps = {
  version: string
  onUpdateNow: () => void
  onDismiss: () => void
}

export function PwaUpdateToast({ version, onUpdateNow, onDismiss }: PwaUpdateToastProps) {
  return (
    <div className="w-[min(92vw,420px)] rounded-2xl border border-amber-400/55 bg-black/95 p-4 text-white shadow-2xl backdrop-blur-md">
      <p className="text-sm font-semibold tracking-wide text-amber-300">SurveyOS update ready</p>
      <p className="mt-1 text-sm text-zinc-200">New version available. Update now for the latest fixes.</p>
      <p className="mt-1 text-xs text-zinc-400">Build: {version}</p>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          Later
        </button>
        <button
          type="button"
          onClick={onUpdateNow}
          className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-300"
        >
          Update now
        </button>
      </div>
    </div>
  )
}
