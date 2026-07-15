WIP
# DSTS Save Converter

> **Note**: This is a "vibe coded" project, created dynamically through an AI pair programming session.

This application allows you to convert save files for Digimon Story Time Stranger between the PC and Nintendo Switch versions.

**⚠️ IMPORTANT WARNING ⚠️**  
PC to Switch save conversion is **untested** because not all DLC has been released for the Switch version of the game yet. Please proceed with caution and always back up your original saves!

## How to Use

1. Launch the application (either run the executable or run from source).
2. Use the UI to select your conversion direction:
   - **Switch to PC**: Convert a Nintendo Switch JKSV backup folder into PC save files.
   - **PC to Switch**: Convert PC save files into a Nintendo Switch JKSV backup ZIP file.
3. Provide the necessary files/folders:
   - **Input Folder**: Select the folder containing your original save files.
   - **Output Folder**: Select the folder where you want the converted saves to be placed.
   - **Original Switch Backup ZIP** (Only for PC to Switch): Select your original, unmodified Switch backup ZIP. This is required as a template to pack the converted saves into.
4. Click **Convert** and wait for the process to finish. The app will notify you when conversion is successful and where to find your files.

## Build from Source

If you want to run or build the application from source, you will need to have [Node.js](https://nodejs.org/) installed.

### Setup
1. Clone or download this directory.
2. Open a terminal in the project directory.
3. Install the dependencies by running:
   ```bash
   npm install
   ```

### Running Locally
To start the app in development mode without building:
```bash
npm start
```

### Building Executables
To build the standalone executables for Windows and Linux:
1. Make sure you have installed the developer dependencies:
   ```bash
   npm install --save-dev electron-builder
   ```
2. Run the build command (if configured in package.json):
   ```bash
   npm run build
   ```
   Alternatively, run electron-builder directly:
   ```bash
   npx electron-builder --linux --win
   ```

The compiled executables will be generated in the `dist` folder.
