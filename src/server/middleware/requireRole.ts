import type { NextFunction, Request, Response } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Sesión inválida' });
    }

    const userRole = req.user?.role ?? 'USER';

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Requiere rol: ${roles.join(', ')}`,
      });
    }

    return next();
  };
}
