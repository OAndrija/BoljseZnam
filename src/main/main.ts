import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

import { readFile } from 'node:fs/promises';
import fs from 'node:fs';
import type { ProblemData, SubjectID } from '../shared/types';

const DATA_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'data')
  : path.join(app.getAppPath(), 'data');

const PROBLEMS_PATH = path.join(DATA_PATH, 'problems');
const RESOURCES_PATH = path.join(DATA_PATH, 'resources');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.handle("app:get-info", () => {
  return {
    version: app.getVersion(),
  };
});

ipcMain.handle("problem:get-data", async (event, subject: string, year: number, id: number) => {
  const filename = `${subject}-${year}-${id}.json`;
  const filepath = path.join(PROBLEMS_PATH, filename);

  if (fs.existsSync(filepath) === false) {
    throw new Error(`Problem data file not found: ${filepath}`);
  }

  const contenets = await readFile(filepath, { encoding: "utf-8" });
  const data: ProblemData = JSON.parse(contenets);

  // skipping validation
  return data;  
});
