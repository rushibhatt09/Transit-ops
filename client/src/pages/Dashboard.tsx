import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Truck, CheckCircle2, Wrench, Route as RouteIcon, Clock, Users, Gauge, Fuel, ShieldCheck, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { api } from '../lib/api'
import { DashboardData, DriverDashboardData, Vehicle } from '../types'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { SkeletonCards } from '../components/Skeleton'
import { cardClass, inputClass, staggerContainer, staggerItem } from '../components/ui'

const PIE_COLORS = ['#10b981', '#4f6bff', '#f59e0b', '#9ca3af']

export default function Dashboard() {
  const { user } = useAuth()
  if (user?.role === 'DRIVER') return <DriverDashboard />
  return <FleetDashboard />
}

function DriverDashboard() {
  const [data, setData] = useState<DriverDashboardData['driver'] | null>(null)

  useEffect(() => {
    api.get<DriverDashboardData>('/dashboard').then((res) => setData(res.data.driver))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your trips, performance, and license status</p>
      </div>

      {!data ? (
        <SkeletonCards count={4} />
      ) : (
        <>
          {data.profile.licenseDaysRemaining < 30 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 rounded-xl border p-4 ${
                data.profile.licenseDaysRemaining < 0
                  ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                  : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300'
              }`}
            >
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">
                  {data.profile.licenseDaysRemaining < 0
                    ? 'Your driving license has expired'
                    : `Your driving license expires in ${data.profile.licenseDaysRemaining} day${data.profile.licenseDaysRemaining === 1 ? '' : 's'}`}
                </p>
                <p className="text-sm">
                  License {data.profile.licenseNumber} — expiry {format(new Date(data.profile.licenseExpiry), 'dd MMM yyyy')}. Please renew it to stay eligible for trips.
                </p>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <StatCard label="Completed Trips" value={data.stats.completedTrips} icon={CheckCircle2} accent="emerald" />
            <StatCard label="Total Distance (km)" value={data.stats.totalDistance} icon={RouteIcon} accent="brand" />
            <StatCard label="Fuel Used (L)" value={data.stats.totalFuel} icon={Fuel} accent="amber" />
            <StatCard label="Safety Score" value={data.profile.safetyScore} icon={ShieldCheck} accent="blue" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={`${cardClass} p-4`}
            >
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Active Trip</p>
              {data.activeTrip ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {data.activeTrip.source} → {data.activeTrip.destination}
                    </p>
                    <StatusBadge status={data.activeTrip.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {data.activeTrip.vehicle
                          ? `${data.activeTrip.vehicle.registrationNumber} · ${data.activeTrip.vehicle.name}`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cargo Weight</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {data.activeTrip.cargoWeight.toLocaleString()} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Planned Distance</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {data.activeTrip.plannedDistance.toLocaleString()} km
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Dispatched On</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {data.activeTrip.dispatchedAt ? format(new Date(data.activeTrip.dispatchedAt), 'dd MMM yyyy') : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-11 w-11 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3">
                    <Truck size={20} />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No active trip right now</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">You'll see your assignment here once dispatched.</p>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className={`${cardClass} p-4`}
            >
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Recent Trips</p>
              {data.recentTrips.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">No trips yet.</p>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="divide-y divide-gray-100 dark:divide-gray-800"
                >
                  {data.recentTrips.map((t) => (
                    <motion.div key={t.id} variants={staggerItem} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {t.source} → {t.destination}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t.vehicle?.registrationNumber || '—'} · {format(new Date(t.completedAt || t.dispatchedAt || t.createdAt), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <StatusBadge status={t.status} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
}

function FleetDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [type, setType] = useState('')
  const [region, setRegion] = useState('')

  useEffect(() => {
    api.get<Vehicle[]>('/vehicles').then((res) => setVehicles(res.data))
  }, [])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (type) params.type = type
    if (region) params.region = region
    api.get<DashboardData>('/dashboard', { params }).then((res) => setData(res.data))
  }, [type, region])

  const types = useMemo(() => Array.from(new Set(vehicles.map((v) => v.type))), [vehicles])
  const regions = useMemo(() => Array.from(new Set(vehicles.map((v) => v.region))), [vehicles])

  const tripBars = data
    ? [
        { name: 'Active Trips', value: data.activeTrips },
        { name: 'Pending Trips', value: data.pendingTrips },
        { name: 'Drivers On Duty', value: data.driversOnDuty },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Live overview of your fleet, drivers, and trips</p>
        </div>
        <div className="flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputClass} w-40`}>
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={`${inputClass} w-40`}>
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!data ? (
        <SkeletonCards count={7} />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <StatCard label="Active Vehicles" value={data.activeVehicles} icon={Truck} accent="brand" />
          <StatCard label="Available Vehicles" value={data.availableVehicles} icon={CheckCircle2} accent="emerald" />
          <StatCard label="Vehicles in Maintenance" value={data.vehiclesInMaintenance} icon={Wrench} accent="amber" />
          <StatCard label="Active Trips" value={data.activeTrips} icon={RouteIcon} accent="blue" />
          <StatCard label="Pending Trips" value={data.pendingTrips} icon={Clock} accent="amber" />
          <StatCard label="Drivers On Duty" value={`${data.driversOnDuty}/${data.totalDrivers}`} icon={Users} accent="blue" />
          <StatCard label="Fleet Utilization" value={data.fleetUtilization} suffix="%" icon={Gauge} accent="brand" />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`${cardClass} p-4`}
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Fleet Status Breakdown</p>
          {data && (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.fleetByStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2} animationDuration={800} animationEasing="ease-out">
                  {data.fleetByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className={`${cardClass} p-4`}
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Operations Snapshot</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tripBars}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#4f6bff" radius={[6, 6, 0, 0]} animationDuration={700} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
