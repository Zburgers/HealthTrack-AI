import { Injectable } from '@nestjs/common';
import { DrizzlePgService } from '../database/drizzle-pg.service';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface FirebaseDecodedToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

@Injectable()
export class AuthService {
  constructor(private readonly dbService: DrizzlePgService) {}

  async verifyFirebaseToken(token: string): Promise<FirebaseDecodedToken> {
    // TODO: Integrate firebase-admin to verify ID tokens
    // For now, decode JWT payload (development only)
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload as FirebaseDecodedToken;
    } catch {
      throw new Error('Invalid Firebase token');
    }
  }

  async getUserByFirebaseToken(token: string) {
    const decoded = await this.verifyFirebaseToken(token);
    
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decoded.uid))
      .limit(1);
    
    return result[0] || null;
  }

  async findOrCreateUser(decoded: FirebaseDecodedToken, organizationId: string) {
    const existing = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decoded.uid))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const newUser = await this.dbService.db
      .insert(users)
      .values({
        email: decoded.email || '',
        firebaseUid: decoded.uid,
        name: decoded.name || null,
        role: 'doctor',
        organizationId: organizationId,
      })
      .returning();

    return newUser[0];
  }
}
