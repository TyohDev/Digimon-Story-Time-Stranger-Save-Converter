const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectZip: () => ipcRenderer.invoke('select-zip'),
  convert: (args) => ipcRenderer.invoke('convert', args)
});
