import {
  pgTable,
  uuid,
  varchar,
  date,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
  customType,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Extension setup for pgvector
export const enableVectorExtension = sql`CREATE EXTENSION IF NOT EXISTS vector`;

// Custom pgvector type for embeddings (768-dimensional)
const vector = customType<{ data: number[]; driverData: string; config: { dimensions: number } }>({
  dataType: (config) => `vector(${config?.dimensions ?? 768})`,
  toDriver: (value): string => {
    return `[${value?.join(',') ?? ''}]`;
  },
  fromDriver: (value: string): number[] => {
    if (typeof value === 'string') {
      return value.slice(1, -1).split(',').map(Number);
    }
    return value;
  },
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('doctor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailUniqueIdx: uniqueIndex('users_email_unique_idx').on(table.email),
  clerkUserIdUniqueIdx: uniqueIndex('users_clerk_user_id_unique_idx').on(table.clerkUserId),
}));

export const patients = pgTable('patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 50 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  notes: text('notes'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
  deletedReason: varchar('deleted_reason', { length: 255 }),
  deletedBy: uuid('deleted_by').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('patients_org_idx').on(table.organizationId),
  orgDeletedIdx: index('patients_org_deleted_idx').on(table.organizationId, table.isDeleted),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdPatients: many(patients, { relationName: 'creator' }),
  deletedPatients: many(patients, { relationName: 'deleter' }),
}));

export const patientsRelations = relations(patients, ({ one }) => ({
  creator: one(users, { fields: [patients.createdBy], references: [users.id], relationName: 'creator' }),
  deleter: one(users, { fields: [patients.deletedBy], references: [users.id], relationName: 'deleter' }),
}));

// MIMIC-IV clinical cases table
export const mimicCases = pgTable('mimic_cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectId: integer('subject_id').notNull(),
  hadmId: integer('hadm_id').notNull(),
  age: integer('age').notNull(),
  sex: varchar('sex', { length: 10 }),
  icd: jsonb('icd').$type<string[]>().notNull().default([]),
  icdLabel: jsonb('icd_label').$type<string[]>().notNull().default([]),
  note: text('note').notNull(),
  vitals: jsonb('vitals').$type<{
    bp: string | null;
    hr: number | null;
    rr: number | null;
    spo2: number | null;
    temp: number | null;
  }>(),
  outcomes: jsonb('outcomes').$type<{
    result?: string;
    followUp?: string;
    dischargeStatus?: string;
    lengthOfStay?: number;
    complications?: string[];
  }>(),
  treatments: jsonb('treatments').$type<{
    medications?: string[];
    procedures?: string[];
    interventions?: string[];
    timeline?: Array<{ date: string; action: string }>;
  }>(),
  diagnostics: jsonb('diagnostics').$type<{
    tests?: string[];
    results?: string[];
    imaging?: string[];
    labs?: string[];
  }>(),
  metadata: jsonb('metadata').$type<{
    complexityScore?: number;
    outcomeClass?: string;
    admissionType?: string;
    caseDate?: Date;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  subjectIdIdx: index('mimic_cases_subject_id_idx').on(table.subjectId),
  hadmIdIdx: index('mimic_cases_hadm_id_idx').on(table.hadmId),
  subjectHadmUniqueIdx: uniqueIndex('mimic_cases_subject_hadm_unique_idx').on(table.subjectId, table.hadmId),
  ageIdx: index('mimic_cases_age_idx').on(table.age),
  sexIdx: index('mimic_cases_sex_idx').on(table.sex),
}));

// Case embeddings with pgvector (768-dimensional BioBERT embeddings)
export const caseEmbeddings = pgTable('case_embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  caseId: uuid('case_id').notNull().references(() => mimicCases.id),
  // pgvector column: 768-dimensional BioBERT embeddings
  embedding: vector('embedding', { dimensions: 768 }).notNull(),
  model: varchar('model', { length: 50 }).notNull().default('biobert-v1.1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  caseIdIdx: index('case_embeddings_case_id_idx').on(table.caseId),
  modelIdx: index('case_embeddings_model_idx').on(table.model),
}));

// Relations
export const mimicCasesRelations = relations(mimicCases, ({ one, many }) => ({
  embeddings: many(caseEmbeddings),
}));

export const caseEmbeddingsRelations = relations(caseEmbeddings, ({ one }) => ({
  case: one(mimicCases, { fields: [caseEmbeddings.caseId], references: [mimicCases.id] }),
}));
