import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

const mockAuthService = {
  verifyClerkToken: vi.fn().mockResolvedValue({
    userId: 'user_test_123',
    email: 'test@example.com',
    name: 'Test User',
  }),
  getUserByClerkId: vi.fn().mockResolvedValue({
    id: 'user-uuid',
    email: 'test@example.com',
    clerkUserId: 'user_test_123',
    name: 'Test User',
  }),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AuthController(mockAuthService as any);
  });

  describe('POST /auth/verify', () => {
    it('should verify a Clerk token and return user info', async () => {
      const req = { headers: { authorization: 'Bearer mock-clerk-token' } } as any;
      const result = await controller.verifyToken(req);
      expect(result).toHaveProperty('valid', true);
      expect(result).toHaveProperty('user');
      expect(mockAuthService.verifyClerkToken).toHaveBeenCalledWith('mock-clerk-token');
    });

    it('should reject when no token provided', async () => {
      const req = { headers: {} } as any;
      await expect(controller.verifyToken(req)).rejects.toThrow('No token provided');
    });
  });

  describe('GET /auth/me', () => {
    it('should return user info when authenticated', async () => {
      const req = { user: { userId: 'user_test_123' } } as any;
      const result = await controller.getCurrentUser(req);
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(mockAuthService.getUserByClerkId).toHaveBeenCalledWith('user_test_123');
    });
  });

  describe('GET /auth/session', () => {
    it('should return session info', async () => {
      const req = {
        user: {
          userId: 'user_test_123',
          orgId: 'org_test',
          orgRole: 'org:admin',
          email: 'test@example.com',
        },
      } as any;
      const result = await controller.getSession(req);
      expect(result).toHaveProperty('userId', 'user_test_123');
      expect(result).toHaveProperty('orgId', 'org_test');
    });
  });
});
