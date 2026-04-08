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
  FileText,
  ChevronDown,
  ChevronRight,
  Copy,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QueryTesterPanel: React.FC = () => {
  const { toast } = useToast();
  
  const [queryType, setQueryType] = useState('patients.find');
  const [queryParams, setQueryParams] = useState('{}');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

  /**
   * Execute a query using the Switchboard
   */
  const executeQuery = async () => {
    if (!isElectron) {
      setError('Query tester is only available in Electron desktop app');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`🔍 [QUERY_TESTER] Executing query: ${queryType}`);
      
      // Parse the parameters
      let params = {};
      if (queryParams.trim()) {
        try {
          params = JSON.parse(queryParams);
        } catch (parseError) {
          throw new Error('Invalid JSON in parameters field');
        }
      }

      // Execute query through Switchboard
      const queryResult = await (window as any).electronAPI.dataSource.query({
        type: queryType,
        params: params
      });

      setResult(queryResult);
      console.log(`✅ [QUERY_TESTER] Query executed successfully`);
      
      toast({
        title: "Query Successful",
        description: `Query executed successfully`,
        variant: "default",
      });

    } catch (error: any) {
      console.error('❌ [QUERY_TESTER] Query execution failed:', error);
      setError(error.message || 'Query execution failed');
      
      toast({
        title: "Query Failed",
        description: error.message || 'Query execution failed',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Pretty print JSON
   */
  const prettyPrintParams = () => {
    try {
      const parsed = JSON.parse(queryParams);
      setQueryParams(JSON.stringify(parsed, null, 2));
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Cannot format invalid JSON",
        variant: "destructive",
      });
    }
  };

  /**
   * Copy result to clipboard
   */
  const copyResult = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        toast({
          title: "Copied",
          description: "Result copied to clipboard",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  /**
   * Reset the form
   */
  const resetForm = () => {
    setQueryType('patients.find');
    setQueryParams('{}');
    setResult(null);
    setError(null);
  };

  // Sample queries for quick access
  const sampleQueries = [
    {
      name: 'Find All Patients',
      type: 'patients.find',
      params: '{}'
    },
    {
      name: 'Find Patient by ID',
      type: 'patients.findOne',
      params: '{"_id": "patient_id_here"}'
    },
    {
      name: 'Count Patients',
      type: 'patients.count',
      params: '{}'
    },
    {
      name: 'Find Recent Encounters',
      type: 'encounters.find',
      params: '{"date": {"$gte": "2024-01-01"}}'
    }
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <CardTitle className="text-lg">Database Query Tester</CardTitle>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
        <CardDescription>
          Test database queries directly through Clara's Switchboard Architecture
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {!isElectron ? (
            <Alert>
              <AlertDescription>
                The Query Tester is only available in the Electron desktop application.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Sample Queries */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Quick Samples</Label>
                <div className="flex flex-wrap gap-2">
                  {sampleQueries.map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQueryType(sample.type);
                        setQueryParams(sample.params);
                      }}
                    >
                      {sample.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Query Type Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="queryType" className="text-sm font-medium">
                    Query Type
                  </Label>
                  <Input
                    id="queryType"
                    type="text"
                    placeholder="e.g., patients.find, encounters.count"
                    value={queryType}
                    onChange={(e) => setQueryType(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: collection.operation (e.g., patients.find)
                  </p>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={executeQuery}
                    disabled={isLoading || !queryType}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Execute Query
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Query Parameters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="queryParams" className="text-sm font-medium">
                    Parameters (JSON)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prettyPrintParams}
                  >
                    Format JSON
                  </Button>
                </div>
                <Textarea
                  id="queryParams"
                  placeholder='{"key": "value"}'
                  value={queryParams}
                  onChange={(e) => setQueryParams(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter query parameters as valid JSON. Leave empty {} for no parameters.
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Display */}
              {result && !error && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Query executed successfully. Results shown below.
                  </AlertDescription>
                </Alert>
              )}

              {/* Results Display */}
              {result && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Results</Label>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {Array.isArray(result) ? `${result.length} records` : 'Single result'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={copyResult}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Query Examples */}
              <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
                <strong>Examples:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code>patients.find</code> with <code>{'{}'}</code> - Find all patients</li>
                  <li><code>patients.findOne</code> with <code>{'{"_id": "123"}'}</code> - Find specific patient</li>
                  <li><code>encounters.count</code> with <code>{'{}'}</code> - Count all encounters</li>
                  <li><code>appointments.find</code> with <code>{'{"status": "scheduled"}'}</code> - Find scheduled appointments</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default QueryTesterPanel;
