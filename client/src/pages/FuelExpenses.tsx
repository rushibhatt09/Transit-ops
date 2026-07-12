import { FormEvent, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { api, getErrorMessage } from '../lib/api'
import { FuelLog, Expense, Vehicle, ExpenseType } from '../types'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { SkeletonTable } from '../components/Skeleton'
import { primaryBtn, secondaryBtn, inputClass, labelClass, cardClass, thClass, tdClass, staggerContainer, staggerItem } from '../components/ui'

const EXPENSE_TYPES: ExpenseType[] = ['TOLL', 'MAINTENANCE', 'OTHER']

const emptyFuelForm = { vehicleId: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10) }
const emptyExpenseForm = { vehicleId: '', type: 'TOLL' as ExpenseType, amount: '', description: '', date: new Date().toISOString().slice(0, 10) }

export default function FuelExpenses() {
  const { user } = useAuth()
  const canLogFuel = user?.role === 'FLEET_MANAGER' || user?.role === 'DRIVER' || user?.role === 'FINANCIAL_ANALYST'
  const canLogExpense = user?.role === 'FLEET_MANAGER' || user?.role === 'FINANCIAL_ANALYST'

  const [tab, setTab] = useState<'fuel' | 'expenses'>('fuel')
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  const [fuelModalOpen, setFuelModalOpen] = useState(false)
  const [fuelForm, setFuelForm] = useState(emptyFuelForm)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    Promise.all([
      api.get<FuelLog[]>('/fuel-logs').then((res) => setFuelLogs(res.data)),
      api.get<Expense[]>('/expenses').then((res) => setExpenses(res.data)),
      api.get<Vehicle[]>('/vehicles').then((res) => setVehicles(res.data)),
    ]).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleFuelSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/fuel-logs', { ...fuelForm, liters: Number(fuelForm.liters), cost: Number(fuelForm.cost) })
      toast.success('Fuel log recorded')
      setFuelModalOpen(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleExpenseSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/expenses', { ...expenseForm, amount: Number(expenseForm.amount) })
      toast.success('Expense recorded')
      setExpenseModalOpen(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0)
  const totalExpenseCost = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fuel &amp; Expense Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total fuel cost ₹{totalFuelCost.toLocaleString()} · Total other expenses ₹{totalExpenseCost.toLocaleString()}
          </p>
        </div>
        {tab === 'fuel' && canLogFuel && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setFuelForm(emptyFuelForm)
              setFuelModalOpen(true)
            }}
            className={primaryBtn}
          >
            <Plus size={16} /> Log Fuel
          </motion.button>
        )}
        {tab === 'expenses' && canLogExpense && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setExpenseForm(emptyExpenseForm)
              setExpenseModalOpen(true)
            }}
            className={primaryBtn}
          >
            <Plus size={16} /> Log Expense
          </motion.button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('fuel')}
          className={`relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'fuel' ? 'text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'}`}
        >
          {tab === 'fuel' && (
            <motion.span
              layoutId="fuelExpenseTabPill"
              className="absolute inset-0 rounded-lg bg-brand-600"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative">Fuel Logs</span>
        </button>
        <button
          onClick={() => setTab('expenses')}
          className={`relative overflow-hidden px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'expenses' ? 'text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'}`}
        >
          {tab === 'expenses' && (
            <motion.span
              layoutId="fuelExpenseTabPill"
              className="absolute inset-0 rounded-lg bg-brand-600"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative">Expenses</span>
        </button>
      </div>

      {tab === 'fuel' ? (
        <div className={`${cardClass} overflow-x-auto`}>
          {loading ? (
            <SkeletonTable rows={5} cols={4} />
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className={thClass}>Vehicle</th>
                  <th className={thClass}>Liters</th>
                  <th className={thClass}>Cost</th>
                  <th className={thClass}>Date</th>
                </tr>
              </thead>
              <motion.tbody
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="divide-y divide-gray-100 dark:divide-gray-800"
              >
                {fuelLogs.map((f) => (
                  <motion.tr key={f.id} variants={staggerItem} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className={`${tdClass} font-medium`}>{f.vehicle?.registrationNumber}</td>
                    <td className={tdClass}>{f.liters} L</td>
                    <td className={tdClass}>₹{f.cost.toLocaleString()}</td>
                    <td className={tdClass}>{format(new Date(f.date), 'dd MMM yyyy')}</td>
                  </motion.tr>
                ))}
                {fuelLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                      No fuel logs found.
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          )}
        </div>
      ) : (
        <div className={`${cardClass} overflow-x-auto`}>
          {loading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className={thClass}>Vehicle</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Amount</th>
                  <th className={thClass}>Description</th>
                  <th className={thClass}>Date</th>
                </tr>
              </thead>
              <motion.tbody
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="divide-y divide-gray-100 dark:divide-gray-800"
              >
                {expenses.map((e) => (
                  <motion.tr key={e.id} variants={staggerItem} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className={`${tdClass} font-medium`}>{e.vehicle?.registrationNumber}</td>
                    <td className={tdClass}>{e.type}</td>
                    <td className={tdClass}>₹{e.amount.toLocaleString()}</td>
                    <td className={tdClass}>{e.description}</td>
                    <td className={tdClass}>{format(new Date(e.date), 'dd MMM yyyy')}</td>
                  </motion.tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                      No expenses found.
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          )}
        </div>
      )}

      {fuelModalOpen && (
        <Modal title="Log Fuel" onClose={() => setFuelModalOpen(false)}>
          <form onSubmit={handleFuelSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Vehicle</label>
              <select required className={inputClass} value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}>
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Liters</label>
              <input required type="number" min="0" step="any" className={inputClass} value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Cost</label>
              <input required type="number" min="0" step="any" className={inputClass} value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input required type="date" className={inputClass} value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={secondaryBtn} onClick={() => setFuelModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={primaryBtn}>
                {saving ? 'Saving...' : 'Log Fuel'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {expenseModalOpen && (
        <Modal title="Log Expense" onClose={() => setExpenseModalOpen(false)}>
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Vehicle</label>
              <select required className={inputClass} value={expenseForm.vehicleId} onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}>
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value as ExpenseType })}>
                {EXPENSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Amount</label>
              <input required type="number" min="0" step="any" className={inputClass} value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <input className={inputClass} value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input required type="date" className={inputClass} value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={secondaryBtn} onClick={() => setExpenseModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={primaryBtn}>
                {saving ? 'Saving...' : 'Log Expense'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
