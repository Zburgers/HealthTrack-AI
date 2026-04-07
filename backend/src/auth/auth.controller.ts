import { Controller, Post, Get, Req, UseGuards, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ClerkAuthGuard, ClerkUser } from './guards/clerk-auth.guard';
import { OrgScopedGuard } from './guards/org-scoped.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  async verifyToken(@Req() req: Request & { headers: { authorization?: string } }) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    const decoded = await this.authService.verifyClerkToken(token);
    return { valid: true, user: decoded };
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async getCurrentUser(@Req() req: Request & { user: ClerkUser }) {
    const clerkUserId = req.user.userId;

    const existingUser = await this.authService.getUserByClerkId(clerkUserId);
    if (!existingUser) {
      throw new BadRequestException('User not found in database. Please complete registration.');
    }

    return existingUser;
  }

  @Get('session')
  @UseGuards(ClerkAuthGuard, OrgScopedGuard)
  async getSession(@Req() req: Request & { user: ClerkUser }) {
    return {
      userId: req.user.userId,
      orgId: req.user.orgId,
      orgRole: req.user.orgRole,
      email: req.user.email,
    };
  }
}
