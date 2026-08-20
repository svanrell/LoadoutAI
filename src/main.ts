import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as fs from "fs";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  // Localizar la carpeta public estática en desarrollo o empaquetado
  const possiblePublicPaths = [
    join(__dirname, "..", "public"),
    join(process.cwd(), "public"),
    join((process as any).resourcesPath || "", "public"),
  ];
  const publicPath =
    possiblePublicPaths.find((p) => fs.existsSync(p)) ||
    join(__dirname, "..", "public");

  app.useStaticAssets(publicPath);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
void bootstrap();

