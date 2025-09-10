import '@testing-library/jest-dom';

// Mock Tauri API
const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke,
}));

// Mock system accent color function
vi.mock('../lib/system', () => ({
  getSystemAccentColor: vi.fn().mockResolvedValue('#0078d4'),
}));

// Setup localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Export mocks for use in tests
export { mockInvoke, localStorageMock };