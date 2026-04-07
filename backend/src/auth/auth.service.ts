import { Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { DrizzlePgService } from '../database/drizzle-pg.service';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface ClerkDecodedToken {
  userId: string;
  email?: string;
  orgId?: string;
  orgRole?: string;
  name?: string;
  [key: string]: unknown;
}

@Injectable()
export class AuthService {
  constructor(private readonly dbService: DrizzlePgService) {}

  async verifyClerkToken(token: string): Promise<ClerkDecodedToken> {
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      return {
        userId: payload.sub,
        email: payload.email as string | undefined,
        orgId: payload.org_id,
        orgRole: payload.org_role,
        name: payload.name as string | undefined,
      };
    } catch {
      throw new UnauthorizedException('Invalid Clerk token');
    }
  }

  async getUserByClerkId(clerkUserId: string) {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    return result[0] || null;
  }

  async findOrCreateUser(decoded: ClerkDecodedToken, organizationId: string) {
    const existing = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, decoded.userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const newUser = await this.dbService.db
      .insert(users)
      .values({
        email: decoded.email || '',
        clerkUserId: decoded.userId,
        organizationId,
      })
      .returning();

    return newUser[0];
  }
}
