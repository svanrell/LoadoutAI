const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const http = require("http");
const { fork } = require("child_process");
const fs = require("fs");

let serverProcess = null;
let mainWindow = null;

function checkServerReady(url, maxAttempts = 50, delayMs = 250) {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      http
        .get(url, () => {
          clearInterval(interval);
          resolve(true);
        })
        .on("error", () => {
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            resolve(false);
          }
        });
    }, delayMs);
  });
}

function startBackendServer() {
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
    serverProcess = fork(serverScript, [], {
      env: { ...process.env, PORT: "3000" },
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

  // Atajo F11 para alternar entre Pantalla Completa y Ventana
  win.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F11" && input.type === "keyDown") {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  const targetUrl = process.env.APP_URL || "http://127.0.0.1:3000/";

  // Esperar a que el servidor backend responda antes de cargar
  await checkServerReady(targetUrl, 40, 250);
  win.loadURL(targetUrl);
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

