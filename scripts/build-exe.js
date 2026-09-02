const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const packageJson = require("../package.json");
const version = packageJson.version || "1.0.0";

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

const targetDir = path.join(__dirname, "..", "release");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = fs.existsSync(tempOut) ? fs.readdirSync(tempOut) : [];
const exeFiles = files.filter((f) => f.endsWith(".exe") && !f.toLowerCase().includes("elevate"));

if (exeFiles.length > 0) {
  for (const exe of exeFiles) {
    const src = path.join(tempOut, exe);
    const dest = path.join(targetDir, exe);
    console.log(`Copiando ejecutable final ${exe} a release/${exe}...`);
    fs.copyFileSync(src, dest);
    console.log("¡Compilación finalizada con éxito! Archivo:", dest, "Tamaño:", fs.statSync(dest).size, "bytes");
  }
} else {
  console.error("No se encontró ningún ejecutable generado en:", tempOut);
  process.exit(1);
}
