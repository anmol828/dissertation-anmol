import request from "supertest";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { activeUser, authHeader, getApp, mockPrisma, resetPrismaMocks } from "./test-utils.js";

let app;

beforeEach(async () => {
  resetPrismaMocks();
  app = await getApp();
});

describe("recruitment routes", () => {
  test("lists visible open recruitment posts", async () => {
    const posts = [{ id: 1, title: "Need a keeper", visibility: true, status: "OPEN" }];
    mockPrisma.recruitmentPost.findMany.mockResolvedValue(posts);

    const res = await request(app).get("/api/recruitment/posts");

    expect(res.status).toBe(200);
    expect(res.body.posts).toEqual(posts);
  });

  test("requires teamId and title to create a post", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(activeUser());

    const res = await request(app).post("/api/recruitment/posts").set(authHeader()).send({
      title: ""
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("teamId and title are required");
  });

  test("creates a recruitment post for the team owner", async () => {
    const team = { id: 3, ownerId: 1 };
    const post = { id: 8, teamId: 3, title: "Need a defender", status: "OPEN" };
    mockPrisma.user.findUnique.mockResolvedValue(activeUser());
    mockPrisma.team.findUnique.mockResolvedValue(team);
    mockPrisma.recruitmentPost.create.mockResolvedValue(post);

    const res = await request(app).post("/api/recruitment/posts").set(authHeader()).send({
      teamId: 3,
      title: "Need a defender",
      neededPosition: "DEFENDER",
      skillLevel: "BEGINNER"
    });

    expect(res.status).toBe(201);
    expect(res.body.post).toEqual(post);
  });

  test("returns empty incoming requests when the player has no profile", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(activeUser({ role: "PLAYER" }));
    mockPrisma.playerProfile.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/recruitment/incoming").set(authHeader(1, "PLAYER"));

    expect(res.status).toBe(200);
    expect(res.body.requests).toEqual([]);
  });
});
