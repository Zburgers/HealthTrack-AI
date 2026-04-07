import { Controller, Post, Get, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
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
    const decoded = await this.authService.verifyFirebaseToken(token);
    return { valid: true, user: decoded };
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request & { headers: { authorization?: string } }) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    return this.authService.getUserByFirebaseToken(token);
  }
}
