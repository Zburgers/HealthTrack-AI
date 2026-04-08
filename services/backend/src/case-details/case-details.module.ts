import { Module } from '@nestjs/common';
import { CaseDetailsController } from './case-details.controller';
import { CaseDetailsService } from './case-details.service';

@Module({
  imports: [],
  controllers: [CaseDetailsController],
  providers: [CaseDetailsService],
  exports: [CaseDetailsService],
})
export class CaseDetailsModule {}
