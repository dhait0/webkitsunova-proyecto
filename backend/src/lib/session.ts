import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env';

export const sessionCookieName = 'kitsunova_session';

export type SessionPayload = {
  sub: string;
  email: string;
  role: 'USER' | 'PSYCHOLOGIST' | 'ADMIN';
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifySession(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as SessionPayload;
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(sessionCookieName, { path: '/' });
}

