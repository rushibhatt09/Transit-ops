import { FormEvent, useEffect, useState } from 'react'
import { Plus, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { api, getErrorMessage } from '../lib/api'
import { MaintenanceLog, Vehicle } from '../types'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { primaryBtn, secondaryBtn, inputClass, labelClass, cardClass, thClass, tdClass } from '../components/ui'

const emptyForm = { vehicleId: '', description: '', cost: '', date: new Date().toISOString().slice(0, 10) }

export default function Maintenance() {
  const { user } = useAuth()
  const canWrite = user?.role === 'FLEET_MANAGER'
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  function load() {
    api.get<MaintenanceLog[]>('/maintenance', { params: statusFilter ? { status: statusFilter } : {} }).then((res) => setLogs(res.data))
  }
  useEffect(load, [statusFilter])

  function openCreate() {
    api.get<Vehicle[]>('/vehicles').then((res) => setVehicles(res.data.filter((v) => v.status !== 'ON_TRIP' && v.status !== 'RETIRED')))
    setForm(emptyForm)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/maintenance', { ...form, cost: Number(form.cost) })
      toast.success('Maintenance record created — vehicle moved to In Shop')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleClose(log: MaintenanceLog) {
    try {
      await api.post(`/maintenance/${log.id}/close`)
      toast.success('Maintenance closed — vehicle restored to Available')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Maintenance Workflow</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track service records and vehicle downtime</p>
        </div>
        {canWrite && (
          <button onClick={openCreate} className={primaryBtn}>
            <Plus size={16} /> New Maintenance Record
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {['', 'OPEN', 'CLOSED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className={`${cardClass} overflow-x-auto`}>
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className={thClass}>Vehicle</th>
              <th className={thClass}>Description</th>
              <th className={thClass}>Cost</th>
              <th className={thClass}>Date</th>
              <th className={thClass}>Status</th>
              {canWrite && <th className={thClass}>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className={`${tdClass} font-medium`}>{log.vehicle?.registrationNumber}</td>
                <td className={tdClass}>{log.description}</td>
                <td className={tdClass}>₹{log.cost.toLocaleString()}</td>
                <td className={tdClass}>{format(new Date(log.date), 'dd MMM yyyy')}</td>
                <td className={tdClass}>
                  <StatusBadge status={log.status} />
                </td>
                {canWrite && (
                  <td className={tdClass}>
                    {log.status === 'OPEN' && (
                      <button title="Close" onClick={() => handleClose(log)} className="text-gray-500 hover:text-emerald-600">
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No maintenance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title="New Maintenance Record" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Vehicle</label>
              <select required className={inputClass} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.name} ({v.status.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <input required className={inputClass} placeholder="e.g. Oil change, brake pads..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Cost</label>
              <input required type="number" min="0" step="any" className={inputClass} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input required type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={secondaryBtn} onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={primaryBtn}>
                {saving ? 'Saving...' : 'Create Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
