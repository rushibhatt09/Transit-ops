const COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  ON_TRIP: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  IN_SHOP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  RETIRED: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  OFF_DUTY: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  DRAFT: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  DISPATCHED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  CLOSED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

const DOT_COLORS: Record<string, string> = {
  ON_TRIP: 'bg-blue-500',
  DISPATCHED: 'bg-blue-500',
}

const LIVE_STATES = new Set(['ON_TRIP', 'DISPATCHED'])

export default function StatusBadge({ status }: { status: string }) {
  const isLive = LIVE_STATES.has(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${COLORS[status] || 'bg-gray-100 text-gray-600'}`}
    >
      {isLive && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`absolute inline-flex h-full w-full rounded-full ${DOT_COLORS[status]} animate-pulse-ring`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${DOT_COLORS[status]}`} />
        </span>
      )}
      {status.replace('_', ' ')}
    </span>
  )
}
