import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { requireOwnDriver } from '../utils/scope'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (req.user!.role === 'DRIVER') {
      const own = await requireOwnDriver(req.user!.id)
      const trips = await prisma.trip.findMany({
        where: { driverId: own.id },
        include: { vehicle: true },
        orderBy: { createdAt: 'desc' },
      })
      const completed = trips.filter((t) => t.status === 'COMPLETED')
      const activeTrip = trips.find((t) => t.status === 'DISPATCHED') ?? null
      const draftTrips = trips.filter((t) => t.status === 'DRAFT').length
      const totalDistance = completed.reduce((s, t) => s + (t.actualDistance ?? 0), 0)
      const totalFuel = completed.reduce((s, t) => s + (t.fuelConsumed ?? 0), 0)
      const licenseDaysRemaining = Math.ceil((new Date(own.licenseExpiry).getTime() - Date.now()) / (24 * 60 * 60 * 1000))

      return res.json({
        driver: {
          profile: {
            id: own.id,
            name: own.name,
            licenseNumber: own.licenseNumber,
            licenseCategory: own.licenseCategory,
            licenseExpiry: own.licenseExpiry,
            licenseDaysRemaining,
            safetyScore: own.safetyScore,
            status: own.status,
          },
          activeTrip,
          stats: {
            completedTrips: completed.length,
            draftTrips,
            totalDistance: Math.round(totalDistance),
            totalFuel: Math.round(totalFuel * 10) / 10,
          },
          recentTrips: trips.slice(0, 5),
        },
      })
    }

    const { type, region } = req.query as Record<string, string>
    const vehicleWhere: any = {}
    if (type) vehicleWhere.type = type
    if (region) vehicleWhere.region = region

    const vehicles = await prisma.vehicle.findMany({ where: vehicleWhere })
    const activeVehicles = vehicles.filter((v) => v.status !== 'RETIRED').length
    const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE').length
    const vehiclesInMaintenance = vehicles.filter((v) => v.status === 'IN_SHOP').length
    const vehiclesOnTrip = vehicles.filter((v) => v.status === 'ON_TRIP').length
    const fleetUtilization = activeVehicles > 0 ? Math.round((vehiclesOnTrip / activeVehicles) * 1000) / 10 : 0

    const vehicleIds = vehicles.map((v) => v.id)
    const tripWhere: any = vehicleIds.length ? { vehicleId: { in: vehicleIds } } : {}

    const [activeTrips, pendingTrips, driversOnDuty, totalDrivers, fleetByStatus] = await Promise.all([
      prisma.trip.count({ where: { ...tripWhere, status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { ...tripWhere, status: 'DRAFT' } }),
      prisma.driver.count({ where: { status: 'ON_TRIP' } }),
      prisma.driver.count(),
      Promise.resolve([
        { name: 'Available', value: vehicles.filter((v) => v.status === 'AVAILABLE').length },
        { name: 'On Trip', value: vehiclesOnTrip },
        { name: 'In Shop', value: vehiclesInMaintenance },
        { name: 'Retired', value: vehicles.filter((v) => v.status === 'RETIRED').length },
      ]),
    ])

    res.json({
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      totalDrivers,
      fleetUtilization,
      fleetByStatus,
    })
  })
)

export default router
