"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caseEmbeddingsRelations = exports.mimicCasesRelations = exports.caseEmbeddings = exports.mimicCases = exports.patientsRelations = exports.usersRelations = exports.patients = exports.users = exports.enableVectorExtension = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.enableVectorExtension = (0, drizzle_orm_1.sql) `CREATE EXTENSION IF NOT EXISTS vector`;
const vector = (0, pg_core_1.customType)({
    dataType: (config) => `vector(${config?.dimensions ?? 768})`,
    toDriver: (value) => {
        return `[${value?.join(',') ?? ''}]`;
    },
    fromDriver: (value) => {
        if (typeof value === 'string') {
            return value.slice(1, -1).split(',').map(Number);
        }
        return value;
    },
});
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
exports.mimicCases = (0, pg_core_1.pgTable)('mimic_cases', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    subjectId: (0, pg_core_1.integer)('subject_id').notNull(),
    hadmId: (0, pg_core_1.integer)('hadm_id').notNull(),
    age: (0, pg_core_1.integer)('age').notNull(),
    sex: (0, pg_core_1.varchar)('sex', { length: 10 }),
    icd: (0, pg_core_1.jsonb)('icd').$type().notNull().default([]),
    icdLabel: (0, pg_core_1.jsonb)('icd_label').$type().notNull().default([]),
    note: (0, pg_core_1.text)('note').notNull(),
    vitals: (0, pg_core_1.jsonb)('vitals').$type(),
    outcomes: (0, pg_core_1.jsonb)('outcomes').$type(),
    treatments: (0, pg_core_1.jsonb)('treatments').$type(),
    diagnostics: (0, pg_core_1.jsonb)('diagnostics').$type(),
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    subjectIdIdx: (0, pg_core_1.index)('mimic_cases_subject_id_idx').on(table.subjectId),
    hadmIdIdx: (0, pg_core_1.index)('mimic_cases_hadm_id_idx').on(table.hadmId),
    subjectHadmUniqueIdx: (0, pg_core_1.uniqueIndex)('mimic_cases_subject_hadm_unique_idx').on(table.subjectId, table.hadmId),
    ageIdx: (0, pg_core_1.index)('mimic_cases_age_idx').on(table.age),
    sexIdx: (0, pg_core_1.index)('mimic_cases_sex_idx').on(table.sex),
}));
exports.caseEmbeddings = (0, pg_core_1.pgTable)('case_embeddings', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    caseId: (0, pg_core_1.uuid)('case_id').notNull().references(() => exports.mimicCases.id),
    embedding: vector('embedding', { dimensions: 768 }).notNull(),
    model: (0, pg_core_1.varchar)('model', { length: 50 }).notNull().default('biobert-v1.1'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    caseIdIdx: (0, pg_core_1.index)('case_embeddings_case_id_idx').on(table.caseId),
    modelIdx: (0, pg_core_1.index)('case_embeddings_model_idx').on(table.model),
}));
exports.mimicCasesRelations = (0, drizzle_orm_1.relations)(exports.mimicCases, ({ one, many }) => ({
    embeddings: many(exports.caseEmbeddings),
}));
exports.caseEmbeddingsRelations = (0, drizzle_orm_1.relations)(exports.caseEmbeddings, ({ one }) => ({
    case: one(exports.mimicCases, { fields: [exports.caseEmbeddings.caseId], references: [exports.mimicCases.id] }),
}));
//# sourceMappingURL=schema.js.map