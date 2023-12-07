const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openBestand: () => ipcRenderer.invoke('dialog:openBestand'),
    nieuwBestand: () => ipcRenderer.invoke('dialog:nieuwBestand'),
    saveBestand: (inhoud, padNaarBestand) => ipcRenderer.invoke('dialog:saveBestand', inhoud, padNaarBestand),
    openExtraBestand: (naamBestand) => ipcRenderer.invoke('openExtraBestand', naamBestand),
    onSoundtrackAdded: (callback) => ipcRenderer.on('soundtrack-added', (_event, naamBestand) => callback(naamBestand)),
    devMode: () => process.env.IS_ELECTRON,
    refreshRate: () => ipcRenderer.invoke('screen:refreshRate')
});
