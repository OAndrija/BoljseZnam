import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLastPosition,
  loadLastPosition,
  saveLastPosition,
  type LastPosition,
} from '../src/renderer/progress/lastPosition';

describe('lastPosition', () => {
  let storage: Map<string, string>;
  let mockStorage: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    storage = new Map();

    mockStorage = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
    };

    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const position: LastPosition = {
    path: '/naloga/KEM/2022/1',
    label: 'Naloga 1',
  };

  it('saves the last position', () => {
    saveLastPosition(position);

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'bolje-znam:zadnja-naloga',
      JSON.stringify(position),
    );
  });

  it('loads the saved position', () => {
    saveLastPosition(position);

    expect(loadLastPosition()).toEqual(position);
  });

  it('returns null when no position is saved', () => {
    expect(loadLastPosition()).toBeNull();
  });

  it('returns null when stored data is invalid JSON', () => {
    storage.set('bolje-znam:zadnja-naloga', '{invalid json');

    expect(loadLastPosition()).toBeNull();
  });

  it('clears the saved position', () => {
    saveLastPosition(position);

    clearLastPosition();

    expect(loadLastPosition()).toBeNull();
    expect(mockStorage.removeItem).toHaveBeenCalledWith(
      'bolje-znam:zadnja-naloga',
    );
  });

  it('does not throw when saving fails', () => {
    mockStorage.setItem.mockImplementationOnce(() => {
      throw new Error('Storage unavailable');
    });

    expect(() => saveLastPosition(position)).not.toThrow();
  });

  it('returns null when loading fails', () => {
    mockStorage.getItem.mockImplementationOnce(() => {
      throw new Error('Storage unavailable');
    });

    expect(loadLastPosition()).toBeNull();
  });

  it('does not throw when clearing fails', () => {
    mockStorage.removeItem.mockImplementationOnce(() => {
      throw new Error('Storage unavailable');
    });

    expect(() => clearLastPosition()).not.toThrow();
  });
});