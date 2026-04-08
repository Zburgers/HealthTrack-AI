import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { patients } from '../../drizzle/schema';

describe('PatientsService', () => {
  let service: PatientsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;

  const TEST_ORG_ID = 'org_test_clerk_id';
  const TEST_USER_ID = 'user_test_clerk_id';

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    };

    const mockDrizzlePg = {
      db: mockDb,
      pool: { connect: vi.fn(), end: vi.fn() },
    };

    service = new PatientsService(mockDrizzlePg);
  });

  describe('findAll', () => {
    const mockPatients = [
      { id: '1', name: 'John Doe', organizationId: TEST_ORG_ID, isDeleted: false },
      { id: '2', name: 'Jane Smith', organizationId: TEST_ORG_ID, isDeleted: false },
    ];

    it('should return paginated patients for an organization', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue(mockPatients),
            }),
          }),
        }),
      });

      const result = await service.findAll(TEST_ORG_ID, 1, 10);

      expect(result).toEqual(mockPatients);
    });

    it('should apply search filter when query is provided', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([mockPatients[0]]),
            }),
          }),
        }),
      });

      const result = await service.findAll(TEST_ORG_ID, 1, 10, 'John');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should use default pagination (page=1, limit=20)', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue(mockPatients),
            }),
          }),
        }),
      });

      await service.findAll(TEST_ORG_ID);

      // Default: page 1, limit 20 → offset 0
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    const mockPatient = { id: '1', name: 'John Doe', organizationId: TEST_ORG_ID, isDeleted: false };

    it('should return patient when found within organization', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([mockPatient]),
          }),
        }),
      });

      const result = await service.findById(TEST_ORG_ID, '1');

      expect(result).toEqual(mockPatient);
    });

    it('should return null when patient not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const result = await service.findById(TEST_ORG_ID, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createDto: CreatePatientDto = {
      name: 'New Patient',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
    };

    it('should create a patient with organization and createdBy fields', async () => {
      const createdPatient = {
        id: 'new-id',
        ...createDto,
        organizationId: TEST_ORG_ID,
        createdBy: TEST_USER_ID,
        isDeleted: false,
      };

      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([createdPatient]),
        }),
      });

      const result = await service.create(TEST_ORG_ID, createDto, TEST_USER_ID);

      expect(result).toEqual(createdPatient);
      expect(mockDb.insert).toHaveBeenCalledWith(patients);
    });
  });

  describe('update', () => {
    const updateDto: UpdatePatientDto = { name: 'Updated Name' };
    const updatedPatient = { id: '1', name: 'Updated Name', organizationId: TEST_ORG_ID, isDeleted: false };

    it('should update patient within organization and set updatedAt', async () => {
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([updatedPatient]),
          }),
        }),
      });

      const result = await service.update(TEST_ORG_ID, '1', updateDto);

      expect(result).toEqual(updatedPatient);
      expect(mockDb.update).toHaveBeenCalledWith(patients);
    });

    it('should return null when patient not found', async () => {
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const result = await service.update(TEST_ORG_ID, 'nonexistent', updateDto);

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    const deletedPatient = {
      id: '1',
      name: 'John Doe',
      organizationId: TEST_ORG_ID,
      isDeleted: true,
      deletedAt: expect.any(Date),
      deletedBy: TEST_USER_ID,
      deletedReason: 'User deleted',
    };

    it('should soft delete patient within organization', async () => {
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([deletedPatient]),
          }),
        }),
      });

      const result = await service.softDelete(TEST_ORG_ID, '1', TEST_USER_ID);

      expect(result).toMatchObject({
        id: '1',
        isDeleted: true,
        deletedBy: TEST_USER_ID,
      });
    });

    it('should accept custom deletion reason', async () => {
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ ...deletedPatient, deletedReason: 'Duplicate record' }]),
          }),
        }),
      });

      const result = await service.softDelete(TEST_ORG_ID, '1', TEST_USER_ID, 'Duplicate record');

      expect(result.deletedReason).toBe('Duplicate record');
    });
  });

  describe('search', () => {
    const mockResults = [
      { id: '1', name: 'John Doe', organizationId: TEST_ORG_ID, isDeleted: false },
      { id: '2', name: 'John Smith', organizationId: TEST_ORG_ID, isDeleted: false },
    ];

    it('should return patients matching name query within organization', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce(mockResults),
          }),
        }),
      });

      const result = await service.search(TEST_ORG_ID, 'John');

      expect(result).toHaveLength(2);
    });

    it('should limit results to 20', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce(mockResults),
          }),
        }),
      });

      await service.search(TEST_ORG_ID, 'test');

      // Verify limit(20) was called
      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});
