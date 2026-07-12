import { prisma } from './prisma'
import { ApiError } from '../middleware/errorHandler'

export async function findOwnDriver(userId: string) {
  return prisma.driver.findUnique({ where: { userId } })
}

export async function requireOwnDriver(userId: string) {
  const driver = await findOwnDriver(userId)
  if (!driver) throw new ApiError(403, 'No driver profile is linked to your account')
  return driver
}
