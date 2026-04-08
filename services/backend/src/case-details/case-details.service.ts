import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzlePgService } from '../database/drizzle-pg.service';
import { mimicCases } from '../../drizzle/schema';

@Injectable()
export class CaseDetailsService {
  constructor(private readonly drizzle: DrizzlePgService) {}

  async findOne(id: string) {
    const results = await this.drizzle.db
      .select()
      .from(mimicCases)
      .where(eq(mimicCases.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findBySubjectHadms(subjectId: number, hadmId: number) {
    const results = await this.drizzle.db
      .select()
      .from(mimicCases)
      .where(eq(mimicCases.subjectId, subjectId))
      .where(eq(mimicCases.hadmId, hadmId))
      .limit(1);

    return results[0] || null;
  }
}
