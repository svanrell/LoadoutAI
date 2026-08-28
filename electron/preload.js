const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  toggleMode: () => ipcRenderer.invoke("toggle-mode"),
  isElectron: true,
});