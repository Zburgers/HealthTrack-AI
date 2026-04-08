import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';

export interface ClerkUser {
  userId: string;
  email?: string;
  orgId?: string;
  orgRole?: string;
  name?: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      request.user = {
        userId: payload.sub,
        email: payload.email,
        orgId: payload.org_id,
        orgRole: payload.org_role,
        name: payload.name,
      } as ClerkUser;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid Clerk token');
    }
  }
}
