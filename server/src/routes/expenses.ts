import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, authorize } from '../middleware/auth'
import { asyncHandler, ApiError } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)

const schema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum(['TOLL', 'MAINTENANCE', 'OTHER']),
  amount: z.coerce.number().min(0),
  date: z.coerce.date().optional(),
  description: z.string().optional().nullable(),
})

router.get(
  '/',
  authorize('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  asyncHandler(async (req, res) => {
    const { vehicleId, type } = req.query as Record<string, string>
    const where: any = {}
    if (vehicleId) where.vehicleId = vehicleId
    if (type) where.type = type
    const expenses = await prisma.expense.findMany({ where, include: { vehicle: true }, orderBy: { date: 'desc' } })
    res.json(expenses)
  })
)

router.post(
  '/',
  authorize('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body)
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } })
    if (!vehicle) throw new ApiError(404, 'Vehicle not found')
    const expense = await prisma.expense.create({ data })
    res.status(201).json(expense)
  })
)

export default router
