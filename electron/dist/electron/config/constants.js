"use strict";
/**
 * Electron Main Process - Shared Constants
 *
 * This file contains constants shared within the Electron main process,
 * duplicating values from the web-facing config to avoid pathing issues
 * with TypeScript's rootDir constraint.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONGODB_CONFIG = exports.DATABASE_NAMES = void 0;
exports.DATABASE_NAMES = {
    LOCAL: 'healthtrack_local',
    REMOTE: 'healthtrack_remote',
};
exports.MONGODB_CONFIG = {
    LOCAL_PORT: 27017,
    LOCAL_OPTIONS: {},
};
//# sourceMappingURL=constants.js.map