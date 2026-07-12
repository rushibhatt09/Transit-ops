import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, authorize } from '../middleware/auth'
import { asyncHandler, ApiError } from '../middleware/errorHandler'

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
  asyncHandler(async (req, res) => {
    const { vehicleId } = req.query as Record<string, string>
    const where: any = {}
    if (vehicleId) where.vehicleId = vehicleId
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
    const log = await prisma.fuelLog.create({ data })
    res.status(201).json(log)
  })
)

export default router
