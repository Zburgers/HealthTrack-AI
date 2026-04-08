import { DrizzlePgService } from '../database/drizzle-pg.service';
export declare class UsersService {
    private readonly dbService;
    constructor(dbService: DrizzlePgService);
    findByEmail(email: string): Promise<{
        id: string;
        name: string;
        email: string;
        clerkUserId: string;
        role: string;
        createdAt: Date;
    }>;
    findByClerkUserId(clerkUserId: string): Promise<{
        id: string;
        name: string;
        email: string;
        clerkUserId: string;
        role: string;
        createdAt: Date;
    }>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        email: string;
        clerkUserId: string;
        role: string;
        createdAt: Date;
    }>;
}
