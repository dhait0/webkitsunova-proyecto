import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { getRole } from '../lib/role';

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(req.user!.id);

      if (error || !user) {
        return res.status(401).json({ success: false, message: 'Sesión inválida' });
      }

      const userRole = getRole(user);

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Requiere rol: ${roles.join(', ')}`,
        });
      }

      req.user = {
        id: user.id,
        email: user.email ?? '',
        role: userRole,
      };

      return next();
    } catch {
      return res.status(401).json({ success: false, message: 'Sesión inválida' });
    }
  };
}
