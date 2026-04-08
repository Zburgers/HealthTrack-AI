"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientsRelations = exports.usersRelations = exports.patients = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull(),
    clerkUserId: (0, pg_core_1.varchar)('clerk_user_id', { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).notNull().default('doctor'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    emailUniqueIdx: (0, pg_core_1.uniqueIndex)('users_email_unique_idx').on(table.email),
    clerkUserIdUniqueIdx: (0, pg_core_1.uniqueIndex)('users_clerk_user_id_unique_idx').on(table.clerkUserId),
}));
exports.patients = (0, pg_core_1.pgTable)('patients', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.varchar)('organization_id', { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    dateOfBirth: (0, pg_core_1.date)('date_of_birth'),
    gender: (0, pg_core_1.varchar)('gender', { length: 50 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 50 }),
    notes: (0, pg_core_1.text)('notes'),
    isDeleted: (0, pg_core_1.boolean)('is_deleted').default(false).notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
    deletedReason: (0, pg_core_1.varchar)('deleted_reason', { length: 255 }),
    deletedBy: (0, pg_core_1.uuid)('deleted_by').references(() => exports.users.id),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    orgIdx: (0, pg_core_1.index)('patients_org_idx').on(table.organizationId),
    orgDeletedIdx: (0, pg_core_1.index)('patients_org_deleted_idx').on(table.organizationId, table.isDeleted),
}));
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    createdPatients: many(exports.patients, { relationName: 'creator' }),
    deletedPatients: many(exports.patients, { relationName: 'deleter' }),
}));
exports.patientsRelations = (0, drizzle_orm_1.relations)(exports.patients, ({ one }) => ({
    creator: one(exports.users, { fields: [exports.patients.createdBy], references: [exports.users.id], relationName: 'creator' }),
    deleter: one(exports.users, { fields: [exports.patients.deletedBy], references: [exports.users.id], relationName: 'deleter' }),
}));
//# sourceMappingURL=schema.js.map