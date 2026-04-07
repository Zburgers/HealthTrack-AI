import { pgTable, uuid, varchar, date, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for user roles
export const roleEnum = pgTable('_role_enum', {
  // This is a workaround; in production use PostgreSQL enum type
  id: uuid('id').defaultRandom().primaryKey(),
  role: varchar('role', { length: 50 }).notNull().unique(), // org_admin, doctor, nurse
});

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  firebaseUid: varchar('firebase_uid', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('doctor'),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailUniqueIdx: uniqueIndex('users_email_unique_idx').on(table.email),
  firebaseUidUniqueIdx: uniqueIndex('users_firebase_uid_unique_idx').on(table.firebaseUid),
  orgRoleIdx: index('users_org_role_idx').on(table.organizationId, table.role),
}));

export const patients = pgTable('patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
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
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  patients: many(patients),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, { fields: [users.organizationId], references: [organizations.id] }),
}));

export const patientsRelations = relations(patients, ({ one }) => ({
  organization: one(organizations, { fields: [patients.organizationId], references: [organizations.id] }),
  creator: one(users, { fields: [patients.createdBy], references: [users.id] }),
}));
