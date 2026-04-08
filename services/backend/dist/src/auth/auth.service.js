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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const backend_1 = require("@clerk/backend");
const drizzle_pg_service_1 = require("../database/drizzle-pg.service");
const schema_1 = require("../../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
let AuthService = class AuthService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async verifyClerkToken(token) {
        try {
            const payload = await (0, backend_1.verifyToken)(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });
            return {
                userId: payload.sub,
                email: payload.email,
                orgId: payload.org_id,
                orgRole: payload.org_role,
                name: payload.name,
            };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid Clerk token');
        }
    }
    async getUserByClerkId(clerkUserId) {
        const result = await this.dbService.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.clerkUserId, clerkUserId))
            .limit(1);
        return result[0] || null;
    }
    async findOrCreateUser(decoded) {
        const existing = await this.dbService.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.clerkUserId, decoded.userId))
            .limit(1);
        if (existing.length > 0) {
            return existing[0];
        }
        const newUser = await this.dbService.db
            .insert(schema_1.users)
            .values({
            email: decoded.email || '',
            clerkUserId: decoded.userId,
            name: decoded.name || null,
        })
            .returning();
        return newUser[0];
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_pg_service_1.DrizzlePgService])
], AuthService);
//# sourceMappingURL=auth.service.js.map