/**
 * Switchboard Demo Component
 * 
 * This component demonstrates how to use Clara's Switchboard Architecture
 * for unified data access. All data operations now flow through the central
 * `dataSource.query()` method regardless of the underlying database.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Send, 
  CheckCircle, 
  XCircle,
  Loader2,
  Code,
  Users,
  FileText
} from 'lucide-react';

export default function SwitchboardDemo() {
  const [queryType, setQueryType] = useState('patient.search');
  const [queryParams, setQueryParams] = useState('{}');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  /**
   * Execute a query using the Switchboard
   */
  const executeQuery = async () => {
    if (!isElectron) {
      setError('Switchboard is only available in Electron desktop app');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse the parameters
      let params;
      try {
        params = JSON.parse(queryParams);
      } catch (e) {
        throw new Error('Invalid JSON in query parameters');
      }

      console.log(`🎯 [SWITCHBOARD_DEMO] Executing query: ${queryType}`, params);

      // Use the unified data access method
      const queryResult = await window.electronAPI.dataSource.query({
        type: queryType,
        params: params
      });

      setResult(queryResult);
      console.log(`✅ [SWITCHBOARD_DEMO] Query successful:`, queryResult);

    } catch (error: any) {
      console.error(`❌ [SWITCHBOARD_DEMO] Query failed:`, error);
      setError(error.message || 'Query execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Demo query presets
   */
  const demoQueries = [
    {
      label: 'Find All Patients',
      type: 'patient.search',
      params: '{"filter": {}, "options": {"limit": 10}}'
    },
    {
      label: 'Get Patient by ID',
      type: 'patient.getById',
      params: '{"id": "patient-id-here"}'
    },
    {
      label: 'Create New Patient',
      type: 'patient.create',
      params: '{"document": {"name": "John Doe", "age": 35, "condition": "Routine Checkup"}}'
    },
    {
      label: 'Search Notes',
      type: 'notes.search',
      params: '{"filter": {"type": "SOAP"}, "options": {"limit": 5}}'
    },
    {
      label: 'Get AI Cache',
      type: 'ai_cache.search',
      params: '{"filter": {}, "options": {"limit": 3}}'
    }
  ];

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎯 Switchboard Demo</CardTitle>
          <CardDescription>
            This demo is only available in the Electron desktop application.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            🎯 Switchboard API Demo
          </CardTitle>
          <CardDescription>
            Test Clara's unified data access system. All queries flow through the central 
            <code className="ml-1 px-1 py-0.5 bg-gray-100 rounded text-sm">dataSource.query()</code> method.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Query Builder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="queryType">Query Type</Label>
                <Input
                  id="queryType"
                  value={queryType}
                  onChange={(e) => setQueryType(e.target.value)}
                  placeholder="e.g., patient.search, patient.getById"
                />
              </div>
              
              <div>
                <Label htmlFor="queryParams">Parameters (JSON)</Label>
                <Textarea
                  id="queryParams"
                  value={queryParams}
                  onChange={(e) => setQueryParams(e.target.value)}
                  placeholder='{"filter": {}, "options": {"limit": 10}}'
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              
              <Button 
                onClick={executeQuery} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing Query...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Execute Query
                  </>
                )}
              </Button>
            </div>

            {/* Demo Presets */}
            <div className="space-y-4">
              <Label>Demo Queries</Label>
              <div className="space-y-2">
                {demoQueries.map((demo, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      setQueryType(demo.type);
                      setQueryParams(demo.params);
                    }}
                  >
                    {demo.type === 'patient.search' && <Users className="h-4 w-4 mr-2" />}
                    {demo.type === 'patient.getById' && <Users className="h-4 w-4 mr-2" />}
                    {demo.type === 'patient.create' && <Users className="h-4 w-4 mr-2" />}
                    {demo.type === 'notes.search' && <FileText className="h-4 w-4 mr-2" />}
                    {demo.type === 'ai_cache.search' && <Database className="h-4 w-4 mr-2" />}
                    {demo.label}
                  </Button>
                ))}
              </div>
              
              <div className="text-sm text-gray-500 space-y-1">
                <div className="font-medium">Supported Query Types:</div>
                <div>• <code>collection.getById</code> - Find by ID</div>
                <div>• <code>collection.search/find</code> - Search with filters</div>
                <div>• <code>collection.create</code> - Insert new document</div>
                <div>• <code>collection.update</code> - Update document</div>
                <div>• <code>collection.delete</code> - Delete document</div>
                <div>• <code>raw</code> - Execute raw database operations</div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success & Results */}
          {result !== null && !error && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Query executed successfully! Results shown below.
              </AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          {result !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Query Results
                  <Badge variant="secondary">
                    {Array.isArray(result) ? `${result.length} items` : 'Single result'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Architecture Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-2">🎯 How This Works</div>
                <div className="text-blue-800 space-y-1">
                  <div>1. Your query goes to the <strong>DataSourceManager</strong></div>
                  <div>2. It routes to the <strong>active data source</strong> (MongoDB Memory or Atlas)</div>
                  <div>3. The data source executes the query and transforms results to <strong>canonical domain models</strong></div>
                  <div>4. Results flow back through the unified interface</div>
                </div>
                <div className="mt-2 text-blue-700">
                  ✨ This means you can switch between MongoDB Memory and Atlas without changing your application code!
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
