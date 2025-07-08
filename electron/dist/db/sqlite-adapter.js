"use strict";
/**
 * @deprecated This file is no longer used.
 * The SQLite adapter implementation has been moved to electron/ipc/database-handlers.ts
 * to avoid circular dependencies and simplify the architecture.
 *
 * All database operations are now handled through IPC in the main process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSQLiteHandlers = void 0;
// Re-export the working adapter from database-handlers for any legacy imports
var database_handlers_1 = require("../ipc/database-handlers");
Object.defineProperty(exports, "setupSQLiteHandlers", { enumerable: true, get: function () { return database_handlers_1.setupDatabaseIpcHandlers; } });
//# sourceMappingURL=sqlite-adapter.js.map