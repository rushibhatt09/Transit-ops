import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { signToken } from '../utils/jwt'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) throw new ApiError(401, 'Invalid email or password')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new ApiError(401, 'Invalid email or password')

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name })
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  })
)

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) throw new ApiError(404, 'User not found')
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  })
)

export default router
