import { ipcMain } from 'electron';

ipcMain.handle('db:checkStatus', async () => {
  return { ok: true }; // placeholder until DataSourceManager wires in
});

/*

    TODO: INTEGRATE INTO DATASOURCE MANAGER

    */
