"use strict";
/**
 * DataSourceManager - Central Orchestrator for Clara's Switchboard Architecture
 * * This singleton class manages all data sources, handles the active connection,
 * and provides the unified entry point for all data operations in HealthTrackAI.
 * * Key Responsibilities:
 * - Register and manage IDataSource implementations
 * - Handle active data source lifecycle
 * - Route executeQuery calls to the active source
 * - Broadcast status changes via IPC events
 * - Provide observability and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataSourceManager = exports.DataSourceManager = void 0;
const events_1 = require("events");
const electron_1 = require("electron"); // FIX: Added BrowserWindow for correct IPC broadcasting
const DataSourceManagerLogger_1 = require("./logging/DataSourceManagerLogger");
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
        this.logger = (0, DataSourceManagerLogger_1.getGlobalDataSourceLogger)();
        this.logger.logDataSourceEvent('switchboard', 'register', {
            message: 'Switchboard Architecture initializing...'
        });
        this.setupIPCHandlers();
    }
    /**
     * Initialize the manager and set up IPC communication
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        const startTime = Date.now();
        console.log('🎯 [DATA_SOURCE_MANAGER] Initializing Switchboard Architecture...');
        this.logger.logDataSourceEvent('switchboard', 'connect', {
            operation: 'initialize',
            timestamp: new Date().toISOString()
        });
        // Initialize all registered data sources
        for (const [id, source] of this.dataSources) {
            try {
                console.log(`🔧 [DATA_SOURCE_MANAGER] Initializing data source: ${id}`);
                this.logger.logDataSourceEvent(id, 'connect', {
                    operation: 'initialize',
                    source_name: source.name
                });
                await source.initialize();
                console.log(`✅ [DATA_SOURCE_MANAGER] Data source ${id} initialized successfully`);
                this.logger.logDataSourceEvent(id, 'connect', {
                    operation: 'initialize_success',
                    source_name: source.name
                });
            }
            catch (error) {
                console.error(`❌ [DATA_SOURCE_MANAGER] Failed to initialize data source ${id}:`, error);
                this.logger.logError(error, `DataSourceManager.initialize[${id}]`, {
                    source_id: id,
                    source_name: source.name,
                    operation: 'initialize'
                });
                source.status = 'error';
                source.error = error;
            }
        }
        const duration = Date.now() - startTime;
        this.initialized = true;
        console.log('✅ [DATA_SOURCE_MANAGER] Switchboard Architecture initialized successfully');
        this.logger.logPerformance('switchboard_initialization', duration, {
            sources_count: this.dataSources.size,
            success: true
        });
    }
    /**
     * Register a new data source implementation
     */
    registerDataSource(source) {
        if (this.dataSources.has(source.id)) {
            const error = new Error(`Data source with ID '${source.id}' is already registered`);
            this.logger.logError(error, 'DataSourceManager.registerDataSource', {
                source_id: source.id,
                source_name: source.name
            });
            throw error;
        }
        console.log(`📝 [DATA_SOURCE_MANAGER] Registering data source: ${source.id} (${source.name})`);
        this.logger.logDataSourceEvent(source.id, 'register', {
            source_name: source.name,
            description: source.description,
            initial_status: source.status
        });
        this.dataSources.set(source.id, source);
        // Listen for status changes and broadcast them
        this.setupSourceEventListeners(source);
    } // FIX: Removed duplicated closing brace and repeated code block.
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
            const error = new Error(`Data source '${sourceId}' not found`);
            this.logger.logError(error, 'DataSourceManager.connectToSource', {
                requested_source_id: sourceId,
                available_sources: Array.from(this.dataSources.keys())
            });
            throw error;
        }
        const startTime = Date.now();
        console.log(`🔌 [DATA_SOURCE_MANAGER] Connecting to data source: ${sourceId}`);
        this.logger.logConnection('connect', sourceId, {
            source_name: source.name,
            config_provided: !!config,
            previous_status: source.status
        });
        // Disconnect current source if any. Let it throw if it fails.
        // The disconnectActiveSource method will handle its own error state.
        if (this.activeSource && this.activeSource !== source) {
            this.logger.logConnection('disconnect', this.activeSource.id, {
                reason: 'switching_to_new_source',
                new_source: sourceId
            });
            await this.disconnectActiveSource();
        }
        // FIX: Wrapped connection logic in its own try/catch to correctly attribute errors.
        // This prevents a failure in disconnecting an old source from incorrectly marking
        // the new source as being in an error state.
        try {
            // Connect to new source
            await source.connect(config);
            this.activeSource = source;
            const duration = Date.now() - startTime;
            console.log(`✅ [DATA_SOURCE_MANAGER] Successfully connected to: ${sourceId}`);
            this.logger.logConnection('connect', sourceId, {
                source_name: source.name,
                success: true,
                duration,
                new_status: source.status
            });
            this.logger.logPerformance(`connection_${sourceId}`, duration, {
                source_name: source.name,
                success: true
            });
            this.broadcastStatusChange(source, 'disconnected', 'connected');
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ [DATA_SOURCE_MANAGER] Failed to connect to ${sourceId}:`, error);
            this.logger.logError(error, `DataSourceManager.connectToSource[${sourceId}]`, {
                source_id: sourceId,
                source_name: source.name,
                duration,
                config_provided: !!config
            });
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
            this.logger.logConnection('disconnect', 'none', {
                reason: 'no_active_source'
            });
            return;
        }
        const source = this.activeSource;
        const startTime = Date.now();
        console.log(`🔌 [DATA_SOURCE_MANAGER] Disconnecting from: ${source.id}`);
        this.logger.logConnection('disconnect', source.id, {
            source_name: source.name,
            previous_status: source.status
        });
        try {
            await source.disconnect();
            this.activeSource = null;
            const duration = Date.now() - startTime;
            console.log(`✅ [DATA_SOURCE_MANAGER] Disconnected from: ${source.id}`);
            this.logger.logConnection('disconnect', source.id, {
                source_name: source.name,
                success: true,
                duration
            });
            this.logger.logPerformance(`disconnection_${source.id}`, duration, {
                source_name: source.name,
                success: true
            });
            this.broadcastStatusChange(source, 'connected', 'disconnected');
        }
        catch (error) {
            console.error(`❌ [DATA_SOURCE_MANAGER] Error disconnecting from ${source.id}:`, error);
            this.logger.logError(error, `DataSourceManager.disconnectActiveSource[${source.id}]`, {
                source_id: source.id,
                source_name: source.name
            });
            source.status = 'error';
            source.error = error;
            // Note: activeSource is not cleared on failure, so its error state can be inspected.
            throw error;
        }
    }
    /**
     * Execute a query on the active data source
     */
    async executeActiveSourceQuery(query) {
        if (!this.activeSource) {
            const error = new Error('No active data source. Please connect to a data source first.');
            this.logger.logError(error, 'DataSourceManager.executeActiveSourceQuery', {
                query_type: query.type,
                has_active_source: false
            });
            throw error;
        }
        if (this.activeSource.status !== 'connected') {
            const error = new Error(`Active data source (${this.activeSource.id}) is not connected. Status: ${this.activeSource.status}`);
            this.logger.logError(error, 'DataSourceManager.executeActiveSourceQuery', {
                source_id: this.activeSource.id,
                source_status: this.activeSource.status,
                query_type: query.type
            });
            throw error;
        }
        console.log(`🎯 [DATA_SOURCE_MANAGER] Executing query type '${query.type}' on ${this.activeSource.id}`);
        // Parse query for better logging
        const [collection, operation] = query.type.split('.');
        this.logger.logQuery(query.type, collection || 'unknown', 0, // Duration will be updated after execution
        {
            source_id: this.activeSource.id,
            operation,
            params_present: !!query.params,
            raw_query: !!query.rawQuery
        });
        try {
            const startTime = Date.now();
            const result = await this.activeSource.executeQuery(query);
            const executionTime = Date.now() - startTime;
            console.log(`✅ [DATA_SOURCE_MANAGER] Query executed successfully in ${executionTime}ms`);
            // Log successful query execution
            this.logger.logQuery(query.type, collection || 'unknown', executionTime, {
                source_id: this.activeSource.id,
                operation,
                success: true,
                result_type: typeof result,
                has_data: !!result
            });
            // Log performance metrics
            this.logger.logPerformance(`query_${operation}`, executionTime, {
                source_id: this.activeSource.id,
                collection,
                query_type: query.type
            });
            return result;
        }
        catch (error) {
            console.error(`❌ [DATA_SOURCE_MANAGER] Query execution failed:`, error);
            this.logger.logError(error, `DataSourceManager.executeActiveSourceQuery[${query.type}]`, {
                source_id: this.activeSource.id,
                query_type: query.type,
                collection,
                operation
            });
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
        // FIX: Logic bug where a failing disconnect of a previous source would incorrectly
        // mark the new source as having an error. The logic is now separated.
        try {
            // For auto-connect case embeddings, don't disconnect user database
            if (config.autoConnect && purpose === 'case-embeddings') {
                console.log('🎯 [DATA_SOURCE_MANAGER] Auto-connecting case embeddings (keeping user DB active)');
                // Connect but do not set as active or disconnect previous
            }
            else if (this.activeSource && this.activeSource !== source && purpose !== 'case-embeddings') {
                // For user databases, disconnect current source if different. Let it throw on failure.
                await this.disconnectActiveSource();
            }
            const enhancedConfig = {
                ...config,
                timestamp: Date.now(),
                purpose,
                autoConnect: config.autoConnect || false
            };
            await source.connect(enhancedConfig);
            if (config.autoConnect && purpose === 'case-embeddings') {
                this.broadcastStatusChange(source, 'disconnected', 'connected');
                return;
            }
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
        // FIX: Use the correct method to broadcast to all renderer processes.
        // ipcMain.emit() only emits within the main process and does not send to renderers.
        // BrowserWindow.getAllWindows().forEach(...) is the correct way to do this.
        try {
            electron_1.BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send('data-source:status-update', event);
            });
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