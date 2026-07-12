import { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const [closing, setClosing] = useState(false)

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 170)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: 0.18 }}
      onClick={handleClose}
    >
      <motion.div
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto glass rounded-2xl shadow-glow-lg`}
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: closing ? 0 : 1, scale: closing ? 0.97 : 1, y: closing ? 8 : 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/70 dark:border-gray-800/70">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:rotate-90 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  )
}
