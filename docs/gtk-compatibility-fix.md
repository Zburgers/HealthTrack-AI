# GTK Compatibility Fix for HealthTrack AI

## Problem Description

The application was experiencing GTK library conflicts when running Electron on Linux:

```
(process:11339): Gtk-ERROR **: 22:13:50.883: GTK 2/3 symbols detected. Using GTK 2/3 and GTK 4 in the same process is not supported
/home/naki/.../electron exited with signal SIGTRAP
```

## Root Cause

- Electron is trying to load both GTK 2/3 and GTK 4 libraries simultaneously
- This happens when native modules (like better-sqlite3) are compiled against different GTK versions
- Linux distributions often have multiple GTK versions installed

## Solutions Implemented

### 1. Environment Variables
Set in `electron/main.js` and launch scripts:
```bash
export GDK_BACKEND=x11
export ELECTRON_DISABLE_WAYLAND=1
export ELECTRON_FORCE_X11=1
export GTK_USE_PORTAL=0
```

### 2. Electron Command Line Flags
Added in `electron/main.js`:
```javascript
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
```

### 3. Smart Launcher Script
Created `scripts/electron-launcher.sh` that:
- Tries multiple launch methods
- Falls back to browser mode if Electron fails
- Provides troubleshooting guidance

### 4. Native Module Rebuild
Configured `electronRebuild` in package.json:
```json
"electronRebuild": {
  "onlyModules": ["better-sqlite3"]
}
```

## Usage

### Development Mode
```bash
npm run electron:dev        # Full development with Next.js + Electron
npm run electron:dev-only   # Electron only (requires Next.js running separately)
```

### If Electron Still Fails
1. Install GTK development libraries:
   ```bash
   # Ubuntu/Debian
   sudo apt install libgtk-3-dev
   
   # Fedora/RHEL
   sudo dnf install gtk3-devel
   
   # Arch Linux
   sudo pacman -S gtk3
   ```

2. Run web-only mode:
   ```bash
   npm run dev
   # Then open http://localhost:9002 in browser
   ```

3. Rebuild native modules:
   ```bash
   npm run postinstall
   ```

## Browser Fallback

If Electron continues to fail, the launcher will offer to open the application in your default browser. While this doesn't provide desktop integration, all core functionality remains available.

## System Requirements

- Node.js 18+
- GTK 3.0+ (recommended)
- X11 display server (Wayland support limited)

## Troubleshooting

### Common Issues

1. **SIGTRAP Error**: Usually GTK version conflicts
   - Solution: Use provided launcher scripts
   
2. **Black Screen**: GPU acceleration issues
   - Solution: --disable-gpu flag (already included)
   
3. **Permission Errors**: Sandbox restrictions
   - Solution: --no-sandbox flag (already included)

### Debug Mode
```bash
DEBUG=electron* npm run electron:dev-only
```

### Check Electron Version
```bash
npm list electron
```

### Force Rebuild
```bash
rm -rf node_modules/.cache
npm run postinstall
```

## Future Improvements

1. Consider Electron alternatives (Tauri, Neutralino)
2. Implement progressive web app (PWA) features
3. Add automatic GTK version detection
4. Implement graceful degradation for unsupported systems
