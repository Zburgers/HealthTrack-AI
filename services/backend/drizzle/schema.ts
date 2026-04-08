import { pgTable, uuid, varchar, date, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
