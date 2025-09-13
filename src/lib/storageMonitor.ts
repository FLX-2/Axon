/**
 * Storage Performance Monitor
 * Provides real-time monitoring and analytics for storage operations
 */

import { storageManager } from './storageManager';

export interface StorageMetrics {
  operationCount: number;
  averageResponseTime: number;
  errorCount: number;
  cacheHitRate: number;
  storageSize: number;
  keyCount: number;
  lastCleanup: number;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: StorageMetrics;
  recommendations: string[];
  alerts: string[];
}

class StorageMonitor {
  private metrics: StorageMetrics;
  private operationTimes: number[] = [];
  private maxOperationHistory = 1000;
  private reportHistory: PerformanceReport[] = [];
  private maxReportHistory = 50;

  constructor() {
    this.metrics = {
      operationCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      cacheHitRate: 0,
      storageSize: 0,
      keyCount: 0,
      lastCleanup: Date.now()
    };

    // Initialize with current stats
    this.updateMetrics();
  }

  private updateMetrics(): void {
    const stats = storageManager.getStats();
    this.metrics = {
      ...this.metrics,
      cacheHitRate: stats.hitRate,
      storageSize: stats.totalSize,
      keyCount: stats.totalKeys
    };
  }

  recordOperation(startTime: number, success: boolean = true): void {
    const duration = Date.now() - startTime;
    this.operationTimes.push(duration);

    // Keep only recent operations
    if (this.operationTimes.length > this.maxOperationHistory) {
      this.operationTimes = this.operationTimes.slice(-this.maxOperationHistory);
    }

    this.metrics.operationCount++;

    if (!success) {
      this.metrics.errorCount++;
    }

    // Update average response time
    this.metrics.averageResponseTime =
      this.operationTimes.reduce((sum, time) => sum + time, 0) / this.operationTimes.length;

    this.updateMetrics();
  }

  recordError(): void {
    this.metrics.errorCount++;
  }

  generateReport(): PerformanceReport {
    const recommendations: string[] = [];
    const alerts: string[] = [];

    // Analyze performance
    if (this.metrics.averageResponseTime > 50) {
      alerts.push('Storage operations are running slow (>50ms average)');
      recommendations.push('Consider reducing storage payload sizes or implementing compression');
    }

    if (this.metrics.errorCount > this.metrics.operationCount * 0.1) {
      alerts.push('High error rate detected (>10% of operations)');
      recommendations.push('Check storage quota limits and error handling');
    }

    if (this.metrics.cacheHitRate < 0.5) {
      recommendations.push('Low cache hit rate detected. Consider optimizing cache strategy');
    }

    if (this.metrics.storageSize > 8 * 1024 * 1024) { // 8MB
      alerts.push('Storage size approaching browser limits');
      recommendations.push('Implement storage cleanup or compression');
    }

    if (this.metrics.keyCount > 500) {
      recommendations.push('High number of storage keys. Consider consolidating data structures');
    }

    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      recommendations,
      alerts
    };

    // Store report history
    this.reportHistory.push(report);
    if (this.reportHistory.length > this.maxReportHistory) {
      this.reportHistory = this.reportHistory.slice(-this.maxReportHistory);
    }

    return report;
  }

  getMetrics(): StorageMetrics {
    return { ...this.metrics };
  }

  getReportHistory(): PerformanceReport[] {
    return [...this.reportHistory];
  }

  reset(): void {
    this.metrics = {
      operationCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      cacheHitRate: 0,
      storageSize: 0,
      keyCount: 0,
      lastCleanup: Date.now()
    };
    this.operationTimes = [];
    this.reportHistory = [];
    this.updateMetrics();
  }

  // Utility methods for monitoring
  startOperation(): () => void {
    const startTime = Date.now();
    return () => this.recordOperation(startTime, true);
  }

  wrapOperation<T>(operation: () => T): T {
    const endOperation = this.startOperation();
    try {
      const result = operation();
      endOperation();
      return result;
    } catch (error) {
      this.recordOperation(Date.now() - Date.now(), false);
      throw error;
    }
  }

  async wrapAsyncOperation<T>(operation: () => Promise<T>): Promise<T> {
    const endOperation = this.startOperation();
    try {
      const result = await operation();
      endOperation();
      return result;
    } catch (error) {
      this.recordOperation(Date.now() - Date.now(), false);
      throw error;
    }
  }
}

// Singleton instance
export const storageMonitor = new StorageMonitor();

// Helper functions for easy monitoring
export const monitorStorageOperation = <T>(operation: () => T): T => {
  return storageMonitor.wrapOperation(operation);
};

export const monitorAsyncStorageOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
  return storageMonitor.wrapAsyncOperation(operation);
};

// Development helper to log performance reports
export const logStorageReport = (): void => {
  if (process.env.NODE_ENV === 'development') {
    const report = storageMonitor.generateReport();
    console.group('📊 Storage Performance Report');
    console.log('Metrics:', report.metrics);
    if (report.alerts.length > 0) {
      console.warn('🚨 Alerts:', report.alerts);
    }
    if (report.recommendations.length > 0) {
      console.info('💡 Recommendations:', report.recommendations);
    }
    console.groupEnd();
  }
};

// Auto-reporting in development
if (process.env.NODE_ENV === 'development') {
  // Log report every 30 seconds
  setInterval(logStorageReport, 30000);
}