import type { Request, Response, NextFunction } from 'express'
import { prisma } from './prisma'

// Gate a route behind a valid session. Loads the user onto req.user.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId
  if (!userId) return res.status(401).json({ error: 'unauthorized' })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    req.session.destroy(() => {})
    return res.status(401).json({ error: 'unauthorized' })
  }

  req.user = user
  next()
}
