import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CaseDetailsService } from './case-details.service';

@Controller('cases')
export class CaseDetailsController {
  constructor(private readonly caseDetailsService: CaseDetailsService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const caseData = await this.caseDetailsService.findOne(id);
    if (!caseData) {
      throw new NotFoundException(`Case with id ${id} not found`);
    }
    return caseData;
  }
}
