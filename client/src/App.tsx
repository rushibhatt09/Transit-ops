import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Trips from './pages/Trips'
import Maintenance from './pages/Maintenance'
import FuelExpenses from './pages/FuelExpenses'
import Reports from './pages/Reports'
import Profile from './pages/Profile'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trips" element={<Trips />} />
      </Route>
      <Route element={<ProtectedRoute roles={['DRIVER']} />}>
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route element={<ProtectedRoute roles={['FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']} />}>
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/maintenance" element={<Maintenance />} />
      </Route>
      <Route element={<ProtectedRoute roles={['FLEET_MANAGER', 'FINANCIAL_ANALYST']} />}>
        <Route path="/fuel-expenses" element={<FuelExpenses />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}
