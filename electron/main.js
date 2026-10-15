const { app, BrowserWindow, protocol, net, Menu, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// بروتوكول app:// يُعامل كسياق آمن (Secure Context): يدعم التشفير وlocalStorage وIndexedDB وWebAuthn
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

const WWW = path.join(__dirname, '..', 'www');
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1366, height: 860, minWidth: 900, minHeight: 600,
    title: 'MMY.YE',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    backgroundColor: '#060A07',
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  Menu.setApplicationMenu(null);
  // لا تُعرض النافذة إلا بعد جاهزية المحتوى (بدون وميض شاشة فارغة)
  win.once('ready-to-show', () => win.show());
  win.loadURL('app://mmy/index.html');
  // الروابط الخارجية تُفتح في المتصفح وليس داخل البرنامج
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const u = new URL(req.url);
    let rel = decodeURIComponent(u.pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.normalize(path.join(WWW, rel));
    if (!file.startsWith(WWW)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

// نسخة واحدة فقط من البرنامج
if (!app.requestSingleInstanceLock()) app.quit();
else app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
