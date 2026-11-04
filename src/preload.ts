// oxlint-disable eslint-plugin-unicorn/no-empty-file
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './shared/types';

const api: ElectronAPI = {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  getProblemData: (subject, year, id) =>
    ipcRenderer.invoke('problem:get-data', subject, year, id),
  listProblems: () => ipcRenderer.invoke('problems:list'),
  listCategories: () => ipcRenderer.invoke('categories:list'),
  loadProgress: () => ipcRenderer.invoke('progress:load'),
  saveHistory: (entry) => ipcRenderer.invoke('history:save', entry),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  saveDraft: (draft) => ipcRenderer.invoke('draft:save', draft),
  deleteDraft: (key) => ipcRenderer.invoke('draft:delete', key),
};

contextBridge.exposeInMainWorld('api', api);
