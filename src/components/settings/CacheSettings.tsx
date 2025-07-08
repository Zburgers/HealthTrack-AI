'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  TrendingUp, 
  MemoryStick,
  RefreshCw,
  Trash2,
  Activity,
  Thermometer,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface CacheMetrics {
  hits: number;
  misses: number;
  memoryHits: number;
  databaseHits: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
  memoryHitRate: number;
  averageEntrySize: number;
  memoryUtilization: number;
}

interface CacheStatus {
  warmingInProgress: boolean;
  metrics: CacheMetrics;
  lastWarmingDuration: number;
}

export default function CacheSettings() {
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [warming, setWarming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCacheData();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadCacheData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCacheData = async () => {
    try {
      setLoading(true);
      
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        const [metrics, status] = await Promise.all([
          (window as any).electronAPI.cache.getMetrics(),
          (window as any).electronAPI.cache.getStatus()
        ]);
        
        setCacheMetrics(metrics);
        setCacheStatus(status);
      } else {
        // Web environment - show placeholder
        setCacheMetrics({
          hits: 0,
          misses: 0,
          memoryHits: 0,
          databaseHits: 0,
          evictions: 0,
          totalSize: 0,
          entryCount: 0,
          hitRate: 0,
          memoryHitRate: 0,
          averageEntrySize: 0,
          memoryUtilization: 0
        });
      }
    } catch (error) {
      console.error('Failed to load cache data:', error);
      toast({
        title: "Error",
        description: "Failed to load cache information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWarmCache = async () => {
    try {
      setWarming(true);
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        await (window as any).electronAPI.cache.warm();
        toast({
          title: "Cache Warming Complete",
          description: "Cache has been warmed with common medical scenarios",
        });
        await loadCacheData();
      } else {
        toast({
          title: "Not Available",
          description: "Cache warming is only available in the desktop app",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Cache warming failed:', error);
      toast({
        title: "Cache Warming Failed",
        description: `Failed to warm cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setWarming(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setClearing(true);
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        await (window as any).electronAPI.cache.clear();
        toast({
          title: "Cache Cleared",
          description: "All cached data has been removed",
        });
        await loadCacheData();
      } else {
        toast({
          title: "Not Available",
          description: "Cache clearing is only available in the desktop app",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Cache clearing failed:', error);
      toast({
        title: "Cache Clear Failed",
        description: `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setClearing(false);
    }
  };

  const handleOptimizeCache = async () => {
    try {
      setOptimizing(true);
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      
      if (isElectron) {
        await (window as any).electronAPI.cache.optimize();
        toast({
          title: "Cache Optimization Complete",
          description: "Cache has been optimized for better performance",
        });
        await loadCacheData();
      } else {
        toast({
          title: "Not Available",
          description: "Cache optimization is only available in the desktop app",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Cache optimization failed:', error);
      toast({
        title: "Cache Optimization Failed",
        description: `Failed to optimize cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setOptimizing(false);
    }
  };

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 80) return 'text-green-600';
    if (hitRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryUtilizationColor = (utilization: number) => {
    if (utilization <= 70) return 'bg-green-500';
    if (utilization <= 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Smart Cache Management
          </CardTitle>
          <CardDescription>
            Loading cache performance metrics...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cache Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Smart Cache Performance
          </CardTitle>
          <CardDescription>
            AI inference caching with multi-tier memory and database storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {cacheMetrics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Hit Rate</p>
                      <p className={`text-2xl font-bold ${getHitRateColor(cacheMetrics.hitRate)}`}>
                        {cacheMetrics.hitRate.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Memory Hits</p>
                      <p className="text-2xl font-bold text-green-700">
                        {cacheMetrics.memoryHitRate.toFixed(1)}%
                      </p>
                    </div>
                    <MemoryStick className="h-8 w-8 text-green-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Cached Entries</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {cacheMetrics.entryCount}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Evictions</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {cacheMetrics.evictions}
                      </p>
                    </div>
                    <Thermometer className="h-8 w-8 text-orange-500" />
                  </div>
                </motion.div>
              </div>

              {/* Memory Utilization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory Utilization</span>
                  <span className="text-sm text-gray-600">
                    {cacheMetrics.memoryUtilization.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={cacheMetrics.memoryUtilization} 
                  className="h-3"
                />
                <p className="text-xs text-gray-500">
                  {Math.round(cacheMetrics.totalSize / 1024 / 1024)} MB of cache memory used
                </p>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Hits</p>
                  <p className="text-lg font-semibold">{cacheMetrics.hits.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Misses</p>
                  <p className="text-lg font-semibold">{cacheMetrics.misses.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Database Hits</p>
                  <p className="text-lg font-semibold">{cacheMetrics.databaseHits.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Avg Entry Size</p>
                  <p className="text-lg font-semibold">
                    {Math.round(cacheMetrics.averageEntrySize / 1024)} KB
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cache Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Optimize, warm, and manage your AI cache for peak performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleWarmCache}
              disabled={warming || (cacheStatus?.warmingInProgress ?? false)}
              className="flex items-center gap-2"
              variant="default"
            >
              {warming ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {warming ? 'Warming...' : 'Warm Cache'}
            </Button>

            <Button
              onClick={handleOptimizeCache}
              disabled={optimizing}
              className="flex items-center gap-2"
              variant="outline"
            >
              {optimizing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {optimizing ? 'Optimizing...' : 'Optimize'}
            </Button>

            <Button
              onClick={handleClearCache}
              disabled={clearing}
              className="flex items-center gap-2"
              variant="destructive"
            >
              {clearing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {clearing ? 'Clearing...' : 'Clear Cache'}
            </Button>
          </div>

          {cacheStatus?.warmingInProgress && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Cache warming in progress...
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Preloading common medical scenarios for faster AI inference
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cacheMetrics && (
              <>
                {cacheMetrics.hitRate >= 80 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      🎉 Excellent cache performance! Your hit rate is above 80%.
                    </p>
                  </div>
                )}
                
                {cacheMetrics.hitRate < 30 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      💡 Consider warming your cache to improve performance.
                    </p>
                  </div>
                )}
                
                {cacheMetrics.memoryUtilization > 85 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">
                      ⚠️ High memory usage detected. Cache optimization recommended.
                    </p>
                  </div>
                )}
                
                {cacheMetrics.evictions > 100 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      🔄 Frequent cache evictions detected. Consider increasing cache size.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
