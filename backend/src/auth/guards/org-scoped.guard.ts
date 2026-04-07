import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OrgScopedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Ensures all queries are scoped to the user's organization
    const request = context.switchToHttp().getRequest();
    // Organization ID should be extracted from JWT and attached to request
    return !!request.user?.organizationId;
  }
}
