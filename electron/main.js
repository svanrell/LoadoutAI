const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");

let nestApp = null;
let mainWindow = null;
let isCleaningUp = false;

const BACKEND_PORT = parseInt(process.env.PORT || "3000", 10);
const BACKEND_HOST = process.env.HOST || "127.0.0.1";

/**
 * Verifica si el backend está activo realizando una comprobación HTTP
 * al endpoint /api/health y validando la firma de la aplicación.
 */
async function checkBackendHealth(port = BACKEND_PORT, host = BACKEND_HOST) {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}/api/health`, (res) => {
      let rawData = "";
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(rawData);
          if (parsed && parsed.app === "valorant-ai") {
            resolve(true);
            return;
          }
        } catch {
          // Fallback si devuelve 200 aunque no sea JSON
        }
        resolve(res.statusCode === 200);
      });
    });

    req.on("error", () => resolve(false));
    req.setTimeout(600, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startBackendServer() {
  const isAlreadyRunning = await checkBackendHealth(BACKEND_PORT, BACKEND_HOST);
  if (isAlreadyRunning) {
    console.log(`Servidor backend validado en http://${BACKEND_HOST}:${BACKEND_PORT}. Reutilizando instancia.`);
    return true;
  }

  const appPath = typeof app.getAppPath === "function" ? app.getAppPath() : __dirname;
  const unpackedAppPath = appPath.replace("app.asar", "app.asar.unpacked");
  const resourcesPath = process.resourcesPath || path.join(__dirname, "..");

  process.env.ELECTRON_RESOURCES_PATH = resourcesPath;
  process.env.PORT = String(BACKEND_PORT);
  process.env.HOST = BACKEND_HOST;
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
      sandbox: true,
    },
  });

  mainWindow = win;

  // Atajo de teclado: F11 para alternar pantalla completa
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  const targetUrl = `http://${BACKEND_HOST}:${BACKEND_PORT}/`;
  let retryCount = 0;
  const maxRetries = 20; // 10s máximo en intervalos de 500ms
  let reloadTimer = null;

  // Si la carga inicial falla, reintentar con control de reintentos y limpieza de timers
  win.webContents.on("did-fail-load", () => {
    if (retryCount >= maxRetries) {
      console.error(`Fallo persistente al conectar con el backend tras ${maxRetries} intentos.`);
      return;
    }
    retryCount++;
    console.log(`Carga inicial pendiente (intento ${retryCount}/${maxRetries}), esperando backend...`);
    if (reloadTimer) {
      clearTimeout(reloadTimer);
    }
    reloadTimer = setTimeout(() => {
      if (!win.isDestroyed()) {
        win.loadURL(targetUrl).catch(() => {});
      }
    }, 500);
  });

  win.on("closed", () => {
    if (reloadTimer) {
      clearTimeout(reloadTimer);
      reloadTimer = null;
    }
    if (mainWindow === win) {
      mainWindow = null;
    }
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

/**
 * Cierra NestJS de forma segura e idempotente para evitar llamadas dobles.
 */
async function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;

  if (nestApp && typeof nestApp.close === "function") {
    try {
      await nestApp.close();
      console.log("Servidor NestJS cerrado correctamente.");
    } catch (e) {
      console.warn("Aviso al cerrar NestJS:", e.message);
    }
    nestApp = null;
  }
}

app.on("before-quit", async () => {
  await cleanup();
});

app.on("window-all-closed", async () => {
  await cleanup();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
