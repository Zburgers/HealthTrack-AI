import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUser(id: string): Promise<{
        id: string;
        name: string;
        email: string;
        clerkUserId: string;
        role: string;
        createdAt: Date;
    }>;
}
