import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export type PsychologistContext = {
  userId: string;
  profileId: string;
  psychologistProfileId: string;
};

/**
 * Requires an active PSYCHOLOGIST account with an approved professional profile.
 * Mounted after `requireAuth` + `requireRole('PSYCHOLOGIST')`.
 *
 * The resolved identifiers are attached to the request so that route handlers
 * never re-query them. Unapproved psychologists get 403 with a stable code so the
 * frontend can show the "pending approval" screen instead of a generic error.
 */
export function requireApprovedPsychologist() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'No hay sesión activa' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          status: true,
          profile: {
            select: {
              id: true,
              psychologistProfile: {
                select: { id: true, isApproved: true },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Sesión inválida o expirada' });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Tu cuenta está suspendida. Contacta al administrador.',
        });
      }

      const profile = user.profile;
      const psychologistProfile = profile?.psychologistProfile;

      if (!profile || !psychologistProfile) {
        return res.status(403).json({
          success: false,
          code: 'PSY_PROFILE_MISSING',
          message: 'No tienes un perfil profesional configurado',
        });
      }

      if (!psychologistProfile.isApproved) {
        return res.status(403).json({
          success: false,
          code: 'PSY_NOT_APPROVED',
          message: 'Tu perfil profesional está pendiente de aprobación',
        });
      }

      res.locals.psychologist = {
        userId,
        profileId: profile.id,
        psychologistProfileId: psychologistProfile.id,
      } satisfies PsychologistContext;

      return next();
    } catch {
      return res.status(500).json({ success: false, message: 'Error verificando el perfil profesional' });
    }
  };
}

export function getPsychologistContext(res: Response): PsychologistContext {
  return res.locals.psychologist as PsychologistContext;
}
