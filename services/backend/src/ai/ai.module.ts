import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { MastraModule } from '../mastra/mastra.module';

@Module({
  imports: [MastraModule],
  controllers: [AIController],
})
export class AIModule {}
