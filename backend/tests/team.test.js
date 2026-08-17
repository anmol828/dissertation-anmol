import request from "supertest";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { activeUser, authHeader, getApp, mockPrisma, resetPrismaMocks } from "./test-utils.js";

let app;

beforeEach(async () => {
  resetPrismaMocks();
  app = await getApp();
});

describe("team routes", () => {
  test("lists public teams", async () => {
    const teams = [{ id: 1, name: "City Five" }];
    mockPrisma.team.findMany.mockResolvedValue(teams);

    const res = await request(app).get("/api/teams");

    expect(res.status).toBe(200);
    expect(res.body.teams).toEqual(teams);
  });

  test("requires authentication to create a team", async () => {
    const res = await request(app).post("/api/teams").send({ name: "City Five" });

    expect(res.status).toBe(401);
  });

  test("validates team name", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(activeUser());

    const res = await request(app).post("/api/teams").set(authHeader()).send({ name: " " });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Team name is required");
  });

  test("creates a regular team for the authenticated owner", async () => {
    const created = { id: 4, name: "City Five", ownerId: 1, isHomeTeam: false };
    mockPrisma.user.findUnique.mockResolvedValue(activeUser());
    mockPrisma.team.create.mockResolvedValue(created);
    mockPrisma.teamMember.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.team.findUnique.mockResolvedValue({ ...created, members: [] });

    const res = await request(app).post("/api/teams").set(authHeader()).send({
      name: " City Five ",
      skillLevel: "INTERMEDIATE"
    });

    expect(res.status).toBe(201);
    expect(res.body.team).toMatchObject({ id: 4, name: "City Five" });
  });
});
