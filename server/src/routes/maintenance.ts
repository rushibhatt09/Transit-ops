import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, authorize } from '../middleware/auth'
import { asyncHandler, ApiError } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)

const createSchema = z.object({
  vehicleId: z.string().min(1),
  description: z.string().min(1),
  cost: z.coerce.number().min(0),
  date: z.coerce.date().optional(),
})

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, vehicleId } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (vehicleId) where.vehicleId = vehicleId
    const logs = await prisma.maintenanceLog.findMany({
      where,
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(logs)
  })
)

router.post(
  '/',
  authorize('FLEET_MANAGER'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } })
    if (!vehicle) throw new ApiError(404, 'Vehicle not found')
    if (vehicle.status === 'ON_TRIP') throw new ApiError(400, 'Cannot send a vehicle to maintenance while it is on a trip')
    if (vehicle.status === 'RETIRED') throw new ApiError(400, 'Cannot create a maintenance record for a retired vehicle')

    const [log] = await prisma.$transaction([
      prisma.maintenanceLog.create({ data: { ...data, status: 'OPEN' } }),
      prisma.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'IN_SHOP' } }),
    ])
    res.status(201).json(log)
  })
)

router.post(
  '/:id/close',
  authorize('FLEET_MANAGER'),
  asyncHandler(async (req, res) => {
    const log = await prisma.maintenanceLog.findUnique({ where: { id: req.params.id }, include: { vehicle: true } })
    if (!log) throw new ApiError(404, 'Maintenance record not found')
    if (log.status === 'CLOSED') throw new ApiError(400, 'Maintenance record is already closed')

    const updatedLog = await prisma.maintenanceLog.update({
      where: { id: log.id },
      data: { status: 'CLOSED', closedAt: new Date() },
    })

    const remainingOpen = await prisma.maintenanceLog.count({
      where: { vehicleId: log.vehicleId, status: 'OPEN' },
    })
    if (remainingOpen === 0 && log.vehicle.status !== 'RETIRED') {
      await prisma.vehicle.update({ where: { id: log.vehicleId }, data: { status: 'AVAILABLE' } })
    }

    res.json(updatedLog)
  })
)

export default router
