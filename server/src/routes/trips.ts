import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, authorize } from '../middleware/auth'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { requireOwnDriver } from '../utils/scope'

const router = Router()
router.use(authenticate)

const createTripSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  cargoWeight: z.coerce.number().positive(),
  plannedDistance: z.coerce.number().positive(),
})

const completeTripSchema = z.object({
  finalOdometer: z.coerce.number(),
  fuelConsumed: z.coerce.number().min(0),
  fuelCost: z.coerce.number().min(0).default(0),
  revenue: z.coerce.number().min(0).default(0),
})

async function assertAssignable(vehicleId: string, driverId: string, cargoWeight: number) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
  if (!vehicle) throw new ApiError(404, 'Vehicle not found')
  if (vehicle.status === 'RETIRED') throw new ApiError(400, 'Retired vehicles cannot be dispatched')
  if (vehicle.status === 'IN_SHOP') throw new ApiError(400, 'Vehicle is in maintenance and cannot be dispatched')
  if (vehicle.status === 'ON_TRIP') throw new ApiError(400, 'Vehicle is already assigned to another trip')
  if (cargoWeight > vehicle.maxLoadCapacity) {
    throw new ApiError(400, `Cargo weight (${cargoWeight}kg) exceeds vehicle's max load capacity (${vehicle.maxLoadCapacity}kg)`)
  }

  const driver = await prisma.driver.findUnique({ where: { id: driverId } })
  if (!driver) throw new ApiError(404, 'Driver not found')
  if (driver.status === 'SUSPENDED') throw new ApiError(400, 'Driver is suspended and cannot be assigned')
  if (driver.status === 'ON_TRIP') throw new ApiError(400, 'Driver is already assigned to another trip')
  if (driver.status === 'OFF_DUTY') throw new ApiError(400, 'Driver is off duty and cannot be assigned')
  if (new Date(driver.licenseExpiry).getTime() < Date.now()) {
    throw new ApiError(400, 'Driver license has expired and cannot be assigned')
  }

  return { vehicle, driver }
}

async function assertTripAccess(req: { user?: { id: string; role: string } }, tripDriverId: string) {
  if (req.user!.role !== 'DRIVER') return
  const own = await requireOwnDriver(req.user!.id)
  if (own.id !== tripDriverId) throw new ApiError(403, 'You can only manage your own trips')
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { source: { contains: search } },
        { destination: { contains: search } },
      ]
    }
    if (req.user!.role === 'DRIVER') {
      const own = await requireOwnDriver(req.user!.id)
      where.driverId = own.id
    }
    const trips = await prisma.trip.findMany({
      where,
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(trips)
  })
)

router.get(
  '/export',
  authorize('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  asyncHandler(async (_req, res) => {
    const trips = await prisma.trip.findMany({
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: 'desc' },
    })
    const headers = ['Source', 'Destination', 'Vehicle', 'Driver', 'Cargo (kg)', 'Planned Distance (km)', 'Actual Distance (km)', 'Fuel (L)', 'Revenue', 'Status', 'Created', 'Completed']
    const rows = trips.map((t) => [
      t.source,
      t.destination,
      t.vehicle.registrationNumber,
      t.driver.name,
      t.cargoWeight,
      t.plannedDistance,
      t.actualDistance ?? '',
      t.fuelConsumed ?? '',
      t.revenue,
      t.status,
      t.createdAt.toISOString().slice(0, 10),
      t.completedAt ? t.completedAt.toISOString().slice(0, 10) : '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-trips.csv"')
    res.send(csv)
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, driver: true, fuelLogs: true },
    })
    if (!trip) throw new ApiError(404, 'Trip not found')
    if (req.user!.role === 'DRIVER') {
      const own = await requireOwnDriver(req.user!.id)
      if (own.id !== trip.driverId) throw new ApiError(403, 'You can only view your own trips')
    }
    res.json(trip)
  })
)

router.post(
  '/',
  authorize('FLEET_MANAGER', 'DRIVER'),
  asyncHandler(async (req, res) => {
    const data = createTripSchema.parse(req.body)
    if (req.user!.role === 'DRIVER') {
      const own = await requireOwnDriver(req.user!.id)
      data.driverId = own.id
    }
    await assertAssignable(data.vehicleId, data.driverId, data.cargoWeight)
    const trip = await prisma.trip.create({ data: { ...data, status: 'DRAFT' } })
    res.status(201).json(trip)
  })
)

router.post(
  '/:id/dispatch',
  authorize('FLEET_MANAGER', 'DRIVER'),
  asyncHandler(async (req, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } })
    if (!trip) throw new ApiError(404, 'Trip not found')
    await assertTripAccess(req, trip.driverId)
    if (trip.status !== 'DRAFT') throw new ApiError(400, `Only draft trips can be dispatched (current status: ${trip.status})`)

    await assertAssignable(trip.vehicleId, trip.driverId, trip.cargoWeight)

    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({ where: { id: trip.id }, data: { status: 'DISPATCHED', dispatchedAt: new Date() } }),
      prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'ON_TRIP' } }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'ON_TRIP' } }),
    ])
    res.json(updatedTrip)
  })
)

router.post(
  '/:id/complete',
  authorize('FLEET_MANAGER', 'DRIVER'),
  asyncHandler(async (req, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id }, include: { vehicle: true } })
    if (!trip) throw new ApiError(404, 'Trip not found')
    await assertTripAccess(req, trip.driverId)
    if (trip.status !== 'DISPATCHED') throw new ApiError(400, `Only dispatched trips can be completed (current status: ${trip.status})`)

    const { finalOdometer, fuelConsumed, fuelCost, revenue } = completeTripSchema.parse(req.body)
    const actualDistance = Math.max(0, finalOdometer - trip.vehicle.odometer)

    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'COMPLETED', completedAt: new Date(), actualDistance, fuelConsumed, revenue },
      }),
      prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE', odometer: finalOdometer } }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }),
      ...(fuelConsumed > 0
        ? [
            prisma.fuelLog.create({
              data: { vehicleId: trip.vehicleId, tripId: trip.id, liters: fuelConsumed, cost: fuelCost, date: new Date() },
            }),
          ]
        : []),
    ])
    res.json(updatedTrip)
  })
)

router.post(
  '/:id/cancel',
  authorize('FLEET_MANAGER', 'DRIVER'),
  asyncHandler(async (req, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } })
    if (!trip) throw new ApiError(404, 'Trip not found')
    await assertTripAccess(req, trip.driverId)
    if (trip.status !== 'DRAFT' && trip.status !== 'DISPATCHED') {
      throw new ApiError(400, `Cannot cancel a trip with status ${trip.status}`)
    }

    const ops: any[] = [prisma.trip.update({ where: { id: trip.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } })]
    if (trip.status === 'DISPATCHED') {
      ops.push(prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } }))
      ops.push(prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }))
    }
    const [updatedTrip] = await prisma.$transaction(ops)
    res.json(updatedTrip)
  })
)

export default router
