/**
 * Cache warming and optimization utilities for HealthTrack AI
 * 
 * This module provides cache warming strategies and performance monitoring
 * specifically optimized for the Electron desktop application.
 */

import { SmartCache } from '@/lib/smartCache';

interface CacheWarmingConfig {
  enabled: boolean;
  strategies: {
    onAppStart: boolean;
    onUserLogin: boolean;
    background: boolean;
  };
  frequentWorkflows: string[];
  commonInputPatterns: any[];
}

class CacheWarmingManager {
  private config: CacheWarmingConfig = {
    enabled: true,
    strategies: {
      onAppStart: true,
      onUserLogin: true,
      background: true
    },
    frequentWorkflows: [
      'analyze-patient-symptoms',
      'summarize-patient-condition',
      'extract-medical-entities',
      'generate-soap-notes',
      'classify-icd-codes',
      'analyze-and-summarize-patient'
    ],
    commonInputPatterns: [
      // Common medical scenarios for cache warming
      {
        patientInformation: 'Adult patient, routine checkup',
        vitals: 'BP: 120/80, HR: 72, Temp: 98.6°F',
        observations: 'Patient appears well, no acute distress'
      },
      {
        patientInformation: 'Elderly patient, follow-up visit',
        vitals: 'BP: 140/90, HR: 68, Temp: 98.2°F',
        observations: 'Chronic conditions being monitored'
      },
      {
        medicalHistory: 'Diabetes Type 2, Hypertension',
        currentNotes: 'Patient compliant with medications'
      }
    ]
  };

  private warmingInProgress = false;
  private warmingStartTime = 0;

  /**
   * Initialize cache warming on application start
   */
  async initializeOnAppStart(): Promise<void> {
    if (!this.config.enabled || !this.config.strategies.onAppStart) {
      return;
    }

    console.log('🚀 Initializing cache warming on app start...');
    
    // Start in background to not block app startup
    setTimeout(() => {
      this.performWarmup('app-start').catch(error => {
        console.error('❌ App start cache warming failed:', error);
      });
    }, 5000); // Wait 5 seconds after app start
  }

  /**
   * Warm cache when user logs in
   */
  async warmOnUserLogin(userId: string): Promise<void> {
    if (!this.config.enabled || !this.config.strategies.onUserLogin) {
      return;
    }

    console.log('👤 Starting user-specific cache warming...');
    
    // User-specific warming could include their recent patients, common workflows, etc.
    await this.performWarmup('user-login', { userId });
  }

