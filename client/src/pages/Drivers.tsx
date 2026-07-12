import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, ArrowUpDown, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { api, getErrorMessage } from '../lib/api'
import { Driver } from '../types'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { primaryBtn, secondaryBtn, inputClass, labelClass, cardClass, thClass, tdClass } from '../components/ui'

const STATUS_OPTIONS = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']

const emptyForm = {
  name: '',
  licenseNumber: '',
  licenseCategory: '',
  licenseExpiry: '',
  contactNumber: '',
  safetyScore: '100',
  status: 'AVAILABLE',
}

export default function Drivers() {
  const { user } = useAuth()
  const canWrite = user?.role === 'FLEET_MANAGER' || user?.role === 'SAFETY_OFFICER'
  const canDelete = user?.role === 'FLEET_MANAGER'
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState<keyof Driver>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  function load() {
    api.get<Driver[]>('/drivers').then((res) => setDrivers(res.data))
  }
  useEffect(load, [])

  const filtered = useMemo(() => {
    let list = drivers
    if (statusFilter) list = list.filter((d) => d.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q))
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return list
  }, [drivers, statusFilter, search, sortKey, sortDir])

  function toggleSort(key: keyof Driver) {
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

  function openEdit(d: Driver) {
    setEditing(d)
    setForm({
      name: d.name,
      licenseNumber: d.licenseNumber,
      licenseCategory: d.licenseCategory,
      licenseExpiry: d.licenseExpiry.slice(0, 10),
      contactNumber: d.contactNumber,
      safetyScore: String(d.safetyScore),
      status: d.status,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, safetyScore: Number(form.safetyScore) }
      if (editing) {
        await api.put(`/drivers/${editing.id}`, payload)
        toast.success('Driver updated')
      } else {
        await api.post('/drivers', payload)
        toast.success('Driver added')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(d: Driver) {
    if (!confirm(`Remove driver ${d.name}?`)) return
    try {
      await api.delete(`/drivers/${d.id}`)
      toast.success('Driver removed')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  function isExpired(d: Driver) {
    return new Date(d.licenseExpiry).getTime() < Date.now()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Driver Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Profiles, licenses, and safety compliance</p>
        </div>
        {user?.role === 'FLEET_MANAGER' && (
          <button onClick={openCreate} className={primaryBtn}>
            <Plus size={16} /> Add Driver
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or license number..." className={`${inputClass} pl-9`} />
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
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className={thClass}>
                <button onClick={() => toggleSort('name')} className="flex items-center gap-1">
                  Name <ArrowUpDown size={12} />
                </button>
              </th>
              <th className={thClass}>License Number</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>
                <button onClick={() => toggleSort('licenseExpiry')} className="flex items-center gap-1">
                  License Expiry <ArrowUpDown size={12} />
                </button>
              </th>
              <th className={thClass}>Contact</th>
              <th className={thClass}>
                <button onClick={() => toggleSort('safetyScore')} className="flex items-center gap-1">
                  Safety Score <ArrowUpDown size={12} />
                </button>
              </th>
              <th className={thClass}>Status</th>
              {canWrite && <th className={thClass}>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className={`${tdClass} font-medium`}>{d.name}</td>
                <td className={tdClass}>{d.licenseNumber}</td>
                <td className={tdClass}>{d.licenseCategory}</td>
                <td className={tdClass}>
                  <span className={`flex items-center gap-1 ${isExpired(d) ? 'text-red-500 font-medium' : ''}`}>
                    {isExpired(d) && <AlertTriangle size={13} />}
                    {format(new Date(d.licenseExpiry), 'dd MMM yyyy')}
                  </span>
                </td>
                <td className={tdClass}>{d.contactNumber}</td>
                <td className={tdClass}>{d.safetyScore}</td>
                <td className={tdClass}>
                  <StatusBadge status={d.status} />
                </td>
                {canWrite && (
                  <td className={tdClass}>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(d)} className="text-gray-500 hover:text-brand-600">
                        <Pencil size={16} />
                      </button>
                      {canDelete && (
                        <button onClick={() => handleDelete(d)} className="text-gray-500 hover:text-red-600">
                          <Trash2 size={16} />
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
                  No drivers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Driver' : 'Add Driver'} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>License Number</label>
              <input required className={inputClass} value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>License Category</label>
              <input required className={inputClass} placeholder="LMV / HMV" value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>License Expiry Date</label>
              <input required type="date" className={inputClass} value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Contact Number</label>
              <input required className={inputClass} value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Safety Score (0-100)</label>
              <input required type="number" min="0" max="100" className={inputClass} value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className={secondaryBtn} onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={primaryBtn}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Driver'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
