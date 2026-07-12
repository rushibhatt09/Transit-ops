import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const FUEL_PRICE_PER_LITER = 96

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

function round(n: number, decimals = 0) {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

interface RouteDef {
  source: string
  destination: string
  distance: number
}

interface VehicleProfile {
  reg: string
  name: string
  type: string
  maxLoad: number
  acquisitionCost: number
  region: string
  startOdometer: number
  efficiency: number
  ratePerKm: number
  routes: RouteDef[]
  tripCount: number
  finalState: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'
}

const ROUTES: Record<string, RouteDef[]> = {
  West: [
    { source: 'Mumbai', destination: 'Pune', distance: 150 },
    { source: 'Mumbai', destination: 'Nashik', distance: 180 },
    { source: 'Mumbai', destination: 'Surat', distance: 280 },
    { source: 'Pune', destination: 'Nashik', distance: 210 },
    { source: 'Ahmedabad', destination: 'Vadodara', distance: 110 },
    { source: 'Surat', destination: 'Ahmedabad', distance: 260 },
  ],
  North: [
    { source: 'Delhi', destination: 'Jaipur', distance: 280 },
    { source: 'Delhi', destination: 'Agra', distance: 230 },
    { source: 'Jaipur', destination: 'Udaipur', distance: 390 },
    { source: 'Lucknow', destination: 'Kanpur', distance: 90 },
    { source: 'Delhi', destination: 'Chandigarh', distance: 250 },
  ],
  South: [
    { source: 'Bangalore', destination: 'Chennai', distance: 350 },
    { source: 'Bangalore', destination: 'Hyderabad', distance: 570 },
    { source: 'Chennai', destination: 'Coimbatore', distance: 500 },
    { source: 'Hyderabad', destination: 'Vijayawada', distance: 275 },
    { source: 'Bangalore', destination: 'Mysore', distance: 145 },
  ],
  East: [
    { source: 'Kolkata', destination: 'Bhubaneswar', distance: 440 },
    { source: 'Kolkata', destination: 'Ranchi', distance: 410 },
    { source: 'Bhubaneswar', destination: 'Vizag', distance: 440 },
    { source: 'Patna', destination: 'Ranchi', distance: 330 },
  ],
}

const CARGO_FACTORS = [0.62, 0.78, 0.88, 0.7, 0.92, 0.66, 0.82, 0.74]
const DISTANCE_VARIANCE = [1.02, 0.98, 1.05, 1.0, 0.97, 1.03, 0.99, 1.01]

const VEHICLES: VehicleProfile[] = [
  { reg: 'MH-12-AB-1234', name: 'Tata Ace Van-05', type: 'Van', maxLoad: 500, acquisitionCost: 800000, region: 'West', startOdometer: 8200, efficiency: 11, ratePerKm: 16, routes: ROUTES.West, tripCount: 5, finalState: 'AVAILABLE' },
  { reg: 'MH-14-CD-5678', name: 'Ashok Leyland Truck-02', type: 'Truck', maxLoad: 5000, acquisitionCost: 2500000, region: 'West', startOdometer: 38500, efficiency: 4.2, ratePerKm: 34, routes: ROUTES.West, tripCount: 6, finalState: 'ON_TRIP' },
  { reg: 'DL-01-EF-9012', name: 'Mahindra Bolero Pickup-01', type: 'Pickup', maxLoad: 1000, acquisitionCost: 1200000, region: 'North', startOdometer: 24600, efficiency: 7.5, ratePerKm: 20, routes: ROUTES.North, tripCount: 4, finalState: 'IN_SHOP' },
  { reg: 'KA-05-GH-3456', name: 'Eicher Truck-07', type: 'Truck', maxLoad: 7000, acquisitionCost: 3200000, region: 'South', startOdometer: 61200, efficiency: 3.8, ratePerKm: 38, routes: ROUTES.South, tripCount: 7, finalState: 'AVAILABLE' },
  { reg: 'TN-09-IJ-7890', name: 'Force Traveller-03', type: 'Van', maxLoad: 800, acquisitionCost: 950000, region: 'South', startOdometer: 15400, efficiency: 9.5, ratePerKm: 17, routes: ROUTES.South, tripCount: 3, finalState: 'RETIRED' },
  { reg: 'GJ-01-KL-2345', name: 'Tata 407 Van-09', type: 'Van', maxLoad: 1500, acquisitionCost: 1400000, region: 'West', startOdometer: 9800, efficiency: 8.5, ratePerKm: 19, routes: ROUTES.West, tripCount: 4, finalState: 'AVAILABLE' },
  { reg: 'UP-32-MN-6712', name: 'Mahindra Bolero Pickup-04', type: 'Pickup', maxLoad: 1200, acquisitionCost: 1350000, region: 'North', startOdometer: 18300, efficiency: 7.2, ratePerKm: 21, routes: ROUTES.North, tripCount: 5, finalState: 'AVAILABLE' },
  { reg: 'RJ-14-OP-4523', name: 'Ashok Leyland Truck-11', type: 'Truck', maxLoad: 6000, acquisitionCost: 2900000, region: 'North', startOdometer: 27400, efficiency: 4.0, ratePerKm: 36, routes: ROUTES.North, tripCount: 5, finalState: 'ON_TRIP' },
  { reg: 'TS-07-QR-8890', name: 'Eicher Pro Truck-14', type: 'Truck', maxLoad: 4500, acquisitionCost: 2200000, region: 'South', startOdometer: 33900, efficiency: 4.5, ratePerKm: 32, routes: ROUTES.South, tripCount: 6, finalState: 'AVAILABLE' },
  { reg: 'MH-04-ST-1123', name: 'Tata Winger Van-12', type: 'Van', maxLoad: 700, acquisitionCost: 1050000, region: 'West', startOdometer: 6100, efficiency: 10, ratePerKm: 17, routes: ROUTES.West, tripCount: 3, finalState: 'AVAILABLE' },
  { reg: 'KA-01-UV-3345', name: 'Mahindra Supro Van-08', type: 'Van', maxLoad: 600, acquisitionCost: 780000, region: 'South', startOdometer: 4300, efficiency: 10.5, ratePerKm: 15, routes: ROUTES.South, tripCount: 3, finalState: 'AVAILABLE' },
  { reg: 'GJ-05-WX-7781', name: 'Bharat Benz Truck-19', type: 'Truck', maxLoad: 9000, acquisitionCost: 4100000, region: 'West', startOdometer: 45700, efficiency: 3.5, ratePerKm: 42, routes: ROUTES.West, tripCount: 4, finalState: 'IN_SHOP' },
  { reg: 'WB-06-YZ-2290', name: 'Ashok Leyland Dost Pickup-06', type: 'Pickup', maxLoad: 1500, acquisitionCost: 1500000, region: 'East', startOdometer: 12100, efficiency: 7.0, ratePerKm: 23, routes: ROUTES.East, tripCount: 4, finalState: 'AVAILABLE' },
  { reg: 'OD-02-AC-5567', name: 'Tata Intra Pickup-09', type: 'Pickup', maxLoad: 900, acquisitionCost: 980000, region: 'East', startOdometer: 7400, efficiency: 8.0, ratePerKm: 19, routes: ROUTES.East, tripCount: 3, finalState: 'AVAILABLE' },
]

const DRIVERS = [
  { name: 'Arjun Mehta', licenseNumber: 'MH0220220045671', licenseCategory: 'LMV', expiryDays: 540, contactNumber: '9820011223', safetyScore: 94, status: 'AVAILABLE', isLoginDriver: true },
  { name: 'Alex Fernandes', licenseNumber: 'MH1420230012345', licenseCategory: 'LMV', expiryDays: 360, contactNumber: '9876543210', safetyScore: 92, status: 'AVAILABLE' },
  { name: 'Suresh Kumar', licenseNumber: 'DL0520190067890', licenseCategory: 'HMV', expiryDays: 20, contactNumber: '9876500000', safetyScore: 88, status: 'ON_TRIP' },
  { name: 'Mohan Iyer', licenseNumber: 'KA0320200098765', licenseCategory: 'HMV', expiryDays: -70, contactNumber: '9123456780', safetyScore: 75, status: 'AVAILABLE' },
  { name: 'Vikram Singh', licenseNumber: 'TN0920180011223', licenseCategory: 'LMV', expiryDays: 700, contactNumber: '9988776655', safetyScore: 95, status: 'OFF_DUTY' },
  { name: 'Ramesh Yadav', licenseNumber: 'GJ0120210033445', licenseCategory: 'HMV', expiryDays: -800, contactNumber: '9090909090', safetyScore: 60, status: 'SUSPENDED' },
  { name: 'Sandeep Joshi', licenseNumber: 'MH0920210077654', licenseCategory: 'LMV', expiryDays: 500, contactNumber: '9812345670', safetyScore: 90, status: 'AVAILABLE' },
  { name: 'Manoj Tiwari', licenseNumber: 'UP3220190022110', licenseCategory: 'HMV', expiryDays: 300, contactNumber: '9765432180', safetyScore: 85, status: 'ON_TRIP' },
  { name: 'Farhan Sheikh', licenseNumber: 'RJ1420200055443', licenseCategory: 'HMV', expiryDays: 400, contactNumber: '9654321870', safetyScore: 82, status: 'AVAILABLE' },
  { name: 'Deepak Nair', licenseNumber: 'TS0720190066778', licenseCategory: 'HMV', expiryDays: 600, contactNumber: '9543218760', safetyScore: 96, status: 'AVAILABLE' },
]

async function main() {
  console.log('Clearing existing data...')
  await prisma.fuelLog.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.maintenanceLog.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.user.deleteMany()

  console.log('Creating users...')
  const passwordHash = await bcrypt.hash('password123', 10)
  await prisma.user.createMany({
    data: [
      { name: 'Priya Sharma', email: 'fleet.manager@transitops.com', passwordHash, role: 'FLEET_MANAGER' },
      { name: 'Arjun Mehta', email: 'driver@transitops.com', passwordHash, role: 'DRIVER' },
      { name: 'Kavita Rao', email: 'safety.officer@transitops.com', passwordHash, role: 'SAFETY_OFFICER' },
      { name: 'Rohan Gupta', email: 'finance.analyst@transitops.com', passwordHash, role: 'FINANCIAL_ANALYST' },
    ],
  })
  const driverUser = await prisma.user.findUniqueOrThrow({ where: { email: 'driver@transitops.com' } })

  console.log('Creating drivers...')
  const drivers = []
  for (const d of DRIVERS) {
    drivers.push(
      await prisma.driver.create({
        data: {
          name: d.name,
          licenseNumber: d.licenseNumber,
          licenseCategory: d.licenseCategory,
          licenseExpiry: daysFromNow(d.expiryDays),
          contactNumber: d.contactNumber,
          safetyScore: d.safetyScore,
          status: d.status,
          userId: (d as { isLoginDriver?: boolean }).isLoginDriver ? driverUser.id : null,
        },
      })
    )
  }
  const driverByName = Object.fromEntries(drivers.map((d) => [d.name, d]))

  console.log('Creating vehicles and trip history...')
  let vehicleIndex = 0
  for (const profile of VEHICLES) {
    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: profile.reg,
        name: profile.name,
        type: profile.type,
        maxLoadCapacity: profile.maxLoad,
        odometer: profile.startOdometer,
        acquisitionCost: profile.acquisitionCost,
        region: profile.region,
        status: 'AVAILABLE',
      },
    })

    let odometer = profile.startOdometer
    const spacingDays = Math.max(3, Math.floor(50 / profile.tripCount))
    let daysAgo = profile.tripCount * spacingDays + 5

    for (let i = 0; i < profile.tripCount; i++) {
      const route = profile.routes[i % profile.routes.length]
      const cargoFactor = CARGO_FACTORS[(vehicleIndex + i) % CARGO_FACTORS.length]
      const distanceFactor = DISTANCE_VARIANCE[(vehicleIndex + i) % DISTANCE_VARIANCE.length]
      const cargoWeight = round(profile.maxLoad * cargoFactor)
      const actualDistance = round(route.distance * distanceFactor)
      const fuelConsumed = round(actualDistance / profile.efficiency, 1)
      const fuelCost = round(fuelConsumed * FUEL_PRICE_PER_LITER)
      const revenue = round(actualDistance * profile.ratePerKm * (0.7 + 0.3 * cargoFactor))

      const driver = drivers[(vehicleIndex + i) % drivers.length]
      const dispatchedAt = daysFromNow(-daysAgo)
      const completedAt = daysFromNow(-(daysAgo - 1))
      odometer += actualDistance

      const trip = await prisma.trip.create({
        data: {
          source: route.source,
          destination: route.destination,
          vehicleId: vehicle.id,
          driverId: driver.id,
          cargoWeight,
          plannedDistance: route.distance,
          actualDistance,
          fuelConsumed,
          revenue,
          status: 'COMPLETED',
          createdAt: daysFromNow(-daysAgo - 1),
          dispatchedAt,
          completedAt,
        },
      })

      await prisma.fuelLog.create({
        data: { vehicleId: vehicle.id, tripId: trip.id, liters: fuelConsumed, cost: fuelCost, date: completedAt },
      })

      if (route.distance >= 200 && i % 2 === 0) {
        await prisma.expense.create({
          data: { vehicleId: vehicle.id, type: 'TOLL', amount: round(route.distance * 0.9), description: `${route.source} - ${route.destination} highway toll`, date: completedAt },
        })
      }

      daysAgo -= spacingDays
    }

    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { odometer } })

    vehicleIndex++
  }

  console.log('Creating active dispatched trips...')
  const truck02 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'MH-14-CD-5678' } })
  await prisma.trip.create({
    data: {
      source: 'Mumbai',
      destination: 'Pune',
      vehicleId: truck02.id,
      driverId: driverByName['Suresh Kumar'].id,
      cargoWeight: 4500,
      plannedDistance: 150,
      status: 'DISPATCHED',
      createdAt: daysFromNow(-1),
      dispatchedAt: daysFromNow(-1),
    },
  })
  await prisma.vehicle.update({ where: { id: truck02.id }, data: { status: 'ON_TRIP' } })
  await prisma.driver.update({ where: { id: driverByName['Suresh Kumar'].id }, data: { status: 'ON_TRIP' } })

  const truck11 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'RJ-14-OP-4523' } })
  await prisma.trip.create({
    data: {
      source: 'Delhi',
      destination: 'Jaipur',
      vehicleId: truck11.id,
      driverId: driverByName['Manoj Tiwari'].id,
      cargoWeight: 5200,
      plannedDistance: 280,
      status: 'DISPATCHED',
      createdAt: daysFromNow(-1),
      dispatchedAt: daysFromNow(0),
    },
  })
  await prisma.vehicle.update({ where: { id: truck11.id }, data: { status: 'ON_TRIP' } })
  await prisma.driver.update({ where: { id: driverByName['Manoj Tiwari'].id }, data: { status: 'ON_TRIP' } })

  console.log('Creating a draft trip awaiting dispatch...')
  const van09 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'GJ-01-KL-2345' } })
  await prisma.trip.create({
    data: {
      source: 'Ahmedabad',
      destination: 'Surat',
      vehicleId: van09.id,
      driverId: driverByName['Sandeep Joshi'].id,
      cargoWeight: 1200,
      plannedDistance: 260,
      status: 'DRAFT',
      createdAt: daysFromNow(0),
    },
  })

  console.log('Creating a cancelled trip...')
  const van12 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'MH-04-ST-1123' } })
  await prisma.trip.create({
    data: {
      source: 'Mumbai',
      destination: 'Nashik',
      vehicleId: van12.id,
      driverId: driverByName['Deepak Nair'].id,
      cargoWeight: 350,
      plannedDistance: 180,
      status: 'CANCELLED',
      createdAt: daysFromNow(-16),
      dispatchedAt: daysFromNow(-16),
      cancelledAt: daysFromNow(-15),
    },
  })

  console.log('Creating maintenance records...')
  const pickup01 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'DL-01-EF-9012' } })
  await prisma.maintenanceLog.create({
    data: { vehicleId: pickup01.id, description: 'Brake pad replacement and suspension check', cost: 8500, status: 'OPEN', date: daysFromNow(-2) },
  })
  await prisma.vehicle.update({ where: { id: pickup01.id }, data: { status: 'IN_SHOP' } })

  const truck19 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'GJ-05-WX-7781' } })
  await prisma.maintenanceLog.create({
    data: { vehicleId: truck19.id, description: 'Clutch plate replacement', cost: 22000, status: 'OPEN', date: daysFromNow(-1) },
  })
  await prisma.vehicle.update({ where: { id: truck19.id }, data: { status: 'IN_SHOP' } })

  const van05 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'MH-12-AB-1234' } })
  await prisma.maintenanceLog.create({
    data: { vehicleId: van05.id, description: 'Oil change and filter replacement', cost: 2200, status: 'CLOSED', date: daysFromNow(-38), closedAt: daysFromNow(-37) },
  })

  const truck07 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'KA-05-GH-3456' } })
  await prisma.maintenanceLog.create({
    data: { vehicleId: truck07.id, description: 'Tyre replacement (all four)', cost: 34000, status: 'CLOSED', date: daysFromNow(-25), closedAt: daysFromNow(-23) },
  })

  const truck14 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'TS-07-QR-8890' } })
  await prisma.maintenanceLog.create({
    data: { vehicleId: truck14.id, description: 'Engine service and coolant flush', cost: 12500, status: 'CLOSED', date: daysFromNow(-19), closedAt: daysFromNow(-18) },
  })

  const pickup04 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'UP-32-MN-6712' } })
  await prisma.maintenanceLog.create({
    data: { vehicleId: pickup04.id, description: 'Battery replacement', cost: 6800, status: 'CLOSED', date: daysFromNow(-9), closedAt: daysFromNow(-9) },
  })

  console.log('Retiring an aged vehicle...')
  const traveller03 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'TN-09-IJ-7890' } })
  await prisma.vehicle.update({ where: { id: traveller03.id }, data: { status: 'RETIRED' } })

  console.log('Adding a few miscellaneous expenses...')
  const dost06 = await prisma.vehicle.findUniqueOrThrow({ where: { registrationNumber: 'WB-06-YZ-2290' } })
  await prisma.expense.create({ data: { vehicleId: dost06.id, type: 'OTHER', amount: 1200, description: 'Parking and loading fees', date: daysFromNow(-6) } })
  await prisma.expense.create({ data: { vehicleId: truck07.id, type: 'OTHER', amount: 1800, description: 'Interstate permit renewal', date: daysFromNow(-30) } })
  await prisma.expense.create({ data: { vehicleId: van05.id, type: 'MAINTENANCE', amount: 650, description: 'Roadside puncture repair', date: daysFromNow(-11) } })
  await prisma.expense.create({ data: { vehicleId: pickup04.id, type: 'OTHER', amount: 900, description: 'Weighbridge and octroi charges', date: daysFromNow(-14) } })
  await prisma.expense.create({ data: { vehicleId: truck14.id, type: 'MAINTENANCE', amount: 1100, description: 'Emergency AC repair on route', date: daysFromNow(-5) } })

  console.log('Seed complete.')
  console.log('')
  console.log('Demo logins (password: password123):')
  console.log('  Fleet Manager     -> fleet.manager@transitops.com')
  console.log('  Driver            -> driver@transitops.com')
  console.log('  Safety Officer    -> safety.officer@transitops.com')
  console.log('  Financial Analyst -> finance.analyst@transitops.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
