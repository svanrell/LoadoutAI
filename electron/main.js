const electron = require("electron");
const app = electron && typeof electron === "object" ? electron.app : null;
const BrowserWindow = electron && typeof electron === "object" ? electron.BrowserWindow : null;
const Menu = electron && typeof electron === "object" ? electron.Menu : null;
const path = require("path");
const http = require("http");
const fs = require("fs");

let nestApp = null;
let mainWindow = null;
let cleanupPromise = null;
let readyToQuit = false;

const BACKEND_PORT = parseInt(process.env.PORT || "3000", 10);
const BACKEND_HOST = process.env.HOST || "127.0.0.1";
const CLEANUP_TIMEOUT_MS = 5000;

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
          if (parsed && typeof parsed === "object") {
            resolve(parsed.app === "valorant-ai");
            return;
          }
        } catch {
          // No es JSON: no es el backend de LoadoutAI
        }
        resolve(false);
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

/**
 * Ruta de un archivo de public/. En el paquete está en resources/public (extraResources;
 * electron-builder no lo incluye en app.asar). En desarrollo, en la carpeta public del proyecto.
 */
function resolvePublicAsset(fileName) {
  const candidates = [
    process.resourcesPath ? path.join(process.resourcesPath, "public", fileName) : null,
    path.join(__dirname, "..", "public", fileName),
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || candidates[candidates.length - 1];
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
    icon: resolvePublicAsset(process.platform === "win32" ? "app_icon.ico" : "favicon.png"),
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

  // Tras una carga correcta, una caída posterior vuelve a tener todos los reintentos
  win.webContents.on("did-finish-load", () => {
    retryCount = 0;
  });

  // Si la carga falla, reintentar con control de reintentos y limpieza de timers.
  // Se ignoran los subframes y ERR_ABORTED (-3), que es una navegación cancelada.
  win.webContents.on("did-fail-load", (_event, errorCode, _errorDescription, _validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return;
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

if (app && typeof app.whenReady === "function") {
  // Una sola instancia: si ya hay una abierta, se enfoca su ventana y esta se cierra
  if (!app.requestSingleInstanceLock()) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    app.whenReady().then(async () => {
      if (Menu && typeof Menu.setApplicationMenu === "function") {
        Menu.setApplicationMenu(null);
      }
      await startBackendServer();
      await createWindow();

      app.on("activate", () => {
        if (BrowserWindow && BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });
    });

    // Electron no espera a los handlers async: se cancela la salida, se cierra
    // el backend y después se vuelve a pedir la salida
    app.on("before-quit", (event) => {
      if (readyToQuit) return;
      event.preventDefault();
      cleanup().finally(() => {
        readyToQuit = true;
        app.quit();
      });
    });

    // En macOS la app sigue abierta sin ventanas: el backend se mantiene para que
    // "activate" pueda abrir otra ventana, y se cierra en before-quit
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });
  }
}

/**
 * Cierra NestJS una sola vez; las llamadas siguientes reciben la misma promesa.
 * Si el cierre se bloquea, se abandona a los CLEANUP_TIMEOUT_MS para no impedir la salida.
 */
function cleanup() {
  if (!cleanupPromise) {
    cleanupPromise = closeBackend();
  }
  return cleanupPromise;
}

async function closeBackend() {
  if (!nestApp || typeof nestApp.close !== "function") return;
  const appToClose = nestApp;
  nestApp = null;

  let timeoutId = null;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`no terminó en ${CLEANUP_TIMEOUT_MS} ms`)),
      CLEANUP_TIMEOUT_MS,
    );
  });
  try {
    await Promise.race([appToClose.close(), timeout]);
    console.log("Servidor NestJS cerrado correctamente.");
  } catch (e) {
    console.warn("Aviso al cerrar NestJS:", e.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  checkBackendHealth,
  startBackendServer,
  cleanup,
  resolvePublicAsset,
};
