import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { authenticate, authorize } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)
router.use(authorize('FLEET_MANAGER', 'FINANCIAL_ANALYST'))

async function buildReport() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: { where: { status: 'COMPLETED' } },
      maintenance: true,
      fuelLogs: true,
      expenses: true,
    },
    orderBy: { registrationNumber: 'asc' },
  })

  return vehicles.map((v) => {
    const totalDistance = v.trips.reduce((sum, t) => sum + (t.actualDistance ?? 0), 0)
    const totalRevenue = v.trips.reduce((sum, t) => sum + (t.revenue ?? 0), 0)
    const totalFuelLiters = v.fuelLogs.reduce((sum, f) => sum + f.liters, 0)
    const totalFuelCost = v.fuelLogs.reduce((sum, f) => sum + f.cost, 0)
    const totalMaintenanceCost = v.maintenance.reduce((sum, m) => sum + m.cost, 0)
    const totalOtherExpenses = v.expenses.reduce((sum, e) => sum + e.amount, 0)
    const operationalCost = totalFuelCost + totalMaintenanceCost
    const fuelEfficiency = totalFuelLiters > 0 ? totalDistance / totalFuelLiters : 0
    const roi = v.acquisitionCost > 0 ? (totalRevenue - operationalCost) / v.acquisitionCost : 0

    return {
      vehicleId: v.id,
      registrationNumber: v.registrationNumber,
      name: v.name,
      type: v.type,
      status: v.status,
      completedTrips: v.trips.length,
      totalDistance: round(totalDistance),
      totalFuelLiters: round(totalFuelLiters),
      fuelEfficiency: round(fuelEfficiency),
      totalFuelCost: round(totalFuelCost),
      totalMaintenanceCost: round(totalMaintenanceCost),
      totalOtherExpenses: round(totalOtherExpenses),
      operationalCost: round(operationalCost),
      totalRevenue: round(totalRevenue),
      roi: round(roi * 100),
    }
  })
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const report = await buildReport()
    res.json(report)
  })
)

router.get(
  '/export',
  asyncHandler(async (_req, res) => {
    const report = await buildReport()
    const headers = [
      'Registration Number',
      'Name',
      'Type',
      'Status',
      'Completed Trips',
      'Total Distance (km)',
      'Total Fuel (L)',
      'Fuel Efficiency (km/L)',
      'Fuel Cost',
      'Maintenance Cost',
      'Other Expenses',
      'Operational Cost',
      'Total Revenue',
      'ROI (%)',
    ]
    const rows = report.map((r) => [
      r.registrationNumber,
      r.name,
      r.type,
      r.status,
      r.completedTrips,
      r.totalDistance,
      r.totalFuelLiters,
      r.fuelEfficiency,
      r.totalFuelCost,
      r.totalMaintenanceCost,
      r.totalOtherExpenses,
      r.operationalCost,
      r.totalRevenue,
      r.roi,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-report.csv"')
    res.send(csv)
  })
)

export default router
