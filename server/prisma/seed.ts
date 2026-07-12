import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

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

  console.log('Creating vehicles...')
  const van05 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-12-AB-1234',
      name: 'Tata Ace Van-05',
      type: 'Van',
      maxLoadCapacity: 500,
      odometer: 15000,
      acquisitionCost: 800000,
      region: 'West',
      status: 'AVAILABLE',
    },
  })
  const truck02 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-14-CD-5678',
      name: 'Ashok Leyland Truck-02',
      type: 'Truck',
      maxLoadCapacity: 5000,
      odometer: 42000,
      acquisitionCost: 2500000,
      region: 'West',
      status: 'ON_TRIP',
    },
  })
  const pickup01 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'DL-01-EF-9012',
      name: 'Mahindra Bolero Pickup-01',
      type: 'Pickup',
      maxLoadCapacity: 1000,
      odometer: 28000,
      acquisitionCost: 1200000,
      region: 'North',
      status: 'IN_SHOP',
    },
  })
  const truck07 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'KA-05-GH-3456',
      name: 'Eicher Truck-07',
      type: 'Truck',
      maxLoadCapacity: 7000,
      odometer: 65000,
      acquisitionCost: 3200000,
      region: 'South',
      status: 'AVAILABLE',
    },
  })
  await prisma.vehicle.create({
    data: {
      registrationNumber: 'TN-09-IJ-7890',
      name: 'Force Traveller-03',
      type: 'Van',
      maxLoadCapacity: 800,
      odometer: 12000,
      acquisitionCost: 950000,
      region: 'South',
      status: 'RETIRED',
    },
  })
  const van09 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'GJ-01-KL-2345',
      name: 'Tata 407 Van-09',
      type: 'Van',
      maxLoadCapacity: 1500,
      odometer: 5000,
      acquisitionCost: 1400000,
      region: 'West',
      status: 'AVAILABLE',
    },
  })

  console.log('Creating drivers...')
  const alex = await prisma.driver.create({
    data: {
      name: 'Alex Fernandes',
      licenseNumber: 'MH1420230012345',
      licenseCategory: 'LMV',
      licenseExpiry: daysFromNow(360),
      contactNumber: '9876543210',
      safetyScore: 92,
      status: 'AVAILABLE',
    },
  })
  const suresh = await prisma.driver.create({
    data: {
      name: 'Suresh Kumar',
      licenseNumber: 'DL0520190067890',
      licenseCategory: 'HMV',
      licenseExpiry: daysFromNow(20),
      contactNumber: '9876500000',
      safetyScore: 88,
      status: 'ON_TRIP',
    },
  })
  await prisma.driver.create({
    data: {
      name: 'Meena Iyer',
      licenseNumber: 'KA0320200098765',
      licenseCategory: 'HMV',
      licenseExpiry: daysFromNow(-70),
      contactNumber: '9123456780',
      safetyScore: 75,
      status: 'AVAILABLE',
    },
  })
  await prisma.driver.create({
    data: {
      name: 'Vikram Singh',
      licenseNumber: 'TN0920180011223',
      licenseCategory: 'LMV',
      licenseExpiry: daysFromNow(700),
      contactNumber: '9988776655',
      safetyScore: 95,
      status: 'OFF_DUTY',
    },
  })
  await prisma.driver.create({
    data: {
      name: 'Ramesh Yadav',
      licenseNumber: 'GJ0120210033445',
      licenseCategory: 'HMV',
      licenseExpiry: daysFromNow(-800),
      contactNumber: '9090909090',
      safetyScore: 60,
      status: 'SUSPENDED',
    },
  })

  console.log('Creating trips...')
  await prisma.trip.create({
    data: {
      source: 'Mumbai',
      destination: 'Pune',
      vehicleId: truck02.id,
      driverId: suresh.id,
      cargoWeight: 4500,
      plannedDistance: 150,
      status: 'DISPATCHED',
      dispatchedAt: daysFromNow(-1),
    },
  })

  const completedTrip = await prisma.trip.create({
    data: {
      source: 'Mumbai',
      destination: 'Nashik',
      vehicleId: van05.id,
      driverId: alex.id,
      cargoWeight: 400,
      plannedDistance: 180,
      actualDistance: 185,
      fuelConsumed: 20,
      revenue: 8000,
      status: 'COMPLETED',
      dispatchedAt: daysFromNow(-5),
      completedAt: daysFromNow(-4),
    },
  })

  await prisma.trip.create({
    data: {
      source: 'Ahmedabad',
      destination: 'Surat',
      vehicleId: van09.id,
      driverId: alex.id,
      cargoWeight: 1200,
      plannedDistance: 260,
      status: 'DRAFT',
    },
  })

  await prisma.trip.create({
    data: {
      source: 'Thane',
      destination: 'Nashik',
      vehicleId: van05.id,
      driverId: alex.id,
      cargoWeight: 300,
      plannedDistance: 170,
      status: 'CANCELLED',
      dispatchedAt: daysFromNow(-10),
      cancelledAt: daysFromNow(-9),
    },
  })

  console.log('Creating maintenance logs...')
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: pickup01.id,
      description: 'Brake pad replacement',
      cost: 8500,
      status: 'OPEN',
      date: daysFromNow(-2),
    },
  })
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: van05.id,
      description: 'Oil change & filter replacement',
      cost: 2200,
      status: 'CLOSED',
      date: daysFromNow(-15),
      closedAt: daysFromNow(-14),
    },
  })

  console.log('Creating fuel logs...')
  await prisma.fuelLog.create({
    data: { vehicleId: van05.id, tripId: completedTrip.id, liters: 20, cost: 2100, date: daysFromNow(-4) },
  })
  await prisma.fuelLog.create({
    data: { vehicleId: van05.id, liters: 15, cost: 1600, date: daysFromNow(-12) },
  })
  await prisma.fuelLog.create({
    data: { vehicleId: truck02.id, liters: 60, cost: 6800, date: daysFromNow(-6) },
  })
  await prisma.fuelLog.create({
    data: { vehicleId: truck07.id, liters: 80, cost: 9000, date: daysFromNow(-8) },
  })

  console.log('Creating expenses...')
  await prisma.expense.create({
    data: { vehicleId: truck02.id, type: 'TOLL', amount: 450, description: 'Mumbai-Pune expressway toll', date: daysFromNow(-1) },
  })
  await prisma.expense.create({
    data: { vehicleId: truck07.id, type: 'OTHER', amount: 1200, description: 'Parking fees', date: daysFromNow(-3) },
  })
  await prisma.expense.create({
    data: { vehicleId: van05.id, type: 'MAINTENANCE', amount: 500, description: 'Roadside tire repair', date: daysFromNow(-6) },
  })

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
