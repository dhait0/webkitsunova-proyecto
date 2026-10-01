import request from 'supertest';
import app from '../src/server/app';

describe('Health routes', () => {
  it('GET /api responds with API info', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'WebKitsunova API',
    });
  });

  it('GET /api/health responds with running status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'WebKitsunova backend is running',
    });
  });
});
