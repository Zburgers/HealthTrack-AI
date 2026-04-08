import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

@Controller('embeddings')
@UseGuards(ClerkAuthGuard)
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @Post()
  async triggerEmbeddings() {
    const count = await this.embeddingsService.generateAllPending();
    return { message: `Generated embeddings for ${count} cases`, count };
  }

  @Post(':caseId')
  async generateForCase(@Param('caseId') caseId: string) {
    await this.embeddingsService.generateForCase(caseId);
    return { message: `Embedding generated for case ${caseId}` };
  }
}
