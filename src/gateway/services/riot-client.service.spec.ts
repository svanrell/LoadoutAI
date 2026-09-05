import { HttpService } from "@nestjs/axios";
import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";
import { RiotClientService } from "./riot-client.service";

describe("RiotClientService", () => {
  let service: RiotClientService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiotClientService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RiotClientService>(RiotClientService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe("getLocalHttpsAgent", () => {
    it("should return an https.Agent with rejectUnauthorized false for loopback addresses", () => {
      const agent = service.getLocalHttpsAgent("https://127.0.0.1:54321");
      expect(agent).toBeDefined();
      expect((agent as any).options.rejectUnauthorized).toBe(false);
    });

    it("should return the agent when localhost is provided", () => {
      const agent = service.getLocalHttpsAgent("https://localhost:54321");
      expect(agent).toBeDefined();
    });

    it("should THROW a security error if an external URL attempts to use the unverified TLS agent", () => {
      expect(() =>
        service.getLocalHttpsAgent("https://valorant-api.com/v1/version"),
      ).toThrow("Violación de seguridad TLS");

      expect(() =>
        service.getLocalHttpsAgent("https://pd.eu.a.pvp.net"),
      ).toThrow("Violación de seguridad TLS");

      // Verify that malicious subdomains attempting to bypass include("localhost") are blocked
      expect(() =>
        service.getLocalHttpsAgent("https://localhost.evil.com:54321"),
      ).toThrow("Violación de seguridad TLS");

      expect(() =>
        service.getLocalHttpsAgent("https://127.0.0.1.attacker.io:54321"),
      ).toThrow("Violación de seguridad TLS");
    });

    it("should throw error for malformed URLs", () => {
      expect(() => service.getLocalHttpsAgent("not-a-valid-url")).toThrow(
        "URL inválida",
      );
    });

    it("should THROW a security error if targetUrl is missing or not HTTPS", () => {
      expect(() => service.getLocalHttpsAgent()).toThrow(
        "Violación de seguridad TLS",
      );
      expect(() =>
        service.getLocalHttpsAgent("http://127.0.0.1:54321"),
      ).toThrow("Violación de seguridad TLS");
    });
  });

  describe("getCandidateLockfilePaths", () => {
    it("should return non-empty candidate file paths on Windows", () => {
      const paths = service.getCandidateLockfilePaths();
      expect(Array.isArray(paths)).toBe(true);
      expect(paths.length).toBeGreaterThan(0);
      expect(paths.some((p) => p.includes("lockfile"))).toBe(true);
    });
  });

  describe("getCurrentPlayerPuuid", () => {
    it("should return null if no lockfile/credentials are found", async () => {
      jest.spyOn(service, "getCredentials").mockReturnValue(null);
      const puuid = await service.getCurrentPlayerPuuid();
      expect(puuid).toBeNull();
    });

    it("should fetch current player PUUID when credentials exist and chat session responds", async () => {
      jest.spyOn(service, "getCredentials").mockReturnValue({
        url: "https://127.0.0.1:54321",
        token: "Basic dGVzdDp0ZXN0",
        port: "54321",
        password: "test",
        protocol: "https",
      });

      jest.spyOn(httpService, "get").mockReturnValue(
        of({
          data: { puuid: "test-puuid-12345" },
        } as any),
      );

      const puuid = await service.getCurrentPlayerPuuid();
      expect(puuid).toBe("test-puuid-12345");
    });

    it("should return null if chat session endpoint returns error", async () => {
      jest.spyOn(service, "getCredentials").mockReturnValue({
        url: "https://127.0.0.1:54321",
        token: "Basic dGVzdDp0ZXN0",
        port: "54321",
        password: "test",
        protocol: "https",
      });

      jest
        .spyOn(httpService, "get")
        .mockReturnValue(throwError(() => new Error("Connection refused")));

      const puuid = await service.getCurrentPlayerPuuid();
      expect(puuid).toBeNull();
    });

    it("should handle timeout gracefully when Riot client does not respond in time", async () => {
      jest.spyOn(service, "getCredentials").mockReturnValue({
        url: "https://127.0.0.1:54321",
        token: "Basic dGVzdDp0ZXN0",
        port: "54321",
        password: "test",
        protocol: "https",
      });

      const timeoutError = new Error("timeout of 5000ms exceeded");
      (timeoutError as any).code = "ECONNABORTED";
      jest
        .spyOn(httpService, "get")
        .mockReturnValue(throwError(() => timeoutError));

      const puuid = await service.getCurrentPlayerPuuid();
      expect(puuid).toBeNull();
    });
  });
});
