import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PerformanceData {
  metrics: PerformanceMetric[];
  userAgent: string;
  url: string;
  connectionType?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = true;

  constructor() {
    this.initWebVitals();
    this.initCustomMetrics();
  }

  private initWebVitals() {
    if (!this.enabled) return;

    getCLS((metric) => {
      this.recordMetric({
        name: 'CLS',
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
      });
    });

    getFID((metric) => {
      this.recordMetric({
        name: 'FID',
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
      });
    });

    getFCP((metric) => {
      this.recordMetric({
        name: 'FCP',
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
      });
    });

    getLCP((metric) => {
      this.recordMetric({
        name: 'LCP',
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
      });
    });

    getTTFB((metric) => {
      this.recordMetric({
        name: 'TTFB',
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
      });
    });
  }

  private initCustomMetrics() {
    // Monitor React renders
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      this.monitorReactPerformance();
    }

    // Monitor API calls
    this.monitorNetworkRequests();

    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  private monitorReactPerformance() {
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      if (args[0]?.includes?.('React') && args[0]?.includes?.('performance')) {
        this.recordMetric({
          name: 'React Warning',
          value: 1,
          rating: 'needs-improvement',
          timestamp: Date.now(),
        });
      }
      originalConsoleWarn.apply(console, args);
    };
  }

  private monitorNetworkRequests() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        this.recordMetric({
          name: 'API Call Duration',
          value: duration,
          rating: duration < 1000 ? 'good' : duration < 3000 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        });

        return response;
      } catch (error) {
        this.recordMetric({
          name: 'API Call Error',
          value: 1,
          rating: 'poor',
          timestamp: Date.now(),
        });
        throw error;
      }
    };
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedHeap = memory.usedJSHeapSize / (1024 * 1024); // MB

        this.recordMetric({
          name: 'Memory Usage',
          value: usedHeap,
          rating: usedHeap < 50 ? 'good' : usedHeap < 100 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        });
      }, 30000); // Every 30 seconds
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Send critical metrics to backend
    if (metric.rating === 'poor') {
      this.sendMetricToBackend(metric);
    }
  }

  private async sendMetricToBackend(metric: PerformanceMetric) {
    try {
      const data: PerformanceData = {
        metrics: [metric],
        userAgent: navigator.userAgent,
        url: window.location.href,
        connectionType: (navigator as any).connection?.effectiveType,
      };

      await fetch('/api/performance/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }

  // Public methods
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getMetricsSummary() {
    const summary = {
      good: 0,
      needsImprovement: 0,
      poor: 0,
      total: this.metrics.length,
    };

    this.metrics.forEach((metric) => {
      switch (metric.rating) {
        case 'good':
          summary.good++;
          break;
        case 'needs-improvement':
          summary.needsImprovement++;
          break;
        case 'poor':
          summary.poor++;
          break;
      }
    });

    return summary;
  }

  public markFeatureUsage(feature: string, duration?: number) {
    this.recordMetric({
      name: `Feature: ${feature}`,
      value: duration || 1,
      rating: 'good',
      timestamp: Date.now(),
    });
  }

  public measureAsyncOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      try {
        const result = await operation();
        const duration = performance.now() - startTime;

        this.recordMetric({
          name: operationName,
          value: duration,
          rating: duration < 1000 ? 'good' : duration < 3000 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        });

        resolve(result);
      } catch (error) {
        this.recordMetric({
          name: `${operationName} Error`,
          value: 1,
          rating: 'poor',
          timestamp: Date.now(),
        });
        reject(error);
      }
    });
  }

  public disable() {
    this.enabled = false;
  }

  public enable() {
    this.enabled = true;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for React components
import { useEffect, useState } from 'react';

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [summary, setSummary] = useState({
    good: 0,
    needsImprovement: 0,
    poor: 0,
    total: 0,
  });

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
      setSummary(performanceMonitor.getMetricsSummary());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, summary };
};

export type { PerformanceMetric, PerformanceData };
