import * as http from "http";
import { AddressInfo } from "net";

interface ElectronMainExports {
  checkBackendHealth: (port?: number, host?: string) => Promise<boolean>;
  cleanup: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const electronMain = require("../electron/main") as ElectronMainExports;
const { checkBackendHealth, cleanup } = electronMain;

describe("Electron Lifecycle & Healthcheck Flow Suite", () => {
  let server: http.Server;
  let testPort: number;

  afterEach((done) => {
    if (server && server.listening) {
      server.close(() => done());
    } else {
      done();
    }
  });

  it("should validate healthy Valorant AI backend when /api/health responds with app signature", async () => {
    server = http.createServer((req, res) => {
      if (req.url === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ app: "valorant-ai", status: "ok" }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        testPort = (server.address() as AddressInfo).port;
        resolve();
      });
    });

    const isHealthy = await checkBackendHealth(testPort, "127.0.0.1");
    expect(isHealthy).toBe(true);
  });

  it("should return false if /api/health returns non-valorant app signature", async () => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ app: "other-random-app", status: "ok" }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        testPort = (server.address() as AddressInfo).port;
        resolve();
      });
    });

    const isHealthy = await checkBackendHealth(testPort, "127.0.0.1");
    expect(isHealthy).toBe(false);
  });

  it("should return false gracefully if backend port is completely unreachable", async () => {
    const isHealthy = await checkBackendHealth(65530, "127.0.0.1");
    expect(isHealthy).toBe(false);
  });

  it("should perform cleanup idempotently without throwing on multiple calls", async () => {
    await expect(cleanup()).resolves.not.toThrow();
    await expect(cleanup()).resolves.not.toThrow();
  });
});
