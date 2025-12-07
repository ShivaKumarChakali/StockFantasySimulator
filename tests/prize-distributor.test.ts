import { describe, it, expect, vi, beforeEach } from 'vitest';
import { distributeContestPrizes, checkAndDistributePrizes } from '../server/prize-distributor';
import { storage } from '../server/storage';

// Mock storage
vi.mock('../server/storage', () => ({
  storage: {
    getAllContests: vi.fn(),
    getContest: vi.fn(),
    getContestLeaderboard: vi.fn(),
    getPortfolio: vi.fn(),
    updateUserContestFinalRoi: vi.fn(),
    updateUserBalance: vi.fn(),
    updateContestStatus: vi.fn(),
  },
}));

describe('Prize Distributor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should distribute prizes for ended contests', async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday

    const contests = [
      {
        id: 'contest-1',
        name: 'Ended Contest',
        entryFee: 10,
        status: 'live',
        startDate: pastDate,
        endDate: pastDate,
      },
    ];

    const leaderboard = [
      { id: 'uc1', userId: 'user1', portfolioId: 'p1', roi: 15.5 },
      { id: 'uc2', userId: 'user2', portfolioId: 'p2', roi: 10.2 },
      { id: 'uc3', userId: 'user3', portfolioId: 'p3', roi: 5.8 },
    ];

    const portfolios = {
      p1: { id: 'p1', roi: 15.5 },
      p2: { id: 'p2', roi: 10.2 },
      p3: { id: 'p3', roi: 5.8 },
    };

    vi.mocked(storage.getAllContests).mockResolvedValue(contests as any);
    vi.mocked(storage.getContest).mockResolvedValue(contests[0] as any);
    vi.mocked(storage.getContestLeaderboard).mockResolvedValue(leaderboard as any);
    vi.mocked(storage.getPortfolio).mockImplementation((id: string) => 
      Promise.resolve(portfolios[id as keyof typeof portfolios] as any)
    );
    vi.mocked(storage.updateUserContestFinalRoi).mockResolvedValue(undefined);
    vi.mocked(storage.updateUserBalance).mockResolvedValue(undefined);
    vi.mocked(storage.updateContestStatus).mockResolvedValue(undefined);

    await distributeContestPrizes();

    // Verify prizes distributed
    expect(storage.updateUserBalance).toHaveBeenCalledWith('user1', 15); // 50% of 30
    expect(storage.updateUserBalance).toHaveBeenCalledWith('user2', 9);  // 30% of 30
    expect(storage.updateUserBalance).toHaveBeenCalledWith('user3', 6);  // 20% of 30
    expect(storage.updateContestStatus).toHaveBeenCalledWith('contest-1', 'ended');
  });

  it('should not distribute prizes for active contests', async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

    const contests = [
      {
        id: 'contest-2',
        name: 'Active Contest',
        entryFee: 10,
        status: 'live',
        startDate: now,
        endDate: futureDate,
      },
    ];

    vi.mocked(storage.getAllContests).mockResolvedValue(contests as any);

    await distributeContestPrizes();

    expect(storage.getContestLeaderboard).not.toHaveBeenCalled();
    expect(storage.updateUserBalance).not.toHaveBeenCalled();
  });

  it('should handle contests with no participants', async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const contests = [
      {
        id: 'contest-3',
        name: 'Empty Contest',
        entryFee: 10,
        status: 'live',
        startDate: pastDate,
        endDate: pastDate,
      },
    ];

    vi.mocked(storage.getAllContests).mockResolvedValue(contests as any);
    vi.mocked(storage.getContest).mockResolvedValue(contests[0] as any);
    vi.mocked(storage.getContestLeaderboard).mockResolvedValue([]);

    await distributeContestPrizes();

    expect(storage.updateUserBalance).not.toHaveBeenCalled();
    expect(storage.updateContestStatus).toHaveBeenCalledWith('contest-3', 'ended');
  });

  it('should call distributeContestPrizes when checkAndDistributePrizes is called', async () => {
    vi.mocked(storage.getAllContests).mockResolvedValue([]);

    await checkAndDistributePrizes();

    expect(storage.getAllContests).toHaveBeenCalled();
  });
});
