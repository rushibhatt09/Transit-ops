import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, authorize } from '../middleware/auth'
import { asyncHandler, ApiError } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)

const driverSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseCategory: z.string().min(1),
  licenseExpiry: z.coerce.date(),
  contactNumber: z.string().min(1),
  safetyScore: z.coerce.number().min(0).max(100).default(100),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
})

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { licenseNumber: { contains: search } },
      ]
    }
    const drivers = await prisma.driver.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json(drivers)
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: { trips: { orderBy: { createdAt: 'desc' }, take: 10, include: { vehicle: true } } },
    })
    if (!driver) throw new ApiError(404, 'Driver not found')
    res.json(driver)
  })
)

router.post(
  '/',
  authorize('FLEET_MANAGER'),
  asyncHandler(async (req, res) => {
    const data = driverSchema.parse(req.body)
    const driver = await prisma.driver.create({ data })
    res.status(201).json(driver)
  })
)

router.put(
  '/:id',
  authorize('FLEET_MANAGER', 'SAFETY_OFFICER'),
  asyncHandler(async (req, res) => {
    const data = driverSchema.partial().parse(req.body)
    const existing = await prisma.driver.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new ApiError(404, 'Driver not found')
    const driver = await prisma.driver.update({ where: { id: req.params.id }, data })
    res.json(driver)
  })
)

router.delete(
  '/:id',
  authorize('FLEET_MANAGER'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.driver.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new ApiError(404, 'Driver not found')
    if (existing.status === 'ON_TRIP') {
      throw new ApiError(400, 'Cannot delete a driver who is currently on a trip')
    }
    await prisma.driver.delete({ where: { id: req.params.id } })
    res.status(204).send()
  })
)

export default router
