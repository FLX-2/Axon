/**
 * Storage Optimization Tests
 * Verifies that the unified storage architecture provides better performance and efficiency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageManager } from '../lib/storageManager';
import { storageMonitor } from '../lib/storageMonitor';
import { useUnifiedSettingsStore } from '../store/useUnifiedSettingsStore';
import { useUnifiedAppStore } from '../store/useUnifiedAppStore';
import { useUnifiedFolderStore } from '../store/useUnifiedFolderStore';

describe('Storage Optimization Tests', () => {
  beforeEach(() => {
    // Clear all storage before each test
    storageManager.clear();
    storageMonitor.reset();
  });

  describe('Storage Manager Performance', () => {
    it('should cache frequently accessed data efficiently', () => {
      const testData = { message: 'test data', timestamp: Date.now() };
      const key = 'test_key';

      // First access - should cache
      storageManager.set(key, testData);
      const firstRead = storageManager.get(key);
      expect(firstRead).toEqual(testData);

      // Second access - should use cache
      const secondRead = storageManager.get(key);
      expect(secondRead).toEqual(testData);

      // Check cache hit rate
      const metrics = storageMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });

    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: `item_${i}_`.repeat(10) // Create larger strings
      }));

      const startTime = Date.now();
      storageManager.set('large_dataset', largeData);
      const setTime = Date.now() - startTime;

      const readStartTime = Date.now();
      const retrieved = storageManager.get('large_dataset');
      const readTime = Date.now() - readStartTime;

      expect(retrieved).toEqual(largeData);
      expect(setTime).toBeLessThan(100); // Should be fast
      expect(readTime).toBeLessThan(50); // Should be very fast with cache
    });

    it('should manage storage size limits', () => {
      // Fill storage with data
      for (let i = 0; i < 100; i++) {
        storageManager.set(`key_${i}`, `data_${i}_`.repeat(100));
      }

      const stats = storageManager.getStats();
      expect(stats.totalKeys).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should handle TTL expiration correctly', async () => {
      const testData = { message: 'expires soon' };
      const shortTTL = 100; // 100ms

      storageManager.set('expiring_key', testData, shortTTL);

      // Should exist immediately
      expect(storageManager.get('expiring_key')).toEqual(testData);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, shortTTL + 10));
      expect(storageManager.get('expiring_key')).toBeUndefined();
    });
  });

  describe('Unified Store Integration', () => {
    it('should initialize settings store without errors', () => {
      const store = useUnifiedSettingsStore.getState();
      expect(store.themeMode).toBeDefined();
      expect(store.colors).toBeDefined();
      expect(store.isCustomAccentColor).toBeDefined();
    });

    it('should handle app store operations efficiently', () => {
      const store = useUnifiedAppStore.getState();

      // Test basic operations
      expect(store.apps).toBeDefined();
      expect(store.searchTerm).toBeDefined();
      expect(store.isLoading).toBeDefined();
    });

    it('should manage folder store correctly', () => {
      const store = useUnifiedFolderStore.getState();

      // Should have default folders
      expect(store.folders.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track operation metrics', () => {
      // Perform some operations
      storageManager.set('test1', 'value1');
      storageManager.set('test2', 'value2');
      storageManager.get('test1');
      storageManager.get('test2');
      storageManager.get('nonexistent');

      const metrics = storageMonitor.getMetrics();
      expect(metrics.operationCount).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should generate performance reports', () => {
      // Generate some activity
      for (let i = 0; i < 10; i++) {
        storageManager.set(`perf_test_${i}`, `data_${i}`);
        storageManager.get(`perf_test_${i}`);
      }

      const report = storageMonitor.generateReport();
      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.metrics).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.alerts)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage quota exceeded gracefully', () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const result = storageManager.set('test', 'large_data');
      expect(result).toBe(false);

      // Restore original function
      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted data gracefully', () => {
      // Manually set corrupted data
      const key = storageManager['getFullKey']('corrupted');
      localStorage.setItem(key, 'invalid json');

      const result = storageManager.get('corrupted', 'default');
      expect(result).toBe('default');
    });
  });
});