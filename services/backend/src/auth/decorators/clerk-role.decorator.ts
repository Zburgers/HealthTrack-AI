import { SetMetadata } from '@nestjs/common';

export const CLERK_ROLES_KEY = 'clerkRoles';

export type ClerkRole = 'org:admin' | 'org:member';

export const RequireClerkRole = (...roles: ClerkRole[]) => SetMetadata(CLERK_ROLES_KEY, roles);
