/**
 * Error Reports Dashboard
 * 
 * Admin dashboard for viewing and managing error reports.
 * This component should only be accessible to authorized administrators.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Bug, 
  CheckCircle, 
  Clock, 
  Eye, 
  Filter,
  RefreshCw,
  Search,
  User,
  Calendar,
  MapPin,
  Smartphone,
  AlertCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';

interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    type: string;
    component?: string;
    route?: string;
  };
  user: {
    id?: string;
    email?: string;
    userAgent: string;
    sessionId: string;
  };
  app: {
    version: string;
    environment: string;
    buildId?: string;
  };
  context: {
    url: string;
    referrer: string;
    viewport: {
      width: number;
      height: number;
    };
    network?: {
      effectiveType?: string;
      downlink?: number;
    };
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  metadata?: Record<string, any>;
  resolved: boolean;
  assignedTo?: string;
  notes: Array<{
    text: string;
    author: string;
    timestamp: string;
  }>;
  fingerprint: string;
  occurrenceCount: number;
  lastOccurrence: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
}

interface ErrorStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  unresolved: number;
}

export default function ErrorReportsDashboard() {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorReport | null>(null);
  const [filters, setFilters] = useState({
    severity: '',
    resolved: '',
    component: '',
    search: '',
  });
  const [assigneeInput, setAssigneeInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchErrors();
  }, [filters]);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.resolved) params.set('resolved', filters.resolved);
      if (filters.component) params.set('component', filters.component);

      const response = await fetch(`/api/error-reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ERROR_REPORTING_ADMIN_API_KEY || process.env.NEXT_PUBLIC_ERROR_REPORTING_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch error reports: ${response.statusText}`);
      }

      const data = await response.json();
      setErrors(data.errors);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch error reports');
    } finally {
      setLoading(false);
    }
  };

  const updateErrorStatus = async (errorId: string, updates: {
    resolved?: boolean;
    assignedTo?: string;
    notes?: string;
  }) => {
    try {
      const response = await fetch('/api/error-reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ERROR_REPORTING_ADMIN_API_KEY || process.env.NEXT_PUBLIC_ERROR_REPORTING_API_KEY}`,
        },
        body: JSON.stringify({ id: errorId, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update error report');
      }

      toast({
        title: 'Error Updated',
        description: 'Error report has been updated successfully.',
      });

      fetchErrors(); // Refresh the list
    } catch (err) {
      toast({
        title: 'Update Failed',
        description: err instanceof Error ? err.message : 'Failed to update error report',
        variant: 'destructive',
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <Info className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  const filteredErrors = errors.filter(error => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        error.error.message.toLowerCase().includes(searchTerm) ||
        error.error.component?.toLowerCase().includes(searchTerm) ||
        error.user.email?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Reports Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage application errors</p>
        </div>
        <Button onClick={fetchErrors} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Bug className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-500">{stats.critical}</p>
                  <p className="text-sm text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-500">{stats.unresolved}</p>
                  <p className="text-sm text-muted-foreground">Unresolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search errors..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-64"
              />
            </div>
            <Select
              value={filters.severity}
              onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.resolved}
              onValueChange={(value) => setFilters(prev => ({ ...prev, resolved: value }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="true">Resolved</SelectItem>
                <SelectItem value="false">Unresolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Reports ({filteredErrors.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredErrors.map((error) => (
                <div
                  key={error.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                    selectedError?.id === error.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedError(error)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={`${getSeverityColor(error.severity)} text-white`}>
                          {getSeverityIcon(error.severity)}
                          <span className="ml-1 capitalize">{error.severity}</span>
                        </Badge>
                        {error.resolved && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                        {error.occurrenceCount > 1 && (
                          <Badge variant="secondary">
                            {error.occurrenceCount}x
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm truncate">{error.error.message}</h3>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span>{error.error.component || 'Unknown'}</span>
                        <span>{format(new Date(error.timestamp), 'MMM dd, HH:mm')}</span>
                        {error.user.email && <span>{error.user.email}</span>}
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground ml-2" />
                  </div>
                </div>
              ))}
              {filteredErrors.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No error reports found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Details */}
        <Card>
          <CardHeader>
            <CardTitle>Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedError ? (
              <div className="space-y-6">
                {/* Error Info */}
                <div>
                  <h4 className="font-semibold mb-2">Error Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Message:</strong> {selectedError.error.message}</div>
                    <div><strong>Type:</strong> {selectedError.error.type}</div>
                    <div><strong>Component:</strong> {selectedError.error.component || 'Unknown'}</div>
                    <div><strong>Route:</strong> {selectedError.error.route || 'Unknown'}</div>
                    <div><strong>Occurrences:</strong> {selectedError.occurrenceCount}</div>
                    {selectedError.isDuplicate && (
                      <div><strong>Duplicate of:</strong> {selectedError.duplicateOf}</div>
                    )}
                  </div>
                </div>

                {/* User Context */}
                <div>
                  <h4 className="font-semibold mb-2">User Context</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{selectedError.user.email || selectedError.user.id || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(selectedError.timestamp), 'PPpp')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>{selectedError.context.viewport.width}x{selectedError.context.viewport.height}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{selectedError.context.url}</span>
                    </div>
                  </div>
                </div>

                {/* Stack Trace */}
                {selectedError.error.stack && (
                  <div>
                    <h4 className="font-semibold mb-2">Stack Trace</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {selectedError.error.stack}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div>
                  <h4 className="font-semibold mb-2">Actions</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateErrorStatus(selectedError.id, { resolved: !selectedError.resolved })}
                        variant={selectedError.resolved ? "outline" : "default"}
                        size="sm"
                      >
                        {selectedError.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="Assign to..."
                        value={assigneeInput}
                        onChange={(e) => setAssigneeInput(e.target.value)}
                      />
                      <Button
                        onClick={() => {
                          if (assigneeInput.trim()) {
                            updateErrorStatus(selectedError.id, { assignedTo: assigneeInput.trim() });
                            setAssigneeInput('');
                          }
                        }}
                        variant="outline"
                        size="sm"
                        disabled={!assigneeInput.trim()}
                      >
                        Assign
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add notes..."
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                      />
                      <Button
                        onClick={() => {
                          if (notesInput.trim()) {
                            updateErrorStatus(selectedError.id, { notes: notesInput.trim() });
                            setNotesInput('');
                          }
                        }}
                        variant="outline"
                        size="sm"
                        disabled={!notesInput.trim()}
                      >
                        Add Note
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notes History */}
                {selectedError.notes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <div className="space-y-2">
                      {selectedError.notes.map((note, index) => (
                        <div key={index} className="bg-muted p-3 rounded text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{note.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.timestamp), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          <p>{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an error to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
