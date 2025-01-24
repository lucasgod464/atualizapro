const { app, BrowserWindow, ipcMain, dialog } = require('electron');
    const path = require('path');
    const { exec } = require('child_process');
    const fs = require('fs');

    let mainWindow;

    function createWindow() {
        mainWindow = new BrowserWindow({
            width: 900,
            height: 700,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        mainWindow.loadFile('src/index.html');
    }

    app.whenReady().then(createWindow);

    // Abrir diálogo para selecionar pasta
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        return result.filePaths[0];
    });

    // Enviar pasta para VPS
    ipcMain.on('upload-folder', async (event, { folderPath, server }) => {
        const { host, user, password } = server;
        
        // Criar arquivo temporário para senha
        const tempPasswordFile = path.join(app.getPath('temp'), 'ssh-pass.tmp');
        fs.writeFileSync(tempPasswordFile, password, { mode: 0o600 });

        const command = `sshpass -f "${tempPasswordFile}" rsync -avz --progress -e "ssh -o StrictHostKeyChecking=no" "${folderPath}/" "${user}@${host}:/root/upload/"`;

        const process = exec(command);

        process.stdout.on('data', (data) => {
            event.reply('upload-progress', data.toString());
        });

        process.stderr.on('data', (data) => {
            event.reply('upload-error', data.toString());
        });

        process.on('close', (code) => {
            fs.unlinkSync(tempPasswordFile); // Remove arquivo temporário
            event.reply('upload-complete', code === 0);
        });
    });
