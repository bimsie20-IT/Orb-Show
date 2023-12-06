const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fsSync = require('fs');
const fs = require('fs/promises');
const express = require('express');
const https = require('https');

// De REST API applicatie initialiseren
const expressApp = express();
expressApp.use(express.static('./src/VR_build'));

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
    ipcMain.handle('openExtraBestand', (event, naamBestand) => handleOpenExtraBestand(naamBestand));
    ipcMain.handle('screen:refreshRate', handleRefreshRate);
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
let padNaarBestand = ''

const handleOpenBestand = async () => {
    const padNaarDocumenten = app.getPath('documents');
    const standaardPad = path.join(path.dirname(padNaarDocumenten), path.basename(padNaarDocumenten), mapNaamOrbShow);
    await fs.mkdir(standaardPad, { recursive: true });

    try {
        // De gebruiker een bestand vragen, en daarna het gekozen pad onthouden
        padNaarBestand = (await dialog.showOpenDialog({
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

            return [ 'success', data ];
        }
        catch (error) {
            return [ 'error', error ];
        }
    }
    catch (error) {
        console.error(error)
    }
};

const handleNieuwBestand = async () => {
    const padNaarDocumenten = app.getPath('documents');
    const standaardPad = path.join(path.dirname(padNaarDocumenten), path.basename(padNaarDocumenten), mapNaamOrbShow);
    await fs.mkdir(standaardPad, { recursive: true });

    try {
        // De gebruiker het pad vragen, en daarna het pad updaten
        const padNaarNieuwBestand = (await dialog.showSaveDialog({
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
        const project = path.parse(padNaarNieuwBestand);
        const projectNaam = project.name;
        const projectDirectory = project.dir;
        const padNaarProject = path.join(path.dirname(projectDirectory), path.basename(projectDirectory), projectNaam);
        const padNaarBestandInProject = path.join(path.dirname(padNaarNieuwBestand), projectNaam, path.basename(padNaarNieuwBestand));
        padNaarBestand = padNaarBestandInProject;
        await fs.mkdir(padNaarProject, { recursive: true });

        // het bestand aanmaken, en op de juiste plek zetten
        const standaardFormaat = '<?xml version="1.0" encoding="UTF-8"?><orbShow><extraFiles></extraFiles><stage><effects></effects></stage></orbShow>';
        try {
            // Het bestand aanmaken, en de standaard voor XML toepassen
            await fs.writeFile(padNaarBestandInProject, standaardFormaat);

            return [ 'success', standaardFormaat ];
        }
        catch (error) {
            console.log(error)
            return [ 'error', error ];
        }
    }
    catch (error) {
        console.error(error)
    }
};

const handleSaveBestand = async (inhoud) => {
    try {
        // Het bestand vervangen, en de inhoud bewerken
        await fs.writeFile(padNaarBestand, inhoud);

        return [ 'success', inhoud ];
    }
    catch (error) {
        return [ 'error', error ];
    }
};

const handleOpenExtraBestand = async (naamBestand) => {
    const padBestand = path.join(path.dirname(padNaarBestand), naamBestand);

    try {
        // Het bestand vervangen, en de inhoud bewerken
        const data = await fs.readFile(padBestand);

        return [ 'success', data ];
    }
    catch (error) {
        return [ 'error', error ];
    }
}

const handleRefreshRate = () => {
    const scherm = screen.getPrimaryDisplay();
    const refreshRate = scherm.displayFrequency;
    return refreshRate;
}

/* Orb-VR-Show REST API */

expressApp.get('/api', async (req, res) => {
    const data = await fs.readFile(padNaarBestand, 'utf8');

    res.header('Content-Type', 'text/xml');
    res.send(data);
})

// De server starten
https.createServer({
    key: fsSync.readFileSync('./src/SSL-private_key.pem'),
    cert: fsSync.readFileSync('./src/SSL-certificate.pem')
}, expressApp).listen(4785);

/* ******************** */
