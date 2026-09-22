import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { getRole } from '../lib/role.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No hay sesión activa' });
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Sesión inválida o expirada' });
    }

    req.user = {
      id: user.id,
      email: user.email ?? '',
      role: getRole(user),
    };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Sesión inválida o expirada' });
  }
}
