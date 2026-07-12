import { FormEvent, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Pencil, Trash2, ArrowUpDown, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { api, getErrorMessage } from '../lib/api'
import { Vehicle, Trip, MaintenanceLog, FuelLog, Expense } from '../types'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { SkeletonTable } from '../components/Skeleton'
import { primaryBtn, secondaryBtn, dangerBtn, inputClass, labelClass, cardClass, thClass, tdClass, staggerContainer, staggerItem } from '../components/ui'

const STATUS_OPTIONS = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']

const DETAIL_TABS = ['Trips', 'Maintenance', 'Fuel'] as const
type DetailTab = (typeof DETAIL_TABS)[number]

interface VehicleDetail extends Vehicle {
  trips: Trip[]
  maintenance: MaintenanceLog[]
  fuelLogs: FuelLog[]
  expenses: Expense[]
}

const emptyForm = {
  registrationNumber: '',
  name: '',
  type: '',
  maxLoadCapacity: '',
  odometer: '',
  acquisitionCost: '',
  region: '',
  documentUrl: '',
  status: 'AVAILABLE',
}

export default function Vehicles() {
  const { user } = useAuth()
  const canWrite = user?.role === 'FLEET_MANAGER'
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState<keyof Vehicle>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState<Vehicle | null>(null)
  const [detail, setDetail] = useState<VehicleDetail | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('Trips')

  function load() {
    api.get<Vehicle[]>('/vehicles').then((res) => {
      setVehicles(res.data)
      setLoaded(true)
    })
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    let list = vehicles
    if (statusFilter) list = list.filter((v) => v.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((v) => v.registrationNumber.toLowerCase().includes(q) || v.name.toLowerCase().includes(q))
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return list
  }, [vehicles, statusFilter, search, sortKey, sortDir])

  function toggleSort(key: keyof Vehicle) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(v: Vehicle) {
    setEditing(v)
    setForm({
      registrationNumber: v.registrationNumber,
      name: v.name,
      type: v.type,
      maxLoadCapacity: String(v.maxLoadCapacity),
      odometer: String(v.odometer),
      acquisitionCost: String(v.acquisitionCost),
      region: v.region,
      documentUrl: v.documentUrl || '',
      status: v.status,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        maxLoadCapacity: Number(form.maxLoadCapacity),
        odometer: Number(form.odometer),
        acquisitionCost: Number(form.acquisitionCost),
      }
      if (editing) {
        await api.put(`/vehicles/${editing.id}`, payload)
        toast.success('Vehicle updated')
      } else {
        await api.post('/vehicles', payload)
        toast.success('Vehicle registered')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  function openDetail(v: Vehicle) {
    setViewing(v)
    setDetail(null)
    setDetailTab('Trips')
    api
      .get<VehicleDetail>(`/vehicles/${v.id}`)
      .then((res) => setDetail(res.data))
      .catch((err) => {
        toast.error(getErrorMessage(err))
        setViewing(null)
      })
  }

  async function handleDelete(v: Vehicle) {
    if (!confirm(`Delete vehicle ${v.registrationNumber}?`)) return
    try {
      await api.delete(`/vehicles/${v.id}`)
      toast.success('Vehicle deleted')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const columns: { key: keyof Vehicle; label: string }[] = [
    { key: 'registrationNumber', label: 'Reg. Number' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'maxLoadCapacity', label: 'Max Load (kg)' },
    { key: 'odometer', label: 'Odometer (km)' },
    { key: 'acquisitionCost', label: 'Acquisition Cost' },
    { key: 'region', label: 'Region' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Registry</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Master list of fleet vehicles</p>
        </div>
        {canWrite && (
          <motion.button
            onClick={openCreate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={primaryBtn}
          >
            <Plus size={16} /> Register Vehicle
          </motion.button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by registration number or name..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} sm:w-52`}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className={`${cardClass} overflow-x-auto`}>
        {!loaded ? (
          <SkeletonTable rows={5} cols={9} />
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-800">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={thClass}>
                    <button onClick={() => toggleSort(c.key)} className="flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200">
                      {c.label} <ArrowUpDown size={12} />
                    </button>
                  </th>
                ))}
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="divide-y divide-gray-100 dark:divide-gray-800"
            >
              {filtered.map((v) => (
                <motion.tr key={v.id} variants={staggerItem} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className={`${tdClass} font-medium`}>{v.registrationNumber}</td>
                  <td className={tdClass}>{v.name}</td>
                  <td className={tdClass}>{v.type}</td>
                  <td className={tdClass}>{v.maxLoadCapacity}</td>
                  <td className={tdClass}>{v.odometer}</td>
                  <td className={tdClass}>₹{v.acquisitionCost.toLocaleString()}</td>
                  <td className={tdClass}>{v.region}</td>
                  <td className={tdClass}>
                    <StatusBadge status={v.status} />
                  </td>
                  <td className={tdClass}>
                    <div className="flex gap-2">
                      <button title="View details" onClick={() => openDetail(v)} className="text-gray-500 hover:text-brand-600">
                        <Eye size={16} />
                      </button>
                      {canWrite && (
                        <>
                          <button onClick={() => openEdit(v)} className="text-gray-500 hover:text-brand-600">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(v)} className="text-gray-500 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">
                    No vehicles found.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Vehicle' : 'Register Vehicle'} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Registration Number</label>
              <input required className={inputClass} value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Vehicle Name / Model</label>
              <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <input required className={inputClass} placeholder="Van, Truck, Pickup..." value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Region</label>
              <input required className={inputClass} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Max Load Capacity (kg)</label>
              <input required type="number" min="0" step="any" className={inputClass} value={form.maxLoadCapacity} onChange={(e) => setForm({ ...form, maxLoadCapacity: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Odometer (km)</label>
              <input required type="number" min="0" step="any" className={inputClass} value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Acquisition Cost</label>
              <input required type="number" min="0" step="any" className={inputClass} value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Document URL (RC / Insurance / Permit)</label>
              <input className={inputClass} placeholder="https://..." value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className={secondaryBtn} onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={primaryBtn}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Register Vehicle'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={`${viewing.registrationNumber} — ${viewing.name}`} onClose={() => setViewing(null)} wide>
          {!detail ? (
            <SkeletonTable rows={4} cols={4} />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Odometer</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{detail.odometer.toLocaleString()} km</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Max Load</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{detail.maxLoadCapacity.toLocaleString()} kg</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Acquisition Cost</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{detail.acquisitionCost.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Region</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{detail.region}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 flex flex-col gap-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <StatusBadge status={detail.status} />
                </div>
              </div>

              <div className="flex gap-2">
                {DETAIL_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setDetailTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      detailTab === t ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                {detailTab === 'Trips' &&
                  (detail.trips.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">No trips recorded for this vehicle.</p>
                  ) : (
                    <table className="w-full">
                      <thead className="border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className={thClass}>Route</th>
                          <th className={thClass}>Driver</th>
                          <th className={thClass}>Status</th>
                          <th className={thClass}>Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {detail.trips.map((t) => (
                          <tr key={t.id}>
                            <td className={`${tdClass} font-medium`}>
                              {t.source} → {t.destination}
                            </td>
                            <td className={tdClass}>{t.driver?.name || '—'}</td>
                            <td className={tdClass}>
                              <StatusBadge status={t.status} />
                            </td>
                            <td className={tdClass}>{format(new Date(t.createdAt), 'dd MMM yyyy')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ))}

                {detailTab === 'Maintenance' &&
                  (detail.maintenance.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">No maintenance history for this vehicle.</p>
                  ) : (
                    <table className="w-full">
                      <thead className="border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className={thClass}>Description</th>
                          <th className={thClass}>Cost</th>
                          <th className={thClass}>Status</th>
                          <th className={thClass}>Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {detail.maintenance.map((m) => (
                          <tr key={m.id}>
                            <td className={`${tdClass} font-medium`}>{m.description}</td>
                            <td className={tdClass}>₹{m.cost.toLocaleString()}</td>
                            <td className={tdClass}>
                              <StatusBadge status={m.status} />
                            </td>
                            <td className={tdClass}>{format(new Date(m.date), 'dd MMM yyyy')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ))}

                {detailTab === 'Fuel' &&
                  (detail.fuelLogs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">No fuel logs for this vehicle.</p>
                  ) : (
                    <table className="w-full">
                      <thead className="border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className={thClass}>Liters</th>
                          <th className={thClass}>Cost</th>
                          <th className={thClass}>Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {detail.fuelLogs.map((f) => (
                          <tr key={f.id}>
                            <td className={`${tdClass} font-medium`}>{f.liters.toLocaleString()} L</td>
                            <td className={tdClass}>₹{f.cost.toLocaleString()}</td>
                            <td className={tdClass}>{format(new Date(f.date), 'dd MMM yyyy')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ))}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
