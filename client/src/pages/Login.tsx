import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../lib/api'
import { inputClass, labelClass, primaryBtn } from '../components/ui'

const DEMO_ACCOUNTS = [
  { role: 'Fleet Manager', email: 'fleet.manager@transitops.com' },
  { role: 'Driver', email: 'driver@transitops.com' },
  { role: 'Safety Officer', email: 'safety.officer@transitops.com' },
  { role: 'Financial Analyst', email: 'finance.analyst@transitops.com' },
]

export default function Login() {
  const { user, login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Welcome back!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white mb-3">
            <Truck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TransitOps</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Smart Transport Operations Platform</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@transitops.com"
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className={`${primaryBtn} w-full justify-center`}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="mt-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Demo accounts (password: password123)
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email)
                  setPassword('password123')
                }}
                className="flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <span className="font-medium text-gray-700 dark:text-gray-200">{acc.role}</span>
                <span className="text-gray-400">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
