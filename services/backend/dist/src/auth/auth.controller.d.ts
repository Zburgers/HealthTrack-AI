import { AuthService } from './auth.service';
import { ClerkUser } from './guards/clerk-auth.guard';
import { Request } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    verifyToken(req: Request & {
        headers: {
            authorization?: string;
        };
    }): Promise<{
        valid: boolean;
        user: import("./auth.service").ClerkDecodedToken;
    }>;
    getCurrentUser(req: Request & {
        user: ClerkUser;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        clerkUserId: string;
        role: string;
        createdAt: Date;
    }>;
    getSession(req: Request & {
        user: ClerkUser;
    }): Promise<{
        userId: string;
        orgId: string;
        orgRole: string;
        email: string;
    }>;
}
