const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs/promises');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const maakWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 950,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Open the DevTools if it's in dev mode.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.webContents.openDevTools();
    }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // De Electron API configureren
    ipcMain.handle('dialog:openBestand', handleOpenBestand);
    ipcMain.handle('dialog:nieuwBestand', handleNieuwBestand);
    ipcMain.handle('dialog:saveBestand', (event, inhoud, padNaarBestand) => handleSaveBestand(inhoud, padNaarBestand));
    ipcMain.handle('screen:refreshRate', handleRefreshRate)
    maakWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        maakWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const mapNaamOrbShow = 'Orb Show'

const handleOpenBestand = async () => {
    const padNaarDocumenten = app.getPath('documents');
    const standaardPad = path.join(path.dirname(padNaarDocumenten), path.basename(padNaarDocumenten), mapNaamOrbShow);
    await fs.mkdir(standaardPad, { recursive: true });

    // De gebruiker een bestand vragen, en daarna het gekozen pad onthouden
    const padNaarBestand = (await dialog.showOpenDialog({
        defaultPath: standaardPad,
        properties: ['openFile'],
        filters: [
            { name: 'OBSW file', extensions: ['obsw'] }
        ]
    })).filePaths[0];

    // De inhoud van het bestand ophalen
    try {
        // Het bestand uitlezen
        const data = await fs.readFile(padNaarBestand, 'utf8');

        return [ 'success', data, padNaarBestand ];
    }
    catch (error) {
        return [ 'error', error, null ];
    }
};

const handleNieuwBestand = async () => {
    const padNaarDocumenten = app.getPath('documents');
    const standaardPad = path.join(path.dirname(padNaarDocumenten), path.basename(padNaarDocumenten), mapNaamOrbShow);
    await fs.mkdir(standaardPad, { recursive: true });

    // De gebruiker het pad vragen, en daarna het pad updaten
    const padNaarBestand = (await dialog.showSaveDialog({
        defaultPath: standaardPad,
        properties: ['createDirectory'],
        filters: [
            { name: 'OBSW file', extensions: ['obsw'] }
        ]
    })).filePath;

    /*
        Een map maken om het OBSW bestand in te bewaren,
        zodat alle andere nodige bestanden zoals: "audio" meegenomen worden
    */
    const project = path.parse(padNaarBestand)
    const projectNaam = project.name;
    const projectDirectory = project.dir
    const padNaarProject = path.join(path.dirname(projectDirectory), path.basename(projectDirectory), projectNaam);
    const padNaarBestandInProject = path.join(path.dirname(padNaarBestand), projectNaam, path.basename(padNaarBestand));
    await fs.mkdir(padNaarProject, { recursive: true });

    // het bestand aanmaken, en op de juiste plek zetten
    const standaardFormaat = '<?xml version="1.0" encoding="UTF-8"?><orbShow><stage><effects></effects></stage></orbShow>';
    try {
        // Het bestand aanmaken, en de standaard voor XML toepassen
        await fs.writeFile(padNaarBestandInProject, standaardFormaat);

        return [ 'success', standaardFormaat, padNaarBestandInProject ];
    }
    catch (error) {
        console.log(error)
        return [ 'error', error, null ];
    }
};

const handleSaveBestand = async (inhoud, padNaarBestand) => {
    try {
        // Het bestand vervangen, en de inhoud bewerken
        await fs.writeFile(padNaarBestand, inhoud);

        return [ 'success', inhoud, padNaarBestand ];
    }
    catch (error) {
        return [ 'error', error, null ];
    }
};

const handleRefreshRate = () => {
    const scherm = screen.getPrimaryDisplay();
    const refreshRate = scherm.displayFrequency;
    return refreshRate;
}
