import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { Client } from "@xhayper/discord-rpc";

import { RpcLanguage, RPC_I18N, LastRpcActivity } from "./discord-rpc.i18n";
export type { RpcLanguage } from "./discord-rpc.i18n";
import { DISCORD_CONFIG } from "../../shared/discord.constants";

@Injectable()
export class DiscordRpcService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordRpcService.name);
  private client: Client | null = null;
  private isConnected = false;
  private matchStartTimestamp: Date | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;

  private lastActivity: LastRpcActivity = { type: "idle" };
  private currentLanguage: RpcLanguage = this.detectSystemLanguage();

  private detectSystemLanguage(): RpcLanguage {
    try {
      const locale = Intl.DateTimeFormat()
        .resolvedOptions()
        .locale.toLowerCase();
      return locale.startsWith("es") ? "es" : "en";
    } catch {
      return "es";
    }
  }

  public setLanguage(lang: RpcLanguage) {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    this.logger.log(
      `Idioma de Discord RPC actualizado a: ${lang.toUpperCase()}`,
    );
    this.refreshLastActivity();
  }

  public getLanguage(): RpcLanguage {
    return this.currentLanguage;
  }

  private refreshLastActivity() {
    if (!this.isConnected || !this.client) return;
    switch (this.lastActivity.type) {
      case "idle":
        this.applyIdleActivity();
        break;
      case "menu":
        this.applyMenuActivity();
        break;
      case "pregame":
        this.applyPregameActivity(
          this.lastActivity.mapName,
          this.lastActivity.mode,
        );
        break;
      case "ingame":
        this.applyInGameActivity(
          this.lastActivity.mapName,
          this.lastActivity.mode,
          this.lastActivity.allyScore,
          this.lastActivity.enemyScore,
        );
        break;
    }
  }

  private getClientId(): string {
    return DISCORD_CONFIG.CLIENT_ID;
  }

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.destroy();
  }

  private connect() {
    const clientId = this.getClientId();
    if (!clientId) {
      this.logger.warn(
        "No se puede conectar a Discord: Falta configurar el DISCORD_CLIENT_ID",
      );
      return;
    }
    try {
      this.client = new Client({ clientId });

      this.client.on("ready", () => {
        this.isConnected = true;
        this.logger.log(
          `Conectado a DISCORD como ${this.client?.user?.username}`,
        );
        this.refreshLastActivity();
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      });

      this.client.on("disconnected", () => {
        this.isConnected = false;
        this.logger.warn(`Desconectado de Discord. Reintentando...`);
        this.scheduleReconnect();
      });

      this.client.login().catch((error) => {
        this.logger.debug(
          `No se pudo conectar a Discord Local (¿está Discord abierto?): ${error.message}`,
        );
        this.scheduleReconnect();
      });
    } catch (_error) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) return;
    this.reconnectInterval = setInterval(() => {
      if (!this.isConnected) {
        if (this.client) {
          try {
            this.client.destroy().catch(() => {
              // Ignore destroy errors during reconnect attempt
            });
          } catch {
            // Ignore destroy errors during reconnect attempt
          }
          this.client = null;
        }
        this.connect();
      }
    }, 10000);
  }

  public setIdleActivity() {
    this.lastActivity = { type: "idle" };
    this.applyIdleActivity();
  }

  private applyIdleActivity() {
    this.matchStartTimestamp = null;
    const t = RPC_I18N[this.currentLanguage];
    this.updateActivity({
      details: t.idleDetails,
      state: t.idleState,
      largeImageKey: "logo",
      largeImageText: "Loadout AI",
    });
  }

  public setMenuActivity() {
    this.lastActivity = { type: "menu" };
    this.applyMenuActivity();
  }

  private applyMenuActivity() {
    this.matchStartTimestamp = null;
    const t = RPC_I18N[this.currentLanguage];
    this.updateActivity({
      details: t.menuDetails,
      state: t.menuState,
      largeImageKey: "logo",
      largeImageText: "Loadout AI",
    });
  }

  public setPregameActivity(mapName: string, mode: string) {
    this.lastActivity = { type: "pregame", mapName, mode };
    this.applyPregameActivity(mapName, mode);
  }

  private applyPregameActivity(mapName: string, mode: string) {
    if (!this.matchStartTimestamp) {
      this.matchStartTimestamp = new Date();
    }
    const t = RPC_I18N[this.currentLanguage];
    const effectiveMode = mode || t.unknownMode;
    const effectiveMap = mapName || t.unknownMap;
    const mapAsset = mapName
      ? mapName.toLowerCase().replace(/[^a-z0-9]/g, "")
      : "";

    this.updateActivity({
      details: t.pregameDetails(effectiveMode),
      state: t.pregameState(effectiveMap),
      startTimestamp: this.matchStartTimestamp,
      largeImageKey: mapAsset || "logo",
      largeImageText: effectiveMap,
      smallImageKey: "logo",
      smallImageText: "Loadout AI",
    });
  }

  public setInGameActivity(
    mapName: string,
    mode: string,
    allyScore: number,
    enemyScore: number,
  ) {
    this.lastActivity = {
      type: "ingame",
      mapName,
      mode,
      allyScore,
      enemyScore,
    };
    this.applyInGameActivity(mapName, mode, allyScore, enemyScore);
  }

  private applyInGameActivity(
    mapName: string,
    mode: string,
    allyScore: number,
    enemyScore: number,
  ) {
    if (!this.matchStartTimestamp) {
      this.matchStartTimestamp = new Date();
    }
    const t = RPC_I18N[this.currentLanguage];
    const effectiveMode = mode || t.unknownMode;
    const effectiveMap = mapName || t.unknownMap;
    const round =
      allyScore >= 0 && enemyScore >= 0 ? allyScore + enemyScore + 1 : 1;
    const scoreText =
      allyScore >= 0 && enemyScore >= 0 ? `(${allyScore} - ${enemyScore})` : "";
    const mapAsset = mapName
      ? mapName.toLowerCase().replace(/[^a-z0-9]/g, "")
      : "";

    this.updateActivity({
      details: t.ingameDetails(effectiveMode, effectiveMap),
      state: t.ingameState(round, scoreText),
      startTimestamp: this.matchStartTimestamp,
      largeImageKey: mapAsset || "logo",
      largeImageText: t.largeImageMap(effectiveMap),
      smallImageKey: "logo",
      smallImageText: "Loadout AI Radar",
      buttons: [{ label: t.buttonLabel, url: DISCORD_CONFIG.GITHUB_URL }],
    });
  }

  public setIngameActivity(
    mapName: string,
    mode: string,
    allyScore: number,
    enemyScore: number,
  ) {
    this.setInGameActivity(mapName, mode, allyScore, enemyScore);
  }

  public clearActivity() {
    if (this.isConnected && this.client) {
      this.client.user?.clearActivity().catch(() => {});
    }
  }

  public updateActivity(activity: any) {
    if (!this.isConnected || !this.client) return;
    this.client.user?.setActivity(activity).catch((error) => {
      this.logger.debug(
        `Error al actualizar presencia en Discord: ${error.message}`,
      );
    });
  }

  public destroy() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.client) {
      this.client.destroy().catch(() => {});
      this.client = null;
    }
    this.isConnected = false;
  }
}
