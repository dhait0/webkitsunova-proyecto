import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return new Promise<void>((resolve, reject) => {
    (app as unknown as (req: unknown, res: unknown, next?: unknown) => void)(req, res, (err?: unknown) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
