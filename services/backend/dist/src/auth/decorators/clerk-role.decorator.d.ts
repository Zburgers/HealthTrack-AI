export declare const CLERK_ROLES_KEY = "clerkRoles";
export type ClerkRole = 'org:admin' | 'org:member';
export declare const RequireClerkRole: (...roles: ClerkRole[]) => import("@nestjs/common").CustomDecorator<string>;
