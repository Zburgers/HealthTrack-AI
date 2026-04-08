import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as schema from '../../drizzle/schema';
export declare class DrizzlePgService implements OnModuleInit, OnModuleDestroy {
    private pool;
    private _db;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get db(): import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema>;
}
