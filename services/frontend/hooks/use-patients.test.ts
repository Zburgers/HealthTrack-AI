import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePatientList, usePatient } from '@/hooks/use-patients';
import { useAuth } from '@clerk/nextjs';

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

const mockGetToken = vi.fn().mockResolvedValue('mock-clerk-jwt');
const mockAuth = {
  getToken: mockGetToken,
  isSignedIn: true,
};

describe('usePatientList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should fetch patients when signed in', async () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth as any);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: '1', name: 'John Doe' }]),
    });

    const { result } = renderHook(() => usePatientList());

    await waitFor(() => {
      expect(result.current.patients).toHaveLength(1);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/patients',
      expect.objectContaining({
        headers: { Authorization: 'Bearer mock-clerk-jwt' },
      }),
    );
  });

  it('should not fetch when not signed in', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...mockAuth, isSignedIn: false } as any);

    const { result } = renderHook(() => usePatientList());

    await new Promise((r) => setTimeout(r, 100));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth as any);
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePatientList());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });
});

describe('usePatient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should fetch a single patient when signed in', async () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth as any);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'John Doe' }),
    });

    const { result } = renderHook(() => usePatient('1'));

    await waitFor(() => {
      expect(result.current.patient).toHaveProperty('name', 'John Doe');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/patients/1',
      expect.objectContaining({
        headers: { Authorization: 'Bearer mock-clerk-jwt' },
      }),
    );
  });

  it('should not fetch when patientId is undefined', async () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth as any);

    const { result } = renderHook(() => usePatient(undefined));

    await new Promise((r) => setTimeout(r, 100));

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
