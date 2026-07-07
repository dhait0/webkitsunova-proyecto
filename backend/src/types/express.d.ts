import type { SessionPayload } from '../lib/session';

declare global {
  namespace Express {
    interface Request {
      session?: SessionPayload;
    }
  }
}

export {};

