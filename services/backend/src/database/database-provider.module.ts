import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../drizzle/schema';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

@Module({
  providers: [
    {
      provide: 'DATABASE',
      useFactory: (): Database => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/healthtrack',
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: ['DATABASE'],
})
export class DatabaseProviderModule {}
