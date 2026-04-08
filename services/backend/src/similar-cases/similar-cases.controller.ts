import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SimilarCasesService } from './similar-cases.service';
import { SimilarCaseSearchDto } from './dto/similar-cases.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

@Controller('cases')
@UseGuards(ClerkAuthGuard)
export class SimilarCasesController {
  constructor(private readonly similarCasesService: SimilarCasesService) {}

  @Post('similar')
  async findSimilar(@Body() input: SimilarCaseSearchDto) {
    return this.similarCasesService.findSimilar(input);
  }
}
