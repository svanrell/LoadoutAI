import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as fs from "fs";

let appInstance: NestExpressApplication | null = null;

export async function bootstrap(): Promise<NestExpressApplication> {
  if (appInstance) {
    return appInstance;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log"],
  });

  app.enableCors();

  const resourcesPath =
    process.env.ELECTRON_RESOURCES_PATH ||
    (process as any).resourcesPath ||
    "";

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

  console.log("Serving static assets from:", publicPath);
  app.useStaticAssets(publicPath);

  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0");
  console.log(`Loadout AI Server running on http://127.0.0.1:${port}`);

  appInstance = app;
  return app;
}

// Si se ejecuta por línea de comandos (ej: node dist/main.js)
if (require.main === module) {
  void bootstrap();
}
