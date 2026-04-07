import { Module, Global } from '@nestjs/common';
import { DrizzlePgService } from './drizzle-pg.service';

@Global()
@Module({
  providers: [DrizzlePgService],
  exports: [DrizzlePgService],
})
export class DatabaseModule {}
