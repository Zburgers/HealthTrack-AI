"use strict";
/**
 * DataSourceManager - Central Orchestrator for Clara's Switchboard Architecture
 *
 * This singleton class manages all data sources, handles the active connection,
 * and provides the unified entry point for all data operations in HealthTrackAI.
 *
 * Key Responsibilities:
 * - Register and manage IDataSource implementations
 * - Handle active data source lifecycle
 * - Route executeQuery calls to the active source
 * - Broadcast status changes via IPC events
 * - Provide observability and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataSourceManager = exports.DataSourceManager = void 0;
const events_1 = require("events");
const electron_1 = require("electron");
/**
 * Central manager for all data sources in the application
 */
class DataSourceManager extends events_1.EventEmitter {
    /**
     * Singleton accessor
     */
    static getInstance() {
        if (!DataSourceManager.instance) {
            DataSourceManager.instance = new DataSourceManager();
        }
        return DataSourceManager.instance;
    }
    constructor() {
        super();
        // Registry of available data sources
        this.dataSources = new Map();
        // Currently active data source
        this.activeSource = null;
        // Manager state
        this.initialized = false;
        this.setupIPCHandlers();
    }
    /**
     * Initialize the manager and set up IPC communication
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        console.log('🎯 [DATA_SOURCE_MANAGER] Initializing Switchboard Architecture...');
        // Initialize all registered data sources
        for (const [id, source] of this.dataSources) {
            try {
                console.log(`🔧 [DATA_SOURCE_MANAGER] Initializing data source: ${id}`);
                await source.initialize();
                console.log(`✅ [DATA_SOURCE_MANAGER] Data source ${id} initialized successfully`);
            }
            catch (error) {
                console.error(`❌ [DATA_SOURCE_MANAGER] Failed to initialize data source ${id}:`, error);
                source.status = 'error';
                source.error = error;
            }
        }
        this.initialized = true;
        console.log('✅ [DATA_SOURCE_MANAGER] Switchboard Architecture initialized successfully');
    }
    /**
     * Register a new data source implementation
     */
    registerDataSource(source) {
        if (this.dataSources.has(source.id)) {
            throw new Error(`Data source with ID '${source.id}' is already registered`);
        }
        console.log(`📝 [DATA_SOURCE_MANAGER] Registering data source: ${source.id} (${source.name})`);
        this.dataSources.set(source.id, source);
        // Listen for status changes and broadcast them
        this.setupSourceEventListeners(source);
    }
    /**
     * Get all available data sources
     */
    getAvailableSources() {
        return Array.from(this.dataSources.values()).map(source => ({
            id: source.id,
            name: source.name,
            description: source.description,
            status: source.status
        }));
    }
    /**
     * Connect to a specific data source
     */
    async connectToSource(sourceId, config) {
        const source = this.dataSources.get(sourceId);
        if (!source) {
            throw new Error(`Data source '${sourceId}' not found`);
        }
        console.log(`🔌 [DATA_SOURCE_MANAGER] Connecting to data source: ${sourceId}`);
        try {
            // Disconnect current source if any
            if (this.activeSource && this.activeSource !== source) {
                await this.disconnectActiveSource();
            }
            // Connect to new source
            await source.connect(config);
            this.activeSource = source;
            console.log(`✅ [DATA_SOURCE_MANAGER] Successfully connected to: ${sourceId}`);
            this.broadcastStatusChange(source, 'disconnected', 'connected');
        }
        catch (error) {
            console.error(`❌ [DATA_SOURCE_MANAGER] Failed to connect to ${sourceId}:`, error);
            source.status = 'error';
            source.error = error;
            this.broadcastStatusChange(source, 'connecting', 'error');
            throw error;
        }
    }
    /**
     * Disconnect from the currently active data source
     */
    async disconnectActiveSource() {
        if (!this.activeSource) {
            console.log('ℹ️ [DATA_SOURCE_MANAGER] No active source to disconnect');
            return;
        }
        const source = this.activeSource;
        console.log(`🔌 [DATA_SOURCE_MANAGER] Disconnecting from: ${source.id}`);
        try {
            await source.disconnect();
            this.activeSource = null;
            console.log(`✅ [DATA_SOURCE_MANAGER] Disconnected from: ${source.id}`);
            this.broadcastStatusChange(source, 'connected', 'disconnected');
        }
        catch (error) {
            console.error(`❌ [DATA_SOURCE_MANAGER] Error disconnecting from ${source.id}:`, error);
            source.status = 'error';
            source.error = error;
            throw error;
        }
    }
    /**
     * Execute a query on the active data source
     */
    async executeActiveSourceQuery(query) {
        if (!this.activeSource) {
            throw new Error('No active data source. Please connect to a data source first.');
        }
        if (this.activeSource.status !== 'connected') {
            throw new Error(`Active data source (${this.activeSource.id}) is not connected. Status: ${this.activeSource.status}`);
        }
        console.log(`🎯 [DATA_SOURCE_MANAGER] Executing query type '${query.type}' on ${this.activeSource.id}`);
        try {
            const startTime = Date.now();
            const result = await this.activeSource.executeQuery(query);
            const executionTime = Date.now() - startTime;
            console.log(`✅ [DATA_SOURCE_MANAGER] Query executed successfully in ${executionTime}ms`);
            return result;
        }
        catch (error) {
            console.error(`❌ [DATA_SOURCE_MANAGER] Query execution failed:`, error);
            throw error;
        }
    }
    /**
     * Get status of active data source
     */
    getActiveSourceStatus() {
        if (!this.activeSource) {
            return { sourceId: null, status: null, error: null };
        }
        return {
            sourceId: this.activeSource.id,
            status: this.activeSource.status,
            error: this.activeSource.error
        };
    }
    /**
     * Get connection info for active source
     */
    async getActiveSourceConnectionInfo() {
        if (!this.activeSource) {
            return null;
        }
        try {
            return await this.activeSource.getConnectionInfo();
        }
        catch (error) {
            console.error(`❌ [DATA_SOURCE_MANAGER] Failed to get connection info:`, error);
            return null;
        }
    }
    /**
     * 🎯 Enhanced Connect with Auto-Init Support
     * Supports connecting with specific purposes (e.g., case-embeddings)
     */
    async connectDataSource(sourceId, config = {}) {
        const source = this.dataSources.get(sourceId);
        if (!source) {
            throw new Error(`Data source '${sourceId}' not found`);
        }
        const purpose = config.purpose || 'user-data';
        console.log(`🔌 [DATA_SOURCE_MANAGER] Connecting to ${sourceId} for purpose: ${purpose}`);
        try {
            // Enhanced config for specific purposes
            const enhancedConfig = {
                ...config,
                timestamp: Date.now(),
                purpose,
                autoConnect: config.autoConnect || false
            };
            // For auto-connect case embeddings, don't disconnect user database
            if (config.autoConnect && purpose === 'case-embeddings') {
                console.log('🎯 [DATA_SOURCE_MANAGER] Auto-connecting case embeddings (keeping user DB active)');
                await source.connect(enhancedConfig);
                this.broadcastStatusChange(source, 'disconnected', 'connected');
                return;
            }
            // For user databases, disconnect current source if different
            if (this.activeSource && this.activeSource !== source && purpose !== 'case-embeddings') {
                await this.disconnectActiveSource();
            }
            await source.connect(enhancedConfig);
            // Set as active source only for user databases
            if (purpose !== 'case-embeddings') {
                this.activeSource = source;
            }
            console.log(`✅ [DATA_SOURCE_MANAGER] Successfully connected to: ${sourceId} (${purpose})`);
            this.broadcastStatusChange(source, 'disconnected', 'connected');
        }
        catch (error) {
            console.error(`❌ [DATA_SOURCE_MANAGER] Failed to connect to ${sourceId}:`, error);
            source.status = 'error';
            source.error = error;
            this.broadcastStatusChange(source, 'connecting', 'error');
            throw error;
        }
    }
    /**
     * 🎯 Get connection info for all sources
     */
    getConnectionInfo() {
        return Array.from(this.dataSources.values()).map(source => ({
            id: source.id,
            name: source.name,
            status: source.status,
            config: source.config,
            purpose: source.config?.purpose,
            isActive: source === this.activeSource
        }));
    }
    /**
     * 🎯 Get active data source status
     */
    getActiveStatus() {
        if (!this.activeSource) {
            return { sourceId: null, name: null, status: null };
        }
        return {
            sourceId: this.activeSource.id,
            name: this.activeSource.name,
            status: this.activeSource.status,
            purpose: this.activeSource.config?.purpose
        };
    }
    /**
     * Set up event listeners for a data source
     */
    setupSourceEventListeners(source) {
        // Note: Individual sources would emit events, we'd listen and rebroadcast
        // This is a placeholder for future event-driven architecture
    }
    /**
     * Broadcast status changes to renderer processes via IPC
     */
    broadcastStatusChange(source, previousStatus, newStatus) {
        const event = {
            sourceId: source.id,
            previousStatus,
            newStatus,
            error: source.error || undefined,
            timestamp: new Date()
        };
        console.log(`📡 [DATA_SOURCE_MANAGER] Broadcasting status change: ${source.id} ${previousStatus} → ${newStatus}`);
        // Broadcast to all renderer processes
        try {
            electron_1.ipcMain.emit('data-source:status-update', event);
        }
        catch (error) {
            console.error('❌ [DATA_SOURCE_MANAGER] Failed to broadcast status change:', error);
        }
    }
    /**
     * Set up IPC handlers for renderer communication
     */
    setupIPCHandlers() {
        // Check if handlers are already registered to prevent duplicates
        const isHandlerRegistered = (channel) => {
            return electron_1.ipcMain._events && electron_1.ipcMain._events[channel];
        };
        // Only register if not already done
        // Central query handler - all data operations flow through here
        if (!isHandlerRegistered('data:query')) {
            electron_1.ipcMain.handle('data:query', async (event, query) => {
                try {
                    return await this.executeActiveSourceQuery(query);
                }
                catch (error) {
                    console.error('❌ [DATA_SOURCE_MANAGER] IPC query failed:', error);
                    throw error;
                }
            });
        }
        // Data source management handlers - check each one to avoid duplicates
        if (!isHandlerRegistered('data-source:get-available')) {
            electron_1.ipcMain.handle('data-source:get-available', async () => {
                return this.getAvailableSources();
            });
        }
        if (!isHandlerRegistered('data-source:connect')) {
            electron_1.ipcMain.handle('data-source:connect', async (event, sourceId, config) => {
                return await this.connectDataSource(sourceId, config);
            });
        }
        if (!isHandlerRegistered('data-source:disconnect')) {
            electron_1.ipcMain.handle('data-source:disconnect', async () => {
                return await this.disconnectActiveSource();
            });
        }
        if (!isHandlerRegistered('data-source:get-active-status')) {
            electron_1.ipcMain.handle('data-source:get-active-status', async () => {
                return this.getActiveStatus();
            });
        }
        if (!isHandlerRegistered('data-source:get-connection-info')) {
            electron_1.ipcMain.handle('data-source:get-connection-info', async () => {
                return this.getConnectionInfo();
            });
        }
        if (!isHandlerRegistered('data-source:get-active-connection-info')) {
            electron_1.ipcMain.handle('data-source:get-active-connection-info', async () => {
                return await this.getActiveSourceConnectionInfo();
            });
        }
        console.log('🔧 [DATA_SOURCE_MANAGER] IPC handlers registered');
    }
}
exports.DataSourceManager = DataSourceManager;
DataSourceManager.instance = null;
// Export singleton instance getter
const getDataSourceManager = () => {
    return DataSourceManager.getInstance();
};
exports.getDataSourceManager = getDataSourceManager;
//# sourceMappingURL=DataSourceManager.js.map