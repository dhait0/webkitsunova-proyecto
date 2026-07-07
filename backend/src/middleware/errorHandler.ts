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

  console.error(error);

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
}
