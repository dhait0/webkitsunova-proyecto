import app from './app.js';
import { env } from './config/env.js';

if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
  app.listen(env.PORT, () => {
    console.log(`WebKitsunova backend running on port ${env.PORT}`);
  });
}

export default app;
