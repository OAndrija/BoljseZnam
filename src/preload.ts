// oxlint-disable eslint-plugin-unicorn/no-empty-file
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import type { ElectronAPI } from "./shared/types";

const api: ElectronAPI = {
    getAppInfo: () => ipcRenderer.invoke("app:get-info"),
};

contextBridge.exposeInMainWorld("api", api);