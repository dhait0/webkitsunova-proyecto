import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'WebKitsunova backend is running'
  });
});

export default healthRouter;

