import { Module } from '@nestjs/common';
import { SimilarCasesController } from './similar-cases.controller';
import { SimilarCasesService } from './similar-cases.service';

@Module({
  imports: [],
  controllers: [SimilarCasesController],
  providers: [SimilarCasesService],
  exports: [SimilarCasesService],
})
export class SimilarCasesModule {}
