const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const lz4 = require('lz4');
const AdmZip = require('adm-zip');

const DSTS_KEY = Buffer.from('33393632373736373534353535383833', 'hex'); // 3962776754555883

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: "DSTS Save Converter",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('select-zip', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'ZIP Archives', extensions: ['zip'] }]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('convert', async (event, args) => {
  const { inputFolder, outputFolder, templateZip, direction } = args;
  
  if (!fs.existsSync(inputFolder)) return { success: false, error: 'Input folder does not exist.' };
  if (!fs.existsSync(outputFolder)) return { success: false, error: 'Output folder does not exist.' };
  if (direction === 'pc-to-switch' && (!templateZip || !fs.existsSync(templateZip))) {
    return { success: false, error: 'Original Switch Backup ZIP is required.' };
  }

  try {
    const files = fs.readdirSync(inputFolder);
    
    // Find all main save files (e.g., 0000.bin, 0001.bin)
    const mainFiles = files.filter(f => /^\d{4}\.bin$/.test(f));
    // Find all slot files (e.g., slot_0000.bin, slot_0001.bin)
    const slotFiles = files.filter(f => /^slot_\d{4}\.bin$/.test(f));
    
    if (mainFiles.length === 0 && slotFiles.length === 0) {
      return { success: false, error: 'Could not find any .bin or slot_.bin files in the input folder.' };
    }

    let processedCount = 0;
    
    let zip = null;
    let zipEntries = [];
    if (direction === 'pc-to-switch') {
      zip = new AdmZip(templateZip);
      zipEntries = zip.getEntries();
    }

    // Process all main save files
    for (const file of mainFiles) {
      const inputPath = path.join(inputFolder, file);
      const outputPath = path.join(outputFolder, file);
      const inputMain = fs.readFileSync(inputPath);
      let outputMain;

      if (direction === 'switch-to-pc') {
        const header = inputMain.subarray(0, 1024);
        const compressedPayload = inputMain.subarray(1024);
        
        const uncompressedPayload = Buffer.alloc(3097152);
        const decodedSize = lz4.decodeBlock(compressedPayload, uncompressedPayload);
        
        if (decodedSize !== 3097152) {
            console.warn(`${file} - Uncompressed payload size mismatch: ${decodedSize}`);
        }
        
        const unencryptedPc = Buffer.concat([header, uncompressedPayload]);
        
        const cipher = crypto.createCipheriv('aes-128-ecb', DSTS_KEY, '');
        cipher.setAutoPadding(false);
        outputMain = Buffer.concat([cipher.update(unencryptedPc), cipher.final()]);
        
        fs.writeFileSync(outputPath, outputMain);
        
      } else if (direction === 'pc-to-switch') {
        const decipher = crypto.createDecipheriv('aes-128-ecb', DSTS_KEY, '');
        decipher.setAutoPadding(false);
        const decryptedPc = Buffer.concat([decipher.update(inputMain), decipher.final()]);
        
        const entryPath = zipEntries.find(e => e.entryName.endsWith(`/${file}`) || e.entryName === file);
        const header = decryptedPc.subarray(0, 1024);
        
        const uncompressedPayload = decryptedPc.subarray(1024);
        
        const bound = lz4.encodeBound(uncompressedPayload.length);
        const compressedBuffer = Buffer.alloc(bound);
        const compressedSize = lz4.encodeBlockHC(uncompressedPayload, compressedBuffer);
        const compressedPayload = compressedBuffer.subarray(0, compressedSize);
        
        outputMain = Buffer.concat([header, compressedPayload]);
        
        if (entryPath) {
           zip.updateFile(entryPath.entryName, outputMain);
        } else {
           zip.addFile(`savedata/${file}`, outputMain);
        }
      }
      processedCount++;
    }

    // Process all slot files
    for (const file of slotFiles) {
      if (direction === 'switch-to-pc') {
        fs.copyFileSync(path.join(inputFolder, file), path.join(outputFolder, file));
      } else if (direction === 'pc-to-switch') {
        const fileData = fs.readFileSync(path.join(inputFolder, file));
        const entryPath = zipEntries.find(e => e.entryName.endsWith(`/${file}`) || e.entryName === file);
        if (entryPath) {
           zip.updateFile(entryPath.entryName, fileData);
        } else {
           zip.addFile(`savedata/${file}`, fileData);
        }
      }
      processedCount++;
    }

    let message = '';
    if (direction === 'pc-to-switch') {
      const outputZipPath = path.join(outputFolder, 'DSTS_Switch_Converted.zip');
      zip.writeZip(outputZipPath);
      message = `Successfully generated JKSV ZIP: DSTS_Switch_Converted.zip! Transfer this file to your JKSV backups folder on your SD card.`;
    }

    return { success: true, processed: processedCount, message };
  } catch (err) {
    console.error(err);
    return { success: false, error: err.message };
  }
});
