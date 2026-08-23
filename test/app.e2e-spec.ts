import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "./../src/app.module";
import { ValorantGateway } from "../src/gateway/valorant.gateway";
import { ValorantLocalService } from "../src/gateway/valorant-local.service";
import { ValorantHistoryService } from "../src/gateway/valorant-history.service";

describe("Valorant App Bootstrap (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("should bootstrap AppModule and resolve essential services", () => {
    expect(app).toBeDefined();
    expect(app.get(ValorantGateway)).toBeDefined();
    expect(app.get(ValorantLocalService)).toBeDefined();
    expect(app.get(ValorantHistoryService)).toBeDefined();
  });
});
