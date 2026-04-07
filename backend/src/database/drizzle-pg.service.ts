import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../drizzle/schema';

@Injectable()
export class DrizzlePgService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private _db: ReturnType<typeof drizzle<typeof schema>>;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/healthtrack',
    });
    this._db = drizzle(this.pool, { schema });
  }

  async onModuleInit() {
    await this.pool.connect();
    console.log('Database connection established');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  get db() {
    return this._db;
  }

  get pool() {
    return this.pool;
  }
}
