import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientsController } from '../src/patients/patients.controller';

const mockPatients = [
  { id: '1', name: 'John Doe', organizationId: 'org_test', isDeleted: false },
  { id: '2', name: 'Jane Smith', organizationId: 'org_test', isDeleted: false },
];

const mockPatientsService = {
  findAll: vi.fn().mockResolvedValue(mockPatients),
  findById: vi.fn().mockImplementation((_orgId: string, id: string) =>
    Promise.resolve(mockPatients.find((p) => p.id === id) || null),
  ),
  create: vi.fn().mockImplementation((_orgId: string, data: any, _createdBy: string) =>
    Promise.resolve({ id: 'new-id', ...data, organizationId: 'org_test', isDeleted: false }),
  ),
  update: vi.fn().mockImplementation((_orgId: string, id: string, data: any) =>
    Promise.resolve({ id, ...data, organizationId: 'org_test', updatedAt: new Date() }),
  ),
  softDelete: vi.fn().mockResolvedValue({ id: '1', isDeleted: true, deletedAt: new Date() }),
  search: vi.fn().mockResolvedValue([mockPatients[0]]),
};

const mockRequest = {
  user: {
    userId: 'user_test',
    orgId: 'org_test',
    email: 'test@example.com',
    name: 'Test User',
  },
};

describe('PatientsController', () => {
  let controller: PatientsController;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create controller directly with mocked service
    controller = new PatientsController(mockPatientsService as any);
  });

  describe('findAll', () => {
    it('should return paginated patients', async () => {
      const result = await controller.findAll(mockRequest as any, '1', '10', undefined);
      expect(result).toEqual(mockPatients);
      expect(mockPatientsService.findAll).toHaveBeenCalledWith('org_test', 1, 10, undefined);
    });

    it('should apply search filter', async () => {
      const result = await controller.findAll(mockRequest as any, '1', '10', 'John');
      expect(result).toEqual(mockPatients);
      expect(mockPatientsService.findAll).toHaveBeenCalledWith('org_test', 1, 10, 'John');
    });
  });

  describe('search', () => {
    it('should return patients matching query', async () => {
      const result = await controller.search(mockRequest as any, 'John');
      expect(result).toEqual([mockPatients[0]]);
      expect(mockPatientsService.search).toHaveBeenCalledWith('org_test', 'John');
    });
  });

  describe('findOne', () => {
    it('should return a single patient', async () => {
      const result = await controller.findOne(mockRequest as any, '1');
      expect(result).toEqual(mockPatients[0]);
      expect(mockPatientsService.findById).toHaveBeenCalledWith('org_test', '1');
    });

    it('should return null for non-existent patient', async () => {
      mockPatientsService.findById.mockResolvedValueOnce(null);
      const result = await controller.findOne(mockRequest as any, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const dto = { name: 'New Patient', dateOfBirth: '1990-01-01' };
      const result = await controller.create(mockRequest as any, dto);
      expect(result).toHaveProperty('name', 'New Patient');
      expect(result).toHaveProperty('organizationId', 'org_test');
      expect(mockPatientsService.create).toHaveBeenCalledWith('org_test', dto, 'user_test');
    });
  });

  describe('update', () => {
    it('should update a patient', async () => {
      const result = await controller.update(mockRequest as any, '1', { name: 'Updated' });
      expect(result).toHaveProperty('name', 'Updated');
      expect(mockPatientsService.update).toHaveBeenCalledWith('org_test', '1', { name: 'Updated' });
    });
  });

  describe('remove', () => {
    it('should soft delete a patient', async () => {
      const result = await controller.remove(mockRequest as any, '1');
      expect(result).toHaveProperty('isDeleted', true);
      expect(mockPatientsService.softDelete).toHaveBeenCalledWith('org_test', '1', 'user_test');
    });
  });
});
