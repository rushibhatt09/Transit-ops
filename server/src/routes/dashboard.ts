import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
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
