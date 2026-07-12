import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import vehicleRoutes from './routes/vehicles'
import driverRoutes from './routes/drivers'
import tripRoutes from './routes/trips'
import maintenanceRoutes from './routes/maintenance'
import fuelLogRoutes from './routes/fuelLogs'
import expenseRoutes from './routes/expenses'
import dashboardRoutes from './routes/dashboard'
import reportRoutes from './routes/reports'
import notificationRoutes from './routes/notifications'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/fuel-logs', fuelLogRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/notifications', notificationRoutes)

app.use((req, res) => res.status(404).json({ message: `Not found: ${req.method} ${req.path}` }))
app.use(errorHandler)

const PORT = Number(process.env.PORT) || 4000
app.listen(PORT, () => {
  console.log(`TransitOps API listening on http://localhost:${PORT}`)
})
