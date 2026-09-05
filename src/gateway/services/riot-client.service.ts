import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { firstValueFrom } from "rxjs";

export interface RiotAuthCredentials {
  url: string;
  token: string;
  port: string;
  password: string;
  protocol: string;
}

export interface RiotRemoteConfig {
  pdUrl: string;
  glzUrl: string;
  region: string;
  shard: string;
  headers: {
    Authorization: string;
    "X-Riot-Entitlements-JWT": string;
    "X-Riot-ClientVersion": string;
    "X-Riot-ClientPlatform": string;
  };
}

@Injectable()
export class RiotClientService {
  private readonly logger = new Logger(RiotClientService.name);

  /**
   * Agente HTTPS dedicado para la comunicación con el cliente local de Riot Games.
   *
   * JUSTIFICACIÓN DE SEGURIDAD (TLS rejectUnauthorized: false):
   * El cliente de Riot ejecuta un servidor web HTTPS local en bucle invertido (127.0.0.1)
   * utilizando un certificado SSL autofirmado generado internamente. Node.js rechaza
   * por defecto estos certificados locales a menos que se configure rejectUnauthorized: false.
   *
   * RESTRICCIÓN ESTRICTA:
   * Este agente SOLO debe emplearse para peticiones dirigidas a '127.0.0.1' o 'localhost'.
   * Las conexiones salientes a Internet (ej: valorant-api.com o servidores Riot en la nube)
   * NUNCA deben usar este agente y deben validar certificados TLS de forma estricta.
   */
  private readonly localHttpsAgent: https.Agent;

  private cachedRemoteConfig: {
    config: RiotRemoteConfig;
    expiresAt: number;
  } | null = null;

