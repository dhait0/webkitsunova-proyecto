import type { Request, Response, NextFunction } from 'express';

describe('errorHandler middleware', () => {
  const mockNext = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 with issues array for ZodError', async () => {
    const { ZodError } = await import('zod');
    const { errorHandler } = await import('../../src/middleware/errorHandler');

    const error = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['email'],
        message: 'Expected string, received number',
      },
    ]);

    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    errorHandler(error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Datos inválidos',
      issues: expect.any(Array),
    });
    expect(res.json.mock.calls[0][0].issues).toHaveLength(1);
  });

  it('returns 500 for generic Error', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler');

    const error = new Error('Something went wrong');

    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    errorHandler(error, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error interno del servidor',
    });
  });

  it('returns 500 for non-Error values', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler');

    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    errorHandler('some string error', req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error interno del servidor',
    });
  });

  it('logs Prisma errors differently', async () => {
    const { errorHandler } = await import('../../src/middleware/errorHandler');

    const prismaError = new Error('Prisma: connection refused');

    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    errorHandler(prismaError, req, res, mockNext);

    expect(console.error).toHaveBeenCalledWith('[Prisma Error]', expect.any(String));
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
