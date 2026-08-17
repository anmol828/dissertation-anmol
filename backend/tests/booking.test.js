import request from "supertest";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { activeUser, authHeader, getApp, mockPrisma, resetPrismaMocks } from "./test-utils.js";

let app;

beforeEach(async () => {
  resetPrismaMocks();
  app = await getApp();
});

describe("booking routes", () => {
  test("lists confirmed bookings for a court", async () => {
    const bookings = [{ id: 1, courtId: 7, status: "CONFIRMED" }];
    mockPrisma.booking.findMany.mockResolvedValue(bookings);

    const res = await request(app).get("/api/bookings/court/7");

    expect(res.status).toBe(200);
    expect(res.body.bookings).toEqual(bookings);
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
      where: { courtId: 7, status: "CONFIRMED" },
      orderBy: { startTime: "asc" }
    });
  });

  test("requires authentication to create a booking", async () => {
    const res = await request(app).post("/api/bookings").send({});

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("rejects booking payloads with missing fields", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(activeUser());

    const res = await request(app)
      .post("/api/bookings")
      .set(authHeader())
      .send({ courtId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("courtId, startTime, endTime are required");
  });

  test("creates a booking when the court is available", async () => {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    start.setUTCMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const court = {
      id: 2,
      isActive: true,
      venue: {
        pricingRules: [
          {
            dayOfWeek: "FRIDAY",
            startTime: "00:00",
            endTime: "23:59",
            hourlyRate: 1200
          }
        ]
      }
    };
    const booking = { id: 9, courtId: 2, userId: 1, totalPrice: 1200, status: "CONFIRMED" };

    mockPrisma.user.findUnique.mockResolvedValue(activeUser());
    mockPrisma.court.findUnique.mockResolvedValue(court);
    mockPrisma.booking.findFirst.mockResolvedValue(null);
    mockPrisma.booking.create.mockResolvedValue(booking);

    const res = await request(app).post("/api/bookings").set(authHeader()).send({
      courtId: 2,
      startTime: start.toISOString(),
      endTime: end.toISOString()
    });

    expect(res.status).toBe(201);
    expect(res.body.booking).toEqual(booking);
  });
});
