import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzlePgService } from '../database/drizzle-pg.service';
import { patients } from '../../drizzle/schema';

@Injectable()
export class ExportService {
  constructor(private readonly drizzle: DrizzlePgService) {}

  async exportAllPatients(orgId: string) {
    const patientsData = await this.drizzle.db
      .select()
      .from(patients)
      .where(eq(patients.organizationId, orgId));

    return {
      exportDate: new Date().toISOString(),
      totalRecords: patientsData.length,
      data: patientsData,
    };
  }
}
