import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { api } from '../lib/api'
import { VehicleReport } from '../types'
import { primaryBtn, cardClass, thClass, tdClass, staggerContainer, staggerItem } from '../components/ui'
import { SkeletonTable } from '../components/Skeleton'

export default function Reports() {
  const [report, setReport] = useState<VehicleReport[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.get<VehicleReport[]>('/reports').then((res) => {
      setReport(res.data)
      setLoaded(true)
    })
  }, [])

  async function handleExportCsv() {
    const token = localStorage.getItem('transitops_token')
    const res = await fetch('/api/reports/export', { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transitops-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const totals = report.reduce(
    (acc, r) => ({
      operationalCost: acc.operationalCost + r.operationalCost,
      totalRevenue: acc.totalRevenue + r.totalRevenue,
      totalDistance: acc.totalDistance + r.totalDistance,
    }),
    { operationalCost: 0, totalRevenue: 0, totalDistance: 0 }
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports &amp; Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fleet-wide operational cost ₹{totals.operationalCost.toLocaleString()} · Revenue ₹{totals.totalRevenue.toLocaleString()} · Distance {totals.totalDistance.toLocaleString()} km
          </p>
        </div>
        <motion.button
          onClick={handleExportCsv}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={primaryBtn}
        >
          <Download size={16} /> Export CSV
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`${cardClass} p-4`}
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Fuel Efficiency (km/L)</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
              <XAxis dataKey="registrationNumber" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="fuelEfficiency" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className={`${cardClass} p-4`}
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Operational Cost vs Revenue</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
              <XAxis dataKey="registrationNumber" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="operationalCost" name="Operational Cost" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="totalRevenue" name="Revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className={`${cardClass} overflow-x-auto`}>
        {!loaded ? (
          <SkeletonTable rows={5} cols={10} />
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className={thClass}>Vehicle</th>
                <th className={thClass}>Trips</th>
                <th className={thClass}>Distance (km)</th>
                <th className={thClass}>Fuel (L)</th>
                <th className={thClass}>Fuel Efficiency</th>
                <th className={thClass}>Fuel Cost</th>
                <th className={thClass}>Maintenance Cost</th>
                <th className={thClass}>Operational Cost</th>
                <th className={thClass}>Revenue</th>
                <th className={thClass}>ROI %</th>
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="divide-y divide-gray-100 dark:divide-gray-800"
            >
              {report.map((r) => (
                <motion.tr key={r.vehicleId} variants={staggerItem} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className={`${tdClass} font-medium`}>{r.registrationNumber}</td>
                  <td className={tdClass}>{r.completedTrips}</td>
                  <td className={tdClass}>{r.totalDistance}</td>
                  <td className={tdClass}>{r.totalFuelLiters}</td>
                  <td className={tdClass}>{r.fuelEfficiency.toFixed(2)} km/L</td>
                  <td className={tdClass}>₹{r.totalFuelCost.toLocaleString()}</td>
                  <td className={tdClass}>₹{r.totalMaintenanceCost.toLocaleString()}</td>
                  <td className={tdClass}>₹{r.operationalCost.toLocaleString()}</td>
                  <td className={tdClass}>₹{r.totalRevenue.toLocaleString()}</td>
                  <td className={`${tdClass} font-semibold ${r.roi >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{r.roi.toFixed(1)}%</td>
                </motion.tr>
              ))}
              {report.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">
                    No report data yet.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        )}
      </div>
    </div>
  )
}
