/**
 * Electron Preload Script
 * Exposes safe APIs to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Exposed API for renderer
const studioAPI = {
  // Platform info
  platform: process.platform,
  
  // File operations
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  saveFile: (data: unknown) => ipcRenderer.invoke('dialog:saveFile', data),
  
  // Extension operations
  loadExtension: (path: string) => ipcRenderer.invoke('extension:load', path),
  saveExtension: (data: unknown) => ipcRenderer.invoke('extension:save', data),
  validateManifest: (manifest: unknown) => ipcRenderer.invoke('extension:validateManifest', manifest),
  
  // Cloud operations
  uploadResource: (file: unknown) => ipcRenderer.invoke('cloud:uploadResource', file),
  
  // Package operations
  buildPackage: (data: unknown) => ipcRenderer.invoke('package:build', data),
  
  // Events
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
};

// Expose API to renderer
contextBridge.exposeInMainWorld('studioAPI', studioAPI);

// Type declaration for TypeScript
export type StudioAPI = typeof studioAPI;
