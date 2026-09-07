import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as fs from "fs";

import { Request, Response } from "express";

function loadEnvFile() {
  const envPath = join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...values] = trimmed.split("=");
        if (key) {
          const k = key.trim();
          const v = values.join("=").trim().replace(/^["']|["']$/g, "");
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    } catch {}
  }
}
loadEnvFile();

let appInstance: NestExpressApplication | null = null;

export async function bootstrap(): Promise<NestExpressApplication> {
  if (appInstance) {
    return appInstance;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log"],
  });

  const allowedOrigins = [
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    /^app:\/\//,
    /^file:\/\//,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((pattern) => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
  });

  const resourcesPath = process.env.ELECTRON_RESOURCES_PATH || "";

  // Localizar la carpeta public estática en desarrollo o empaquetado
  const possiblePublicPaths = [
    join(resourcesPath, "public"),
    join(resourcesPath, "app.asar", "public"),
    join(resourcesPath, "app.asar.unpacked", "public"),
    join(__dirname, "..", "public"),
    join(__dirname, "public"),
    join(process.cwd(), "public"),
  ];
  const publicPath =
    possiblePublicPaths.find((p) => fs.existsSync(p)) ||
    join(__dirname, "..", "public");

  // Endpoint de salud y verificación para Electron / procesos locales
  app.use("/api/health", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: "ok",
        app: "valorant-ai",
        timestamp: Date.now(),
      }),
    );
  });

  console.log("Serving static assets from:", publicPath);
  app.useStaticAssets(publicPath);

  const host = process.env.HOST || "127.0.0.1";
  const port = process.env.PORT || 3000;
  await app.listen(port, host);
  console.log(`Loadout AI Server running on http://${host}:${port}`);

  appInstance = app;
  return app;
}

// Si se ejecuta por línea de comandos (ej: node dist/main.js)
if (require.main === module) {
  void bootstrap();
}
