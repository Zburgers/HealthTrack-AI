import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class OrgScopedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
