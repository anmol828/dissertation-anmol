import express from "express";
import { prisma } from "../../config/db.js";
import { authenticate } from "../../middlewares/auth.js";
import { calculateBookingPrice } from "../venues/venue.utils.js";

const router = express.Router();

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * ONE_HOUR_MS;

const isValidOneHourMultiple = (start, end) => {
  const diff = end.getTime() - start.getTime();
  return diff >= ONE_HOUR_MS && diff % ONE_HOUR_MS === 0;
};

// Public: get bookings for a court (for availability view)
router.get("/court/:courtId", async (req, res, next) => {
  try {
    const courtId = Number(req.params.courtId);
    const bookings = await prisma.booking.findMany({
      where: { courtId, status: "CONFIRMED" },
      orderBy: { startTime: "asc" }
    });
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// Authenticated: create booking
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { courtId, startTime, endTime } = req.body;

    if (!courtId || !startTime || !endTime) {
      return res.status(400).json({ message: "courtId, startTime, endTime are required" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: "Bookings must be made for a future time" });
    }

    if (!isValidOneHourMultiple(start, end)) {
      return res
        .status(400)
        .json({ message: "Booking duration must be a multiple of 1 hour" });
    }

    const court = await prisma.court.findUnique({
      where: { id: Number(courtId) },
      include: {
        venue: {
          include: {
            pricingRules: true
          }
        }
      }
    });

    if (!court || !court.isActive) {
      return res.status(404).json({ message: "Court not found" });
    }

    const overlapping = await prisma.booking.findFirst({
      where: {
        courtId: Number(courtId),
        status: "CONFIRMED",
        startTime: { lt: end },
        endTime: { gt: start }
      }
    });

    if (overlapping) {
      return res.status(409).json({ message: "Time slot already booked" });
    }

    const pricingResult = calculateBookingPrice(start, end, court.venue.pricingRules || []);
    if (pricingResult.error) {
      return res.status(400).json({ message: pricingResult.error });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        courtId: Number(courtId),
        startTime: start,
        endTime: end,
        totalPrice: pricingResult.totalPrice,
        status: "CONFIRMED"
      },
      include: {
        court: {
          include: {
            venue: true
          }
        }
      }
    });

    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
});

// Authenticated: get own bookings
router.get(["/me", "/my"], authenticate, async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        court: {
          include: {
            venue: true
          }
        }
      },
      orderBy: { startTime: "desc" }
    });
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// Authenticated: cancel own booking if more than 2 hours before start
router.post("/:id/cancel", authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ message: "Cannot cancel this booking" });
    }

    const now = new Date();
    const start = new Date(booking.startTime);

    if (start.getTime() - now.getTime() < TWO_HOURS_MS) {
      return res
        .status(400)
        .json({ message: "Cancellations are only allowed at least 2 hours before start time" });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    res.json({ booking: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
