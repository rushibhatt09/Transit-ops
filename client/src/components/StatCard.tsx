import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedNumber from './AnimatedNumber'
import { staggerItem } from './ui'

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'brand',
  suffix = '',
}: {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: 'brand' | 'emerald' | 'amber' | 'red' | 'blue'
  suffix?: string
}) {
  const accents: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  }
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -3 }}
      className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-4 shadow-card dark:shadow-card-dark hover:shadow-glow transition-shadow duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-accent-500/0 group-hover:from-brand-500/[0.04] group-hover:to-accent-500/[0.06] transition-all duration-300" />
      <div className={`relative h-11 w-11 shrink-0 rounded-lg flex items-center justify-center ${accents[accent]}`}>
        <Icon size={20} />
      </div>
      <div className="relative">
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight tabular-nums">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
          {suffix}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </motion.div>
  )
}
