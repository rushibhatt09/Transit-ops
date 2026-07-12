import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User as UserIcon, Phone, ShieldCheck, CalendarDays, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { api } from '../lib/api'
import { Driver, Trip } from '../types'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import AnimatedNumber from '../components/AnimatedNumber'
import { Skeleton, SkeletonTable } from '../components/Skeleton'
import { cardClass, thClass, tdClass, staggerContainer, staggerItem } from '../components/ui'

type DriverProfile = Driver & { trips: Trip[] }

export default function Profile() {
  const { user } = useAuth()
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.driverId) {
      setLoading(false)
      return
    }
    api.get<DriverProfile>(`/drivers/${user.driverId}`).then((res) => {
      setDriver(res.data)
      setLoading(false)
    })
  }, [user?.driverId])

  if (!user?.driverId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your driver profile, license, and trip history</p>
        </div>
        <div className={`${cardClass} p-8 text-center text-sm text-gray-400`}>
          No driver profile is linked to this account.
        </div>
      </div>
    )
  }

  if (loading || !driver) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your driver profile, license, and trip history</p>
        </div>
        <div className={`${cardClass} p-5 flex items-center gap-4`}>
          <Skeleton className="h-14 w-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className={`${cardClass} p-5 space-y-3`}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className={`${cardClass} overflow-x-auto`}>
          <SkeletonTable rows={5} cols={6} />
        </div>
      </div>
    )
  }

  const daysRemaining = Math.ceil((new Date(driver.licenseExpiry).getTime() - Date.now()) / 86400000)
  const expired = daysRemaining < 0
  const chipClass = expired
    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    : daysRemaining > 90
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your driver profile, license, and trip history</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={`${cardClass} p-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 flex items-center justify-center">
            <UserIcon size={26} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{driver.name}</h2>
              <StatusBadge status={driver.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-gray-400" /> {driver.licenseNumber}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-gray-400" /> {driver.licenseCategory}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-gray-400" /> {driver.contactNumber}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className={`${cardClass} p-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">License</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              Expires {format(new Date(driver.licenseExpiry), 'dd MMM yyyy')}
            </p>
            <span className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${chipClass}`}>
              {expired && <AlertTriangle size={13} />}
              {expired ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days remaining`}
            </span>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Safety Score</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
              <AnimatedNumber value={driver.safetyScore} />
              <span className="text-base font-medium text-gray-400"> /100</span>
            </p>
          </div>
        </div>
      </motion.div>

      <div>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Trip History</h2>
        <div className={`${cardClass} overflow-x-auto`}>
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className={thClass}>Route</th>
                <th className={thClass}>Vehicle</th>
                <th className={thClass}>Cargo</th>
                <th className={thClass}>Distance</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Date</th>
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer} initial="initial" animate="animate" className="divide-y divide-gray-100 dark:divide-gray-800">
              {driver.trips.map((t) => (
                <motion.tr key={t.id} variants={staggerItem} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className={`${tdClass} font-medium`}>
                    {t.source} → {t.destination}
                  </td>
                  <td className={tdClass}>{t.vehicle?.registrationNumber ?? '—'}</td>
                  <td className={tdClass}>{t.cargoWeight.toLocaleString()} kg</td>
                  <td className={tdClass}>{(t.actualDistance ?? t.plannedDistance).toLocaleString()} km</td>
                  <td className={tdClass}>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className={tdClass}>{format(new Date(t.createdAt), 'dd MMM yyyy')}</td>
                </motion.tr>
              ))}
              {driver.trips.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No trips yet.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
