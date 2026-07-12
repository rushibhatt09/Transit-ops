import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Role } from '../types'
import Layout from './Layout'

export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Access restricted</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your role ({user.role.replace('_', ' ')}) does not have permission to view this page.
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
