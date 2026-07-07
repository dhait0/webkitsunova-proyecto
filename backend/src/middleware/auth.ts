import type { NextFunction, Request, Response } from 'express';
import { sessionCookieName, verifySession } from '../lib/session';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.[sessionCookieName];
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;

  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No hay sesión activa' });
  }

  try {
    req.session = verifySession(token);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Sesión inválida o expirada' });
  }
}

