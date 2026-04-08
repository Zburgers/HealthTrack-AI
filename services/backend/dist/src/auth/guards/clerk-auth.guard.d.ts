import { CanActivate, ExecutionContext } from '@nestjs/common';
export interface ClerkUser {
    userId: string;
    email?: string;
    orgId?: string;
    orgRole?: string;
    name?: string;
}
export declare class ClerkAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
