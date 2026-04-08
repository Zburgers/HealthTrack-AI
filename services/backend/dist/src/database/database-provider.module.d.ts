import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../drizzle/schema';
export type Database = ReturnType<typeof drizzle<typeof schema>>;
export declare class DatabaseProviderModule {
}
