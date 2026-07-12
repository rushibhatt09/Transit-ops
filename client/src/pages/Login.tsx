import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Truck, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../lib/api'
import { inputClass, labelClass } from '../components/ui'

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-950 px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-400/30 dark:bg-brand-600/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-accent-400/30 dark:bg-accent-500/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-brand-300/30 dark:bg-brand-800/20 blur-3xl animate-blob" style={{ animationDelay: '8s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center text-white mb-3 shadow-glow-lg">
            <Truck size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">TransitOps</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Smart Transport Operations Platform</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass rounded-2xl p-6 shadow-glow-lg"
        >
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
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg disabled:opacity-50 transition-shadow duration-200"
            >
              {loading ? 'Signing in...' : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-5 glass rounded-2xl p-4"
        >
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
                className="flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:translate-x-0.5 transition-all duration-150"
              >
                <span className="font-medium text-gray-700 dark:text-gray-200">{acc.role}</span>
                <span className="text-gray-400">{acc.email}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
