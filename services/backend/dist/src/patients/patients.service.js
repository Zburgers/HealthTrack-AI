"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_pg_service_1 = require("../database/drizzle-pg.service");
const schema_1 = require("../../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
let PatientsService = class PatientsService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async findAll(organizationId, page = 1, limit = 20, search) {
        const offset = (page - 1) * limit;
        let query = this.dbService.db
            .select()
            .from(schema_1.patients)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.patients.isDeleted, false)));
        if (search) {
            query = this.dbService.db
                .select()
                .from(schema_1.patients)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.patients.isDeleted, false), (0, drizzle_orm_1.ilike)(schema_1.patients.name, `%${search}%`)));
        }
        return query.limit(limit).offset(offset);
    }
    async findById(organizationId, id) {
        const result = await this.dbService.db
            .select()
            .from(schema_1.patients)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.id, id), (0, drizzle_orm_1.eq)(schema_1.patients.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.patients.isDeleted, false)))
            .limit(1);
        return result[0] || null;
    }
    async create(organizationId, data, createdBy) {
        const result = await this.dbService.db
            .insert(schema_1.patients)
            .values({
            ...data,
            organizationId,
            createdBy,
        })
            .returning();
        return result[0];
    }
    async update(organizationId, id, data) {
        const result = await this.dbService.db
            .update(schema_1.patients)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.id, id), (0, drizzle_orm_1.eq)(schema_1.patients.organizationId, organizationId)))
            .returning();
        return result[0] || null;
    }
    async softDelete(organizationId, id, deletedBy, reason = 'User deleted') {
        const result = await this.dbService.db
            .update(schema_1.patients)
            .set({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy,
            deletedReason: reason,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.id, id), (0, drizzle_orm_1.eq)(schema_1.patients.organizationId, organizationId)))
            .returning();
        return result[0] || null;
    }
    async search(organizationId, query) {
        return this.dbService.db
            .select()
            .from(schema_1.patients)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.patients.isDeleted, false), (0, drizzle_orm_1.ilike)(schema_1.patients.name, `%${query}%`)))
            .limit(20);
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_pg_service_1.DrizzlePgService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map