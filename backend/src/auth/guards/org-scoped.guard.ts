import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OrgScopedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { orgId?: string } | undefined;

    if (!user?.orgId) {
      throw new ForbiddenException('Organization context required. Please select or create an organization.');
    }

    // orgId is attached to request.user by ClerkAuthGuard
    return true;
  }
}
