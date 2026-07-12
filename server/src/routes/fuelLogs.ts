import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, authorize } from '../middleware/auth'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { requireOwnDriver } from '../utils/scope'

const router = Router()
router.use(authenticate)

const schema = z.object({
  vehicleId: z.string().min(1),
  liters: z.coerce.number().positive(),
  cost: z.coerce.number().min(0),
  date: z.coerce.date().optional(),
  tripId: z.string().optional().nullable(),
})

router.get(
  '/',
  authorize('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DRIVER'),
  asyncHandler(async (req, res) => {
    const { vehicleId } = req.query as Record<string, string>
    const where: any = {}
    if (vehicleId) where.vehicleId = vehicleId
    if (req.user!.role === 'DRIVER') {
      const own = await requireOwnDriver(req.user!.id)
      where.trip = { driverId: own.id }
    }
    const logs = await prisma.fuelLog.findMany({ where, include: { vehicle: true }, orderBy: { date: 'desc' } })
    res.json(logs)
  })
)

router.post(
  '/',
  authorize('FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST'),
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body)
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } })
    if (!vehicle) throw new ApiError(404, 'Vehicle not found')
    if (req.user!.role === 'DRIVER') {
      const own = await requireOwnDriver(req.user!.id)
      const activeTrip = await prisma.trip.findFirst({
        where: { driverId: own.id, vehicleId: data.vehicleId, status: 'DISPATCHED' },
      })
      if (!activeTrip) throw new ApiError(403, 'You can only log fuel for a vehicle on your active trip')
      data.tripId = activeTrip.id
    }
    const log = await prisma.fuelLog.create({ data })
    res.status(201).json(log)
  })
)

export default router
