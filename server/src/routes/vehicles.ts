import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, authorize } from '../middleware/auth'
import { asyncHandler, ApiError } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  maxLoadCapacity: z.coerce.number().positive(),
  odometer: z.coerce.number().min(0).default(0),
  acquisitionCost: z.coerce.number().min(0),
  region: z.string().min(1).default('Unassigned'),
  documentUrl: z.string().optional().nullable(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
})

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, type, region, search } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type
    if (region) where.region = region
    if (search) {
      where.OR = [
        { registrationNumber: { contains: search } },
        { name: { contains: search } },
      ]
    }
    if (req.user!.role === 'DRIVER') where.status = 'AVAILABLE'
    const vehicles = await prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json(vehicles)
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        trips: { orderBy: { createdAt: 'desc' }, take: 10, include: { driver: true } },
        maintenance: { orderBy: { createdAt: 'desc' } },
        fuelLogs: { orderBy: { date: 'desc' } },
        expenses: { orderBy: { date: 'desc' } },
      },
    })
    if (!vehicle) throw new ApiError(404, 'Vehicle not found')
    res.json(vehicle)
  })
)

router.post(
  '/',
  authorize('FLEET_MANAGER'),
  asyncHandler(async (req, res) => {
    const data = vehicleSchema.parse(req.body)
    const vehicle = await prisma.vehicle.create({ data })
    res.status(201).json(vehicle)
  })
)

router.put(
  '/:id',
  authorize('FLEET_MANAGER'),
  asyncHandler(async (req, res) => {
    const data = vehicleSchema.partial().parse(req.body)
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new ApiError(404, 'Vehicle not found')
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data })
    res.json(vehicle)
  })
)

router.delete(
  '/:id',
  authorize('FLEET_MANAGER'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new ApiError(404, 'Vehicle not found')
    if (existing.status === 'ON_TRIP') {
      throw new ApiError(400, 'Cannot delete a vehicle that is currently on a trip')
    }
    await prisma.vehicle.delete({ where: { id: req.params.id } })
    res.status(204).send()
  })
)

export default router
