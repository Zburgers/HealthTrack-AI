import { Controller, Get, Res, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

@Controller('export')
@UseGuards(ClerkAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('database')
  async exportDatabase(@Req() req: any, @Res() res: Response) {
    const orgId = req.user?.orgId;
    if (!orgId) {
      res.status(403).json({ error: 'Organization ID not found' });
      return;
    }

    const data = await this.exportService.exportAllPatients(orgId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=export-${Date.now()}.json`);
    res.json(data);
  }
}
