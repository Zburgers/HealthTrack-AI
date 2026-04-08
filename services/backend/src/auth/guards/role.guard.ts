import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CLERK_ROLES_KEY, ClerkRole } from '../decorators/clerk-role.decorator';
import { ClerkUser } from '../guards/clerk-auth.guard';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ClerkRole[]>(CLERK_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as ClerkUser | undefined;

    if (!user?.orgRole) {
      throw new ForbiddenException('Organization role required');
    }

    // Clerk roles are prefixed with 'org:' (e.g., 'org:admin', 'org:member')
    // Map to our internal role names for convenience
    const userRole = user.orgRole;
    const hasRole = requiredRoles.some((role) => userRole === role || userRole === role.replace('org:', ''));

    if (!hasRole) {
      throw new ForbiddenException(`Insufficient role. Required: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