  /**
   * Background cache warming during idle periods
   */
  async startBackgroundWarming(): Promise<void> {
    if (!this.config.enabled || !this.config.strategies.background) {
      return;
    }

    // Run background warming every 30 minutes during idle periods
    setInterval(async () => {
      if (!this.warmingInProgress && this.isUserIdle()) {
        console.log('🌙 Starting background cache warming...');
        await this.performWarmup('background').catch(error => {
          console.error('❌ Background cache warming failed:', error);
        });
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Perform cache preloading for specific medical scenarios
   */
  async preloadMedicalScenarios(): Promise<void> {
    console.log('🏥 Preloading common medical scenarios...');

    const medicalScenarios = [
      {
        name: 'Routine Checkup',
        input: {
          patientInformation: 'Annual wellness visit for adult patient',
          vitals: 'All vitals within normal limits',
          observations: 'Patient reports feeling well, no complaints'
        }
      },
      {
        name: 'Diabetes Follow-up',
        input: {
          patientInformation: 'Type 2 diabetes follow-up appointment',
          vitals: 'BP: 135/85, HbA1c: 7.2%',
          observations: 'Blood sugar levels improving with current regimen',
          medicalHistory: 'Type 2 Diabetes Mellitus, diagnosed 2018'
        }
      },
      {
        name: 'Hypertension Management',
        input: {
          patientInformation: 'Hypertension management visit',
          vitals: 'BP: 145/92, HR: 78',
          observations: 'Patient reports compliance with medications',
          medicalHistory: 'Essential Hypertension, on ACE inhibitors'
        }
      },
      {
        name: 'Respiratory Symptoms',
        input: {
          patientInformation: 'Patient presenting with respiratory symptoms',
          vitals: 'Temp: 99.8°F, O2 Sat: 96%, RR: 22',
          observations: 'Mild cough, congestion, no fever'
        }
      }
    ];

    const promises = medicalScenarios.map(async (scenario) => {
      try {
        for (const workflow of this.config.frequentWorkflows) {
          await SmartCache.get(workflow, scenario.input);
        }
        console.log(`✅ Preloaded: ${scenario.name}`);
      } catch (error) {
        console.warn(`⚠️ Failed to preload ${scenario.name}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('🎯 Medical scenario preloading complete');
  }

  /**
   * Optimize cache based on usage patterns
   */
  async optimizeCache(): Promise<void> {
    const metrics = SmartCache.getMetrics();
    
    console.log('🔧 Optimizing cache based on usage patterns...');
    console.log('📊 Current metrics:', {
      hitRate: `${metrics.hitRate.toFixed(1)}%`,
      memoryUtilization: `${metrics.memoryUtilization.toFixed(1)}%`,
      entries: metrics.entryCount
    });

    // If hit rate is low, clear cache and warm with better patterns
    if (metrics.hitRate < 30) {
      console.log('📉 Low hit rate detected, clearing and re-warming cache...');
      SmartCache.clear();
      await this.performWarmup('optimization');
    }

    // If memory utilization is high, clear least used entries
    if (metrics.memoryUtilization > 80) {
      console.log('💾 High memory utilization, optimizing cache size...');
      // SmartCache automatically handles LRU eviction
    }
  }

  /**
   * Get cache warming status and metrics
   */
  getStatus() {
    const metrics = SmartCache.getMetrics();
    return {
      warmingInProgress: this.warmingInProgress,
      config: this.config,
      metrics,
      lastWarmingDuration: this.warmingStartTime > 0 ? Date.now() - this.warmingStartTime : 0
    };
  }

  /**
   * Private methods
   */
  private async performWarmup(strategy: string, context?: any): Promise<void> {
    if (this.warmingInProgress) {
      console.log('⏳ Cache warming already in progress, skipping...');
      return;
    }

    this.warmingInProgress = true;
    this.warmingStartTime = Date.now();

    try {
      console.log(`🔥 Starting cache warming strategy: ${strategy}`);

      // Warm common workflows with typical input patterns
      const promises = this.config.frequentWorkflows.map(async (workflow) => {
        for (const inputPattern of this.config.commonInputPatterns) {
          try {
            await SmartCache.get(workflow, inputPattern);
          } catch (error) {
            console.warn(`⚠️ Warming failed for ${workflow}:`, error);
          }
        }
      });

      await Promise.allSettled(promises);

      // Preload medical scenarios
      await this.preloadMedicalScenarios();

      const duration = Date.now() - this.warmingStartTime;
      console.log(`✅ Cache warming completed in ${duration}ms`);
      
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    } finally {
      this.warmingInProgress = false;
    }
  }

  private isUserIdle(): boolean {
    // Simple idle detection - in a real app, you might use more sophisticated methods
    // For now, assume user is idle during background warming periods
    return true;
  }
}

// Singleton instance
const cacheWarmingManager = new CacheWarmingManager();

// Export utilities
export const CacheWarming = {
  /**
   * Initialize cache warming system
   */
  async initialize(): Promise<void> {
    await cacheWarmingManager.initializeOnAppStart();
    await cacheWarmingManager.startBackgroundWarming();
  },

  /**
   * Warm cache for user login
   */
  async warmForUser(userId: string): Promise<void> {
    await cacheWarmingManager.warmOnUserLogin(userId);
  },

  /**
   * Preload medical scenarios
   */
  async preloadScenarios(): Promise<void> {
    await cacheWarmingManager.preloadMedicalScenarios();
  },

  /**
   * Optimize cache performance
   */
  async optimize(): Promise<void> {
    await cacheWarmingManager.optimizeCache();
  },

  /**
   * Get warming status
   */
  getStatus() {
    return cacheWarmingManager.getStatus();
  }
};

export default CacheWarming;
