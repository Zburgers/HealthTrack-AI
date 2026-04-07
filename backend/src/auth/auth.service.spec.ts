import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService, ClerkDecodedToken } from './auth.service';
import { users } from '../../drizzle/schema';

// Mock @clerk/backend - verifyToken is a standalone export
const mockVerifyToken = vi.fn();

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn((...args) => mockVerifyToken(...args)),
  createClerkClient: vi.fn(() => ({})),
}));

describe('AuthService', () => {
  let service: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDrizzlePg: any;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockSelectChain = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    };

    const mockInsertChain = {
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    };

    mockDrizzlePg = {
      db: {
        select: vi.fn().mockReturnValue(mockSelectChain),
        insert: vi.fn().mockReturnValue(mockInsertChain),
      },
      pool: { connect: vi.fn(), end: vi.fn() },
    };

    // Create service directly with mock dependency
    service = new AuthService(mockDrizzlePg);
  });

  describe('verifyClerkToken', () => {
    it('should verify a valid Clerk token and return decoded claims', async () => {
      const mockPayload = {
        sub: 'user_abc123',
        email: 'test@example.com',
        org_id: 'org_xyz789',
        org_role: 'admin',
        name: 'Test User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const result = await service.verifyClerkToken('valid-token');

      expect(result).toEqual({
        userId: 'user_abc123',
        email: 'test@example.com',
        orgId: 'org_xyz789',
        orgRole: 'admin',
        name: 'Test User',
      });
      expect(mockVerifyToken).toHaveBeenCalledWith('valid-token', { secretKey: expect.any(String) });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockVerifyToken.mockRejectedValue(new Error('Token verification failed'));

      await expect(service.verifyClerkToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should handle tokens without org_id (personal account)', async () => {
      const mockPayload = {
        sub: 'user_abc123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockVerifyToken.mockResolvedValue(mockPayload);

      const result = await service.verifyClerkToken('token-no-org');

      expect(result).toEqual({
        userId: 'user_abc123',
        email: 'test@example.com',
        orgId: undefined,
        orgRole: undefined,
        name: 'Test User',
      });
    });
  });

  describe('getUserByClerkId', () => {
    it('should return user when found by clerkUserId', async () => {
      const mockUser = { id: '1', email: 'test@example.com', clerkUserId: 'user_abc123', name: 'Test User' };
      mockDrizzlePg.db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([mockUser]),
          }),
        }),
      });

      const result = await service.getUserByClerkId('user_abc123');

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockDrizzlePg.db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const result = await service.getUserByClerkId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findOrCreateUser', () => {
    const mockToken: ClerkDecodedToken = {
      userId: 'user_new123',
      email: 'new@example.com',
      name: 'New User',
    };

    it('should return existing user when found', async () => {
      const mockUser = { id: '1', email: 'new@example.com', clerkUserId: 'user_new123', name: 'New User' };
      mockDrizzlePg.db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([mockUser]),
          }),
        }),
      });

      const result = await service.findOrCreateUser(mockToken, 'org_xyz789');

      expect(result).toEqual(mockUser);
      expect(mockDrizzlePg.db.insert).not.toHaveBeenCalled();
    });

    it('should create new user when not found', async () => {
      mockDrizzlePg.db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const newUser = { id: '2', email: 'new@example.com', clerkUserId: 'user_new123', name: 'New User' };
      mockDrizzlePg.db.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([newUser]),
        }),
      });

      const result = await service.findOrCreateUser(mockToken, 'org_xyz789');

      expect(result).toEqual(newUser);
      expect(mockDrizzlePg.db.insert).toHaveBeenCalledWith(users);
    });
  });
});
