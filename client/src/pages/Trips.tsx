import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Rocket, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { api, getErrorMessage } from '../lib/api'
import { Trip, Vehicle, Driver } from '../types'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { primaryBtn, secondaryBtn, inputClass, labelClass, cardClass, thClass, tdClass } from '../components/ui'

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
]

const emptyForm = { source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDistance: '' }
const emptyCompleteForm = { finalOdometer: '', fuelConsumed: '', fuelCost: '', revenue: '' }

export default function Trips() {
  const { user } = useAuth()
  const canManage = user?.role === 'FLEET_MANAGER' || user?.role === 'DRIVER'
  const [trips, setTrips] = useState<Trip[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [tab, setTab] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [completingTrip, setCompletingTrip] = useState<Trip | null>(null)
  const [completeForm, setCompleteForm] = useState(emptyCompleteForm)

  function load() {
    api.get<Trip[]>('/trips').then((res) => setTrips(res.data))
  }
  useEffect(load, [])

  function loadAvailability() {
    api.get<Vehicle[]>('/vehicles', { params: { status: 'AVAILABLE' } }).then((res) => setAvailableVehicles(res.data))
    api.get<Driver[]>('/drivers', { params: { status: 'AVAILABLE' } }).then((res) => setAvailableDrivers(res.data))
  }

  const filtered = useMemo(() => {
    let list = trips
    if (tab) list = list.filter((t) => t.status === tab)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.source.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q))
    }
    return list
  }, [trips, tab, search])

  const selectedVehicle = availableVehicles.find((v) => v.id === form.vehicleId)
  const selectedDriverValid = availableDrivers.find((d) => d.id === form.driverId)
  const cargoExceeds = selectedVehicle && Number(form.cargoWeight) > selectedVehicle.maxLoadCapacity

  function openCreate() {
    setForm(emptyForm)
    loadAvailability()
    setCreateOpen(true)
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/trips', { ...form, cargoWeight: Number(form.cargoWeight), plannedDistance: Number(form.plannedDistance) })
      toast.success('Trip created as draft')
      setCreateOpen(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDispatch(trip: Trip) {
    try {
      await api.post(`/trips/${trip.id}/dispatch`)
      toast.success('Trip dispatched')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  function openComplete(trip: Trip) {
    setCompletingTrip(trip)
    setCompleteForm({ finalOdometer: String(trip.vehicle?.odometer ?? ''), fuelConsumed: '', fuelCost: '', revenue: '' })
  }

  async function handleComplete(e: FormEvent) {
    e.preventDefault()
    if (!completingTrip) return
    setSaving(true)
    try {
      await api.post(`/trips/${completingTrip.id}/complete`, {
        finalOdometer: Number(completeForm.finalOdometer),
        fuelConsumed: Number(completeForm.fuelConsumed || 0),
        fuelCost: Number(completeForm.fuelCost || 0),
        revenue: Number(completeForm.revenue || 0),
      })
      toast.success('Trip completed')
      setCompletingTrip(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(trip: Trip) {
    if (!confirm('Cancel this trip?')) return
    try {
      await api.post(`/trips/${trip.id}/cancel`)
      toast.success('Trip cancelled')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Trip Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dispatch, monitor, and close out deliveries</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className={primaryBtn}>
            <Plus size={16} /> Create Trip
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === t.key ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative sm:w-96">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by source or destination..." className={`${inputClass} pl-9`} />
      </div>

      <div className={`${cardClass} overflow-x-auto`}>
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className={thClass}>Route</th>
              <th className={thClass}>Vehicle</th>
              <th className={thClass}>Driver</th>
              <th className={thClass}>Cargo (kg)</th>
              <th className={thClass}>Distance</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Created</th>
              {canManage && <th className={thClass}>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className={`${tdClass} font-medium`}>
                  {t.source} → {t.destination}
                </td>
                <td className={tdClass}>{t.vehicle?.registrationNumber}</td>
                <td className={tdClass}>{t.driver?.name}</td>
                <td className={tdClass}>{t.cargoWeight}</td>
                <td className={tdClass}>
                  {t.actualDistance ?? t.plannedDistance} {t.actualDistance ? '(actual)' : '(planned)'} km
                </td>
                <td className={tdClass}>
                  <StatusBadge status={t.status} />
                </td>
                <td className={tdClass}>{format(new Date(t.createdAt), 'dd MMM yyyy')}</td>
                {canManage && (
                  <td className={tdClass}>
                    <div className="flex gap-2">
                      {t.status === 'DRAFT' && (
                        <button title="Dispatch" onClick={() => handleDispatch(t)} className="text-gray-500 hover:text-blue-600">
                          <Rocket size={16} />
                        </button>
                      )}
                      {t.status === 'DISPATCHED' && (
                        <button title="Complete" onClick={() => openComplete(t)} className="text-gray-500 hover:text-emerald-600">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {(t.status === 'DRAFT' || t.status === 'DISPATCHED') && (
                        <button title="Cancel" onClick={() => handleCancel(t)} className="text-gray-500 hover:text-red-600">
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  No trips found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <Modal title="Create Trip" onClose={() => setCreateOpen(false)} wide>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Source</label>
              <input required className={inputClass} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Destination</label>
              <input required className={inputClass} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Available Vehicle</label>
              <select required className={inputClass} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Select vehicle...</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.name} (max {v.maxLoadCapacity}kg)
                  </option>
                ))}
              </select>
              {availableVehicles.length === 0 && <p className="text-xs text-amber-500 mt-1">No available vehicles right now.</p>}
            </div>
            <div>
              <label className={labelClass}>Available Driver</label>
              <select required className={inputClass} value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                <option value="">Select driver...</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.licenseCategory})
                  </option>
                ))}
              </select>
              {availableDrivers.length === 0 && <p className="text-xs text-amber-500 mt-1">No available drivers right now.</p>}
            </div>
            <div>
              <label className={labelClass}>Cargo Weight (kg)</label>
              <input required type="number" min="0" step="any" className={inputClass} value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} />
              {cargoExceeds && <p className="text-xs text-red-500 mt-1">Exceeds vehicle's max load capacity!</p>}
            </div>
            <div>
              <label className={labelClass}>Planned Distance (km)</label>
              <input required type="number" min="0" step="any" className={inputClass} value={form.plannedDistance} onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })} />
            </div>
            {!selectedDriverValid && form.driverId && <p className="text-xs text-red-500 sm:col-span-2">Selected driver is no longer available.</p>}
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className={secondaryBtn} onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={saving || !!cargoExceeds} className={primaryBtn}>
                {saving ? 'Creating...' : 'Create Trip'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {completingTrip && (
        <Modal title={`Complete Trip: ${completingTrip.source} → ${completingTrip.destination}`} onClose={() => setCompletingTrip(null)}>
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className={labelClass}>Final Odometer Reading (km)</label>
              <input required type="number" step="any" className={inputClass} value={completeForm.finalOdometer} onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Fuel Consumed (liters)</label>
              <input required type="number" min="0" step="any" className={inputClass} value={completeForm.fuelConsumed} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Fuel Cost (optional)</label>
              <input type="number" min="0" step="any" className={inputClass} value={completeForm.fuelCost} onChange={(e) => setCompleteForm({ ...completeForm, fuelCost: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Trip Revenue (optional, for ROI reporting)</label>
              <input type="number" min="0" step="any" className={inputClass} value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={secondaryBtn} onClick={() => setCompletingTrip(null)}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={primaryBtn}>
                {saving ? 'Completing...' : 'Complete Trip'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
