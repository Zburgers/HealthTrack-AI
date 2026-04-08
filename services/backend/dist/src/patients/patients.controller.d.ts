import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { ClerkUser } from '../auth/guards/clerk-auth.guard';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    private getOrgId;
    private getUserId;
    findAll(req: {
        user: ClerkUser;
    }, page?: string, limit?: string, search?: string): Promise<{
        id: string;
        name: string;
        email: string;
        createdAt: Date;
        organizationId: string;
        dateOfBirth: string;
        gender: string;
        phone: string;
        notes: string;
        isDeleted: boolean;
        deletedAt: Date;
        deletedReason: string;
        deletedBy: string;
        createdBy: string;
        updatedAt: Date;
    }[]>;
    search(req: {
        user: ClerkUser;
    }, query: string): Promise<{
        id: string;
        name: string;
        email: string;
        createdAt: Date;
        organizationId: string;
        dateOfBirth: string;
        gender: string;
        phone: string;
        notes: string;
        isDeleted: boolean;
        deletedAt: Date;
        deletedReason: string;
        deletedBy: string;
        createdBy: string;
        updatedAt: Date;
    }[]>;
    findOne(req: {
        user: ClerkUser;
    }, id: string): Promise<{
        id: string;
        name: string;
        email: string;
        createdAt: Date;
        organizationId: string;
        dateOfBirth: string;
        gender: string;
        phone: string;
        notes: string;
        isDeleted: boolean;
        deletedAt: Date;
        deletedReason: string;
        deletedBy: string;
        createdBy: string;
        updatedAt: Date;
    }>;
    create(req: {
        user: ClerkUser;
    }, data: CreatePatientDto): Promise<any>;
    update(req: {
        user: ClerkUser;
    }, id: string, data: UpdatePatientDto): Promise<any>;
    remove(req: {
        user: ClerkUser;
    }, id: string): Promise<any>;
}
