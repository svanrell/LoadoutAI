const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const http = require("http");
const { fork } = require("child_process");
const fs = require("fs");

let serverProcess = null;
let mainWindow = null;

function checkServerReady(url, maxAttempts = 120, delayMs = 250) {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const req = http
        .get(url, (res) => {
          res.resume();
          clearInterval(interval);
          resolve(true);
        })
        .on("error", () => {
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            resolve(false);
          }
        });
      req.setTimeout(1000, () => req.destroy());
    }, delayMs);
  });
}

async function startBackendServer() {
  const isAlreadyRunning = await new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:3000", (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });

  if (isAlreadyRunning) {
    console.log("Servidor backend ya en ejecución en http://127.0.0.1:3000. Reutilizando instancia.");
    return;
  }

  const possibleServerPaths = [
    path.join(__dirname, "..", "dist", "main.js"),
    path.join(process.resourcesPath || "", "app.asar", "dist", "main.js"),
    path.join(process.resourcesPath || "", "dist", "main.js"),
  ];

  const serverScript = possibleServerPaths.find((p) => fs.existsSync(p));
  if (!serverScript) {
    console.warn("No se encontró dist/main.js local, usando servidor externo.");
    return;
  }

  try {
    const resourcesPath = process.resourcesPath || path.join(__dirname, "..");
    serverProcess = fork(serverScript, [], {
      env: {
        ...process.env,
        PORT: "3000",
        ELECTRON_RESOURCES_PATH: resourcesPath,
      },
      silent: false,
    });

    serverProcess.on("error", (err) => {
      console.error("Error en proceso de backend NestJS:", err);
    });

    serverProcess.on("exit", (code, signal) => {
      console.log(`Servidor backend finalizado (código: ${code}, señal: ${signal})`);
    });
  } catch (err) {
    console.error("No se pudo iniciar el proceso de NestJS:", err);
  }
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    fullscreen: true, // Inicia la aplicación en Pantalla Completa
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

  mainWindow = win;

  // Atajos de teclado: F11 pantalla completa, F12 DevTools, F5 / Ctrl+R recargar
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown") {
      if (input.key === "F11") {
        win.setFullScreen(!win.isFullScreen());
        event.preventDefault();
      } else if (input.key === "F12") {
        win.webContents.toggleDevTools();
        event.preventDefault();
      } else if (input.key === "F5" || (input.control && input.key.toLowerCase() === "r")) {
        win.reload();
        event.preventDefault();
      }
    }
  });

  const targetUrl = process.env.APP_URL || "http://127.0.0.1:3000/";

  // Si la carga inicial falla por estar iniciando el backend, reintentar automáticamente
  win.webContents.on("did-fail-load", () => {
    console.log("Carga inicial pendiente, esperando a que el servidor esté listo...");
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.loadURL(targetUrl).catch(() => {});
      }
    }, 1000);
  });

  // Esperar a que el servidor backend responda antes de cargar
  await checkServerReady(targetUrl, 120, 250);
  win.loadURL(targetUrl).catch((err) => {
    console.warn("Intento inicial de loadURL:", err.message);
  });
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  startBackendServer();
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

function cleanup() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {
      // Ignorar errores al matar el proceso hijo
    }
    serverProcess = null;
  }
}

app.on("before-quit", cleanup);

app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

