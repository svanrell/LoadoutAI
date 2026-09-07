import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Client } from "@xhayper/discord-rpc";

@Injectable() 
export class DiscordRpcService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DiscordRpcService.name);
    private client: Client | null = null;
    private isConnected = false;
    private matchStartTimestamp: Date | null = null;
    private reconnectInterval: NodeJS.Timeout | null = null;

    private readonly clientid = process.env.DiscordRpcService;

    onModuleInit() {
        this.connect();
    }

    onModuleDestroy() {
        this.destroy();
    }

    private connect() {
        if (!this.clientid) {
            this.logger.warn("No se puede conectar a Discord: Falta configurar el DISCORD_CLIENT_ID (.env)");
            return;
        }
        try {
            this.client = new Client({ clientId: this.clientid })

            this.client.on("ready", () => {
                this.isConnected = true;
                this.logger.log(`Conectado a DISCORD como ${this.client?.user?.username}`);
                this.setIdleActivity();
            });

            this.client.off("disconnect", () => {
                this.isConnected = false;
                this.logger.warn(`Desconectando de Discord. Reintentando...`);
                this.scheduleReconnect();
            });

            this.client.login().catch((error) => {
                this.logger.debug(`No se pudo conectar a Discord Local (¿está Discord abierto?): ${error.message}`);
                this.scheduleReconnect();
            });
        } catch (error) {
            this.scheduleReconnect();
        }
    }


    private scheduleReconnect(){
        if (this.reconnectInterval) return;
        this.reconnectInterval = setInterval(() => {
            if (!this.isConnected && this.client) {
                this.client.login().then(() => {
                    if(this.reconnectInterval) {
                        clearInterval(this.reconnectInterval);
                        this.reconnectInterval = null;
                    }
                }).catch(() => {});
            }
        }, 15000);
    }

    public setIdleActivity(){
        this.matchStartTimestamp = null;
        this.updateActivity({
            details: "En el Menú Principal",
            state: "En el Lobby",
            largeImageKey: "app_logo",
            largeImageText: "LoadoutAi",
        });
    }

    public setPregameActivity(mapName: string, mode: string){
        if (!this.matchStartTimestamp) {
            this.matchStartTimestamp = new Date();
        }
        const mapAsset = mapName.toLowerCase().replace(/[^a-z0-9]/g, "");

        this.updateActivity({
            details: `Selección de agente (${mode || "No se ha detectado modo de juego"})`,
            state: `Mapa : (${mapName || "Desconocido"})`,
            startTimestamp: this.matchStartTimestamp,
            startImageKey: mapAsset || "app_logo",
            startImageText: mapName,
            smallImageKey: "app_logo",
            smallImageText: "LoadoutAI",
        });
    }

    public setInGameActivity(
        mapName: string,
        mode: string,
        allyScore: number,
        enemyScore: number,
    ){
        if (!this.matchStartTimestamp) {
            this.matchStartTimestamp = new Date();
        }
        const round = allyScore >= 0 && enemyScore >= 0 ? allyScore + enemyScore + 1 : 1;
        const scoreText = allyScore >= 0 && enemyScore >= 0 ? `(${allyScore} - ${enemyScore})` : "";
        const mapAsset = mapName.toLowerCase().replace(/[^a-z0-9]/g, "");

        this.updateActivity({
            details: `${mode || "Partida"} - ${mapName}`,
            state: `Ronda ${round} ${scoreText}`.trim(),
            startTimestamp: this.matchStartTimestamp,
            largeImageKey: mapAsset || "app_logo",
            largeImageText: `Mapa: ${mapName}`,
            smallImageKey: "app_logo",
            smallImageText: "Loadout AI Radar",
            buttons: [
                { label: "Ver Loadout AI", url: "https://github.com/svanrell/LoadoutAI" },
            ],
        });
    }

    public clearActivity(){
        if (this.isConnected && this.client) {
            this.client.user?.clearActivity().catch(() => {});
        }
    }

    public updateActivity(activity: any) {
        if (!this.isConnected || !this.client) return;
        this.client.user?.setActivity(activity).catch((error) => {
            this.logger.debug(`Error al actualizar presencia en Discord: ${error.message}`);
        });
    }

    public destroy(){
        if (this.reconnectInterval) {
            this.clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
        if (this.client){
            this.client.destroy().catch(() => {});
            this.client = null;
        }
        this.isConnected = false;
    }
}