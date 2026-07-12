import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { authenticate, authorize } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)

const WARNING_WINDOW_DAYS = 30

router.get(
  '/license-expiry',
  authorize('FLEET_MANAGER', 'SAFETY_OFFICER'),
  asyncHandler(async (_req, res) => {
    const now = Date.now()
    const windowEnd = now + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000
    const drivers = await prisma.driver.findMany({
      where: { licenseExpiry: { lte: new Date(windowEnd) } },
      orderBy: { licenseExpiry: 'asc' },
    })

    const alerts = drivers.map((d) => {
      const daysRemaining = Math.ceil((new Date(d.licenseExpiry).getTime() - now) / (24 * 60 * 60 * 1000))
      return {
        driverId: d.id,
        name: d.name,
        licenseNumber: d.licenseNumber,
        licenseExpiry: d.licenseExpiry,
        daysRemaining,
        expired: daysRemaining < 0,
      }
    })

    res.json(alerts)
  })
)

router.post(
  '/license-expiry/send',
  authorize('FLEET_MANAGER', 'SAFETY_OFFICER'),
  asyncHandler(async (req, res) => {
    const now = Date.now()
    const windowEnd = now + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000
    const drivers = await prisma.driver.findMany({
      where: { licenseExpiry: { lte: new Date(windowEnd) } },
    })

    // TODO: hook up a real SMTP relay - for now this just logs what would go out
    drivers.forEach((d) => {
      console.log(
        `[EMAIL REMINDER] To: safety-officer@transitops.local | Subject: License expiring for ${d.name} | ` +
          `License ${d.licenseNumber} expires on ${new Date(d.licenseExpiry).toDateString()}`
      )
    })

    res.json({ sent: drivers.length })
  })
)

export default router
