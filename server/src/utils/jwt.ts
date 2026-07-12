import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'transitops-super-secret-change-me'

export interface TokenPayload {
  id: string
  email: string
  role: string
  name: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}
