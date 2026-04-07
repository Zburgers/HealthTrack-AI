import { Injectable } from '@nestjs/common';
import { DrizzlePgService } from '../database/drizzle-pg.service';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DrizzlePgService) {}

  async findByEmail(email: string) {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] || null;
  }

  async findByFirebaseUid(firebaseUid: string) {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);
    return result[0] || null;
  }

  async findById(id: string) {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] || null;
  }
}
