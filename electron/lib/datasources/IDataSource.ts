/**
 * IDataSource Interface - Core of Clara's Switchboard Architecture
 * 
 * This interface defines the contract that all data sources must implement
 * to be part of the unified, plug-and-play data management system.
 * 
 * Design Principles:
 * - Explicit: All connections require explicit user action
 * - Centralized: Managed by DataSourceManager singleton  
 * - Uniform: Same interface regardless of underlying technology
 * - Observable: Rich status information and error handling
 */

/**
 * Granular connection status states for enhanced observability
 */
export type ConnectionStatus = 
  | 'disconnected'          // No active connection
  | 'connecting'            // Initial connection attempt
  | 'connected'             // Successfully connected and ready
  | 'error'                 // Connection failed or lost
  | 'initializing_source'   // Loading drivers, preparing source
  | 'validating_config'     // Checking configuration validity
  | 'authenticating'        // Attempting authentication
  | 'connection_failed';    // Specific connection failure

/**
 * Unified query interface for all data operations
 */
export interface IQuery {
  type: string;                    // e.g., 'patient.getById', 'patient.search', 'encounter.create'
  params: Record<string, any>;     // Query parameters
  rawQuery?: any;                  // Escape hatch for DB-specific operations
}

/**
 * Main data source interface - all implementations must conform to this contract
 */
export interface IDataSource {
  // Identity
  readonly id: string;             // Unique identifier (e.g., 'mongodb-memory', 'mongodb-atlas')
  readonly name: string;           // Display name (e.g., 'Local MongoDB', 'MongoDB Atlas')
  readonly description?: string;   // Optional description for UI

  // State Management
  status: ConnectionStatus;        // Current connection status
  error: Error | null;            // Last error encountered
  config?: Record<string, any>;   // Current connection configuration
  
  // Lifecycle Methods
  initialize(): Promise<void>;                          // One-time setup (load drivers, etc.)
  connect(config: Record<string, any>): Promise<void>;  // Establish connection with config
  disconnect(): Promise<void>;                          // Close connection cleanly
  
  // Data Operations - Core of the unified interface
  executeQuery<T>(query: IQuery): Promise<T>;          // Execute any query, return canonical domain models
  
  // Health & Diagnostics
  ping(): Promise<boolean>;                            // Quick health check
  getConnectionInfo(): Promise<ConnectionInfo>;        // Detailed connection information
  
  // Configuration Schema (for dynamic UI generation)
  getCapabilities?(): DataSourceCapabilities;         // Optional: JSON schema for config UI
}

/**
 * Connection information for diagnostics and UI display
 */
export interface ConnectionInfo {
  isConnected: boolean;
  uri?: string;                    // Sanitized connection string
  database?: string;               // Database name
  serverInfo?: any;                // Server version, etc.
  lastConnected?: Date;            // When connection was established
  collections?: string[];          // Available collections
}

/**
 * Capabilities and configuration schema for dynamic UI
 */
export interface DataSourceCapabilities {
  configSchema: Record<string, any>;     // JSON Schema for connection config
  supportedOperations: string[];         // List of supported query types
  features: string[];                    // Special features (e.g., 'vector-search', 'full-text')
}

/**
 * Standard query result wrapper for consistent responses
 */
export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime?: number;
    source?: string;
    queryType?: string;
  };
}

/**
 * Event payload for status change notifications
 */
export interface StatusChangeEvent {
  sourceId: string;
  previousStatus: ConnectionStatus;
  newStatus: ConnectionStatus;
  error?: Error;
  timestamp: Date;
}
