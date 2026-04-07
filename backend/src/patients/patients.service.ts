import { Injectable } from '@nestjs/common';
import { DrizzlePgService } from '../database/drizzle-pg.service';
import { patients } from '../../drizzle/schema';
import { eq, and, ilike } from 'drizzle-orm';

export interface CreatePatientDto {
  name: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdatePatientDto {
  name?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

@Injectable()
export class PatientsService {
  constructor(private readonly dbService: DrizzlePgService) {}

  async findAll(organizationId: string, page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    
    let query = this.dbService.db
      .select()
      .from(patients)
      .where(and(
        eq(patients.organizationId, organizationId),
        eq(patients.isDeleted, false),
      ));

    if (search) {
      query = this.dbService.db
        .select()
        .from(patients)
        .where(and(
          eq(patients.organizationId, organizationId),
          eq(patients.isDeleted, false),
          ilike(patients.name, `%${search}%`),
        ));
    }

    return query.limit(limit).offset(offset);
  }

  async findById(organizationId: string, id: string) {
    const result = await this.dbService.db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, id),
        eq(patients.organizationId, organizationId),
        eq(patients.isDeleted, false),
      ))
      .limit(1);
    return result[0] || null;
  }

  async create(organizationId: string, data: CreatePatientDto, createdBy: string) {
    const result = await this.dbService.db
      .insert(patients)
      .values({
        ...data,
        organizationId,
        createdBy,
      })
      .returning();
    return result[0];
  }

  async update(organizationId: string, id: string, data: UpdatePatientDto) {
    const result = await this.dbService.db
      .update(patients)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(patients.id, id),
        eq(patients.organizationId, organizationId),
      ))
      .returning();
    return result[0] || null;
  }

  async softDelete(organizationId: string, id: string, deletedBy: string, reason = 'User deleted') {
    const result = await this.dbService.db
      .update(patients)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
        deletedReason: reason,
        updatedAt: new Date(),
      })
      .where(and(
        eq(patients.id, id),
        eq(patients.organizationId, organizationId),
      ))
      .returning();
    return result[0] || null;
  }

  async search(organizationId: string, query: string) {
    return this.dbService.db
      .select()
      .from(patients)
      .where(and(
        eq(patients.organizationId, organizationId),
        eq(patients.isDeleted, false),
        ilike(patients.name, `%${query}%`),
      ))
      .limit(20);
  }
}
