import { DrizzlePgService } from '../database/drizzle-pg.service';
export interface ClerkDecodedToken {
    userId: string;
    email?: string;
    orgId?: string;
    orgRole?: string;
    name?: string;
    [key: string]: unknown;
}
export declare class AuthService {
    private readonly dbService;
    constructor(dbService: DrizzlePgService);
    verifyClerkToken(token: string): Promise<ClerkDecodedToken>;
    getUserByClerkId(clerkUserId: string): Promise<{
        id: string;
        name: string;
        email: string;
        clerkUserId: string;
        role: string;
        createdAt: Date;
    }>;
    findOrCreateUser(decoded: ClerkDecodedToken): Promise<any>;
}