  constructor(private readonly httpService: HttpService) {
    this.localHttpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  /**
   * Proporciona el agente HTTPS local validando que el destino sea loopback (127.0.0.1 o localhost).
   */
  public getLocalHttpsAgent(targetUrl?: string): https.Agent {
    if (targetUrl) {
      try {
        const parsed = new URL(targetUrl);
        const isLoopback =
          parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
        if (!isLoopback) {
          throw new Error(
            `Violación de seguridad TLS: Intento de usar el agente local no seguro con URL externa: ${targetUrl}`,
          );
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("Violación de seguridad TLS")
        ) {
          throw err;
        }
        throw new Error(
          `URL inválida proporcionada para el agente TLS local: ${targetUrl}`,
        );
      }
    }
    return this.localHttpsAgent;
  }

  /**
   * Rutas estándar de Windows donde el cliente de Riot ubica el lockfile.
   */
  public getCandidateLockfilePaths(): string[] {
    return [
      path.join(
        process.env.LOCALAPPDATA || "",
        "Riot Games",
        "Riot Client",
        "Config",
        "lockfile",
      ),
      path.join(
        process.env.PROGRAMDATA || "C:\\ProgramData",
        "Riot Games",
        "Riot Client",
        "Config",
        "lockfile",
      ),
      "C:\\Riot Games\\VALORANT\\live\\lockfile",
    ];
  }

  /**
   * Obtiene las credenciales del lockfile activo.
   */
  public getCredentials(): RiotAuthCredentials | null {
    const candidatePaths = this.getCandidateLockfilePaths();
    const foundPath = candidatePaths.find((p) => fs.existsSync(p));
    if (!foundPath) return null;

    try {
      const content = fs.readFileSync(foundPath, "utf8");
      const parts = content.split(":");
      if (parts.length < 5) return null;

      const [, , port, password, protocol] = parts;
      const authBase64 = Buffer.from(`riot:${password}`).toString("base64");

      return {
        url: `${protocol}://127.0.0.1:${port}`,
        token: `Basic ${authBase64}`,
        port,
        password,
        protocol,
      };
    } catch (e) {
      this.logger.warn(
        `Error al leer lockfile: ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  }

  /**
   * Obtiene el PUUID del jugador actual conectado en la sesión local.
   */
  public async getCurrentPlayerPuuid(): Promise<string | null> {
    const credentials = this.getCredentials();
    if (!credentials) return null;

    try {
      const res = await firstValueFrom(
        this.httpService.get<{ puuid: string }>(
          `${credentials.url}/chat/v1/session`,
          {
            headers: { Authorization: credentials.token },
            httpsAgent: this.getLocalHttpsAgent(credentials.url),
          },
        ),
      );
      return res.data?.puuid || null;
    } catch {
      return null;
    }
  }

  /**
   * Obtiene o refresca la configuración remota de Riot (GLZ y PD URLs con tokens).
   */
  public async getRemoteConfig(
    forceRefresh = false,
  ): Promise<RiotRemoteConfig | null> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.cachedRemoteConfig &&
      this.cachedRemoteConfig.expiresAt > now
    ) {
      return this.cachedRemoteConfig.config;
    }

    const credentials = this.getCredentials();
    if (!credentials) return null;

    try {
      // 1. Token de entitlements del cliente local (127.0.0.1)
      const tokenRes = await firstValueFrom(
        this.httpService.get<{ accessToken: string; token: string }>(
          `${credentials.url}/entitlements/v1/token`,
          {
            headers: { Authorization: credentials.token },
            httpsAgent: this.getLocalHttpsAgent(credentials.url),
          },
        ),
      );

      // 2. Versión del cliente desde valorant-api.com (remoto estándar con TLS estricto)
      let riotClientVersion = "release-09.11-shipping-9-2115324";
      try {
        const versionRes = await firstValueFrom(
          this.httpService.get<{ data: { riotClientVersion: string } }>(
            "https://valorant-api.com/v1/version",
          ),
        );
        if (versionRes.data?.data?.riotClientVersion) {
          riotClientVersion = versionRes.data.data.riotClientVersion;
        }
      } catch {
        this.logger.debug("Usando versión de respaldo para riotClientVersion");
      }

      // 3. Región detectada automáticamente
      let region = (process.env.VALORANT_REGION || "").toLowerCase();
      if (!region) {
        try {
          const regionRes = await firstValueFrom(
            this.httpService.get<{ region?: string; webRegion?: string }>(
              `${credentials.url}/riotclient/region-locale`,
              {
                headers: { Authorization: credentials.token },
                httpsAgent: this.getLocalHttpsAgent(credentials.url),
              },
            ),
          );
          const rawReg = (
            regionRes.data?.region ||
            regionRes.data?.webRegion ||
            ""
          ).toLowerCase();
          if (rawReg.includes("eu")) region = "eu";
          else if (rawReg.includes("na")) region = "na";
          else if (rawReg.includes("latam")) region = "latam";
          else if (rawReg.includes("br")) region = "br";
          else if (rawReg.includes("ap")) region = "ap";
          else if (rawReg.includes("kr")) region = "kr";
          else region = "eu";
        } catch {
          region = "eu";
        }
      }

      const shard = region === "latam" || region === "br" ? "na" : region;
      const glzUrl = `https://glz-${region}-1.${shard}.a.pvp.net`;
      const pdUrl = `https://pd.${shard}.a.pvp.net`;

      const config: RiotRemoteConfig = {
        pdUrl,
        glzUrl,
        region,
        shard,
        headers: {
          Authorization: `Bearer ${tokenRes.data.accessToken}`,
          "X-Riot-Entitlements-JWT": tokenRes.data.token,
          "X-Riot-ClientVersion": riotClientVersion,
          "X-Riot-ClientPlatform":
            "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
        },
      };

      // Caché válida por 20 minutos
      this.cachedRemoteConfig = {
        config,
        expiresAt: now + 20 * 60 * 1000,
      };

      return config;
    } catch (error) {
      this.logger.error(
        `Error al obtener configuración remota: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
