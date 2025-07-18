"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.ipcMain.handle('db:checkStatus', async () => {
    return { ok: true }; // placeholder until DataSourceManager wires in
});
/*

    TODO: INTEGRATE INTO DATASOURCE MANAGER

    */
//# sourceMappingURL=db-check-status.js.map