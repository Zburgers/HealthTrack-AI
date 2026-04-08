"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseProviderModule = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const schema = require("../../drizzle/schema");
let DatabaseProviderModule = class DatabaseProviderModule {
};
exports.DatabaseProviderModule = DatabaseProviderModule;
exports.DatabaseProviderModule = DatabaseProviderModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: 'DATABASE',
                useFactory: () => {
                    const pool = new pg_1.Pool({
                        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/healthtrack',
                    });
                    return (0, node_postgres_1.drizzle)(pool, { schema });
                },
            },
        ],
        exports: ['DATABASE'],
    })
], DatabaseProviderModule);
//# sourceMappingURL=database-provider.module.js.map