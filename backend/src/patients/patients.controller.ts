import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req } from '@nestjs/common';
import { PatientsService, CreatePatientDto, UpdatePatientDto } from './patients.service';

// TODO: Add JwtAuthGuard and OrgScopedGuard
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    // TODO: Extract organizationId from JWT
  ) {
    const organizationId = '00000000-0000-0000-0000-000000000000'; // Placeholder
    return this.patientsService.findAll(organizationId, parseInt(page), parseInt(limit), search);
  }

  @Get('search')
  async search(@Query('q') query: string) {
    const organizationId = '00000000-0000-0000-0000-000000000000'; // Placeholder
    return this.patientsService.search(organizationId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const organizationId = '00000000-0000-0000-0000-000000000000'; // Placeholder
    return this.patientsService.findById(organizationId, id);
  }

  @Post()
  async create(@Body() data: CreatePatientDto) {
    const organizationId = '00000000-0000-0000-0000-000000000000'; // Placeholder
    const createdBy = '00000000-0000-0000-0000-000000000000'; // Placeholder
    return this.patientsService.create(organizationId, data, createdBy);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdatePatientDto) {
    const organizationId = '00000000-0000-0000-0000-000000000000'; // Placeholder
    return this.patientsService.update(organizationId, id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const organizationId = '00000000-0000-0000-0000-000000000000'; // Placeholder
    const deletedBy = '00000000-0000-0000-0000-000000000000'; // Placeholder
    return this.patientsService.softDelete(organizationId, id, deletedBy);
  }
}
