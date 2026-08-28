const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");

let nestApp = null;
let mainWindow = null;

async function checkPortOpen(port = 3000) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}`, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(400, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startBackendServer() {
  const isAlreadyRunning = await checkPortOpen(3000);
  if (isAlreadyRunning) {
    console.log("Servidor backend ya en ejecución en http://127.0.0.1:3000. Reutilizando instancia.");
    return true;
  }

  const appPath = typeof app.getAppPath === "function" ? app.getAppPath() : __dirname;
  const unpackedAppPath = appPath.replace("app.asar", "app.asar.unpacked");
  const resourcesPath = process.resourcesPath || path.join(__dirname, "..");

  process.env.ELECTRON_RESOURCES_PATH = resourcesPath;
  process.env.PORT = "3000";
  if (!process.env.VALORANT_REGION) process.env.VALORANT_REGION = "eu";

  const possibleServerPaths = [
    path.join(appPath, "dist", "main.js"),
    path.join(unpackedAppPath, "dist", "main.js"),
    path.join(resourcesPath, "app.asar", "dist", "main.js"),
    path.join(resourcesPath, "app.asar.unpacked", "dist", "main.js"),
    path.join(__dirname, "..", "dist", "main.js"),
    path.join(resourcesPath, "dist", "main.js"),
  ];

  const serverScript = possibleServerPaths.find((p) => fs.existsSync(p));
  console.log("Ruta de script backend seleccionada:", serverScript);

  if (serverScript) {
    try {
      const serverModule = require(serverScript);
      if (serverModule && typeof serverModule.bootstrap === "function") {
        nestApp = await serverModule.bootstrap();
        console.log("Servidor NestJS iniciado exitosamente en proceso principal de Electron.");
        return true;
      }
    } catch (err) {
      console.error("Error al iniciar NestJS directamente en proceso principal:", err);
    }
  }

  return false;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 700,
    minWidth: 380,
    minHeight: 520,
    fullscreen: false,
    autoHideMenuBar: true,
    title: "LoadoutAI - Valorant Tactical AI Assistant",
    backgroundColor: "#05080c",
    icon: path.join(__dirname, "..", "public", "favicon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  // limites de la ventana
  mainWindow = win;
  // Atajo de teclado: F11 para alternar pantalla completa
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  const targetUrl = "http://127.0.0.1:3000/";

  // Si la carga inicial falla, reintentar automáticamente
  win.webContents.on("did-fail-load", () => {
    console.log("Carga inicial pendiente, esperando a que el servidor responda...");
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.loadURL(targetUrl).catch(() => { });
      }
    }, 500);
  });

  win.loadURL(targetUrl).catch((err) => {
    console.warn("Intento inicial de loadURL:", err.message);
  });
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  await startBackendServer();
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

async function cleanup() {
  if (nestApp && typeof nestApp.close === "function") {
    try {
      await nestApp.close();
    } catch (e) {
      // Ignorar
    }
    nestApp = null;
  }
}

app.on("before-quit", () => {
  cleanup();
});

app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
