const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const tempOut = path.join(os.tmpdir(), "loadout-build");
console.log("Directorio temporal de compilación:", tempOut);

if (fs.existsSync(tempOut)) {
  fs.rmSync(tempOut, { recursive: true, force: true });
}

console.log("Ejecutando electron-builder en carpeta temporal...");
execSync(`npx electron-builder --win --config.directories.output="${tempOut}"`, {
  stdio: "inherit",
  env: process.env,
});

const generatedExe = path.join(tempOut, "LoadoutAI 1.0.0.exe");
const targetDir = path.join(__dirname, "..", "release");
const targetExe = path.join(targetDir, "LoadoutAI 1.0.0.exe");

if (fs.existsSync(generatedExe)) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  console.log("Copiando ejecutable final a release/LoadoutAI 1.0.0.exe...");
  fs.copyFileSync(generatedExe, targetExe);
  console.log("¡Compilación finalizada con éxito! Tamaño:", fs.statSync(targetExe).size, "bytes");
} else {
  console.error("No se encontró el ejecutable generado en:", generatedExe);
  process.exit(1);
}
