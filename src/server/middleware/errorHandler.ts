import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      issues: error.issues
    });
  }

  if (error instanceof Error && error.message.includes('Prisma')) {
    console.error('[Prisma Error]', error.message);
  } else {
    console.error('[Unhandled Error]', error instanceof Error ? error.message : String(error));
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
}
