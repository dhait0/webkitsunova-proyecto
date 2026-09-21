import app from './app';
import { env } from './config/env';

if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
  app.listen(env.PORT, () => {
    console.log(`WebKitsunova backend running on port ${env.PORT}`);
  });
}

export default app;
