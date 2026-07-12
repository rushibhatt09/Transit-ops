import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Truck, CheckCircle2, Wrench, Route as RouteIcon, Clock, Users, Gauge } from 'lucide-react'
import { api } from '../lib/api'
import { DashboardData, Vehicle } from '../types'
import StatCard from '../components/StatCard'
import { SkeletonCards } from '../components/Skeleton'
import { cardClass, inputClass, staggerContainer } from '../components/ui'

const PIE_COLORS = ['#10b981', '#4f6bff', '#f59e0b', '#9ca3af']

export default function Dashboard() {
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
