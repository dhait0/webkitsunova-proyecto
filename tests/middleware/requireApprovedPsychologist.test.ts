import { prisma } from '../src/server/lib/prisma';

vi.mock('../../src/server/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const mockFindUnique = vi.mocked(prisma.user.findUnique);

function approvedUser() {
  return {
    status: 'ACTIVE',
    profile: {
      id: 'profile-1',
      psychologistProfile: { id: 'psy-1', isApproved: true },
    },
  } as any;
}

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    locals: {} as Record<string, unknown>,
  } as any;
}

describe('requireApprovedPsychologist middleware', () => {
  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when there is no authenticated user', async () => {
    const { requireApprovedPsychologist } = await import(
      '../../src/middleware/requireApprovedPsychologist'
    );

    const res = makeRes();
    await requireApprovedPsychologist()({ user: undefined } as any, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when the user no longer exists', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const { requireApprovedPsychologist } = await import(
      '../../src/middleware/requireApprovedPsychologist'
    );

    const res = makeRes();
    await requireApprovedPsychologist()({ user: { id: 'u1' } } as any, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 with ACCOUNT_SUSPENDED for a suspended psychologist', async () => {
    mockFindUnique.mockResolvedValueOnce({ ...approvedUser(), status: 'SUSPENDED' });

    const { requireApprovedPsychologist } = await import(
      '../../src/middleware/requireApprovedPsychologist'
    );

    const res = makeRes();
    await requireApprovedPsychologist()({ user: { id: 'u1' } } as any, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ACCOUNT_SUSPENDED' }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 with PSY_PROFILE_MISSING when there is no professional profile', async () => {
    mockFindUnique.mockResolvedValueOnce({ status: 'ACTIVE', profile: null });

    const { requireApprovedPsychologist } = await import(
      '../../src/middleware/requireApprovedPsychologist'
    );

    const res = makeRes();
    await requireApprovedPsychologist()({ user: { id: 'u1' } } as any, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PSY_PROFILE_MISSING' }),
    );
  });

  it('returns 403 with PSY_NOT_APPROVED when the profile is still pending', async () => {
    mockFindUnique.mockResolvedValueOnce({
      status: 'ACTIVE',
      profile: { id: 'profile-1', psychologistProfile: { id: 'psy-1', isApproved: false } },
    });

    const { requireApprovedPsychologist } = await import(
      '../../src/middleware/requireApprovedPsychologist'
    );

    const res = makeRes();
    await requireApprovedPsychologist()({ user: { id: 'u1' } } as any, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PSY_NOT_APPROVED' }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('exposes the psychologist context and calls next when approved', async () => {
    mockFindUnique.mockResolvedValueOnce(approvedUser());

    const { requireApprovedPsychologist } = await import(
      '../../src/middleware/requireApprovedPsychologist'
    );

    const res = makeRes();
    await requireApprovedPsychologist()({ user: { id: 'u1' } } as any, res, mockNext);

    expect(res.locals.psychologist).toEqual({
      userId: 'u1',
      profileId: 'profile-1',
      psychologistProfileId: 'psy-1',
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 500 when the lookup throws', async () => {
    mockFindUnique.mockRejectedValueOnce(new Error('db down'));

    const { requireApprovedPsychologist } = await import(
      '../../src/middleware/requireApprovedPsychologist'
    );

    const res = makeRes();
    await requireApprovedPsychologist()({ user: { id: 'u1' } } as any, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
