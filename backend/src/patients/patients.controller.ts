import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PatientsService, CreatePatientDto, UpdatePatientDto } from './patients.service';
import { ClerkAuthGuard, ClerkUser } from '../auth/guards/clerk-auth.guard';
import { OrgScopedGuard } from '../auth/guards/org-scoped.guard';

@UseGuards(ClerkAuthGuard, OrgScopedGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  private getOrgId(req: { user: ClerkUser }): string {
    return req.user.orgId;
  }

  private getUserId(req: { user: ClerkUser }): string {
    return req.user.userId;
  }

  @Get()
  async findAll(
    @Req() req: { user: ClerkUser },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    const organizationId = this.getOrgId(req);
    return this.patientsService.findAll(organizationId, parseInt(page), parseInt(limit), search);
  }

  @Get('search')
  async search(@Req() req: { user: ClerkUser }, @Query('q') query: string) {
    const organizationId = this.getOrgId(req);
    return this.patientsService.search(organizationId, query);
  }

  @Get(':id')
  async findOne(@Req() req: { user: ClerkUser }, @Param('id') id: string) {
    const organizationId = this.getOrgId(req);
    return this.patientsService.findById(organizationId, id);
  }

  @Post()
  async create(@Req() req: { user: ClerkUser }, @Body() data: CreatePatientDto) {
    const organizationId = this.getOrgId(req);
    const createdBy = this.getUserId(req);
    return this.patientsService.create(organizationId, data, createdBy);
  }

  @Patch(':id')
  async update(
    @Req() req: { user: ClerkUser },
    @Param('id') id: string,
    @Body() data: UpdatePatientDto,
  ) {
    const organizationId = this.getOrgId(req);
    return this.patientsService.update(organizationId, id, data);
  }

  @Delete(':id')
  async remove(@Req() req: { user: ClerkUser }, @Param('id') id: string) {
    const organizationId = this.getOrgId(req);
    const deletedBy = this.getUserId(req);
    return this.patientsService.softDelete(organizationId, id, deletedBy);
  }
}
