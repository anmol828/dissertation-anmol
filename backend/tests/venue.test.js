import request from "supertest";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { activeUser, authHeader, getApp, mockPrisma, resetPrismaMocks } from "./test-utils.js";

let app;

beforeEach(async () => {
  resetPrismaMocks();
  app = await getApp();
});

describe("venue routes", () => {
  test("lists venues with public filters", async () => {
    const venues = [{ id: 1, name: "Central Futsal", city: "Kathmandu", courts: [{ id: 1 }] }];
    mockPrisma.venue.findMany.mockResolvedValue(venues);

    const res = await request(app).get("/api/venues?city=Kathmandu&courtCount=1");

    expect(res.status).toBe(200);
    expect(res.body.venues).toEqual(venues);
  });

  test("returns 404 when a venue is missing", async () => {
    mockPrisma.venue.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/venues/999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Venue not found");
  });

  test("requires a venue admin or admin to view the managed venue", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(activeUser({ role: "USER" }));

    const res = await request(app).get("/api/venues/mine").set(authHeader(1, "USER"));

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Forbidden");
  });

  test("returns the managed venue dashboard for a venue admin", async () => {
    const venueAdmin = activeUser({ id: 2, role: "VENUE_ADMIN" });
    const venue = { id: 5, name: "Central Futsal", adminId: 2, courts: [] };
    mockPrisma.user.findUnique.mockResolvedValue(venueAdmin);
    mockPrisma.venue.findFirst.mockResolvedValue(venue);
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const res = await request(app).get("/api/venues/mine").set(authHeader(2, "VENUE_ADMIN"));

    expect(res.status).toBe(200);
    expect(res.body.venue).toEqual(venue);
    expect(res.body.bookings).toEqual([]);
  });
});
