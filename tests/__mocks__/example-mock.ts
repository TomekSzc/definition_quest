import { vi } from 'vitest';

/**
 * Przykładowe mocki dla testów
 * Umieść tutaj globalne mocki używane w wielu testach
 */

// Mock dla fetch API
export const mockFetch = vi.fn();

// Mock dla modułu
export const mockModule = {
  getData: vi.fn(),
  postData: vi.fn(),
  deleteData: vi.fn(),
};

// Mock dla Supabase
export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      data: [],
      error: null,
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
  auth: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
};

// Helper do resetowania wszystkich mocków
export function resetAllMocks() {
  vi.clearAllMocks();
  vi.resetAllMocks();
}

