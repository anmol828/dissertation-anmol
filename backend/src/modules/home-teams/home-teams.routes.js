import express from "express";
import { prisma } from "../../config/db.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { uploadTeamImage } from "../../middlewares/upload.js";

const router = express.Router();

const homeTeamInclude = {
  venue: { select: { id: true, name: true, city: true, address: true } },
  players: { orderBy: { sortOrder: "asc" } },
  availability: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }
};

const validSkillLevels = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
const validDays = new Set([
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
]);

const ensureVenueAccess = async (user, venueId) => {
  const venue = venueId
    ? await prisma.venue.findUnique({ where: { id: Number(venueId) } })
    : await prisma.venue.findFirst({ where: { adminId: user.id } });

  if (!venue) {
    const error = new Error("Venue not found for this account");
    error.status = 404;
    throw error;
  }
  if (user.role === "VENUE_ADMIN" && venue.adminId !== user.id) {
    const error = new Error("Cannot manage home teams for this venue");
    error.status = 403;
    throw error;
  }

  return venue;
};

const validatePayload = ({ name, skillLevel, players = [], availability = [] }) => {
  if (!name?.trim()) return "Home team name is required";
  if (!validSkillLevels.has(skillLevel)) return "Valid skill level is required";
  if (!Array.isArray(players) || players.some((player) => !player.name?.trim())) {
    return "Each home team player must have a name";
  }
  if (
    !Array.isArray(availability) ||
    availability.length === 0 ||
    availability.some(
      (slot) =>
        !validDays.has(slot.dayOfWeek) ||
        !slot.startTime ||
        !slot.endTime ||
        slot.startTime >= slot.endTime
    )
  ) {
    return "At least one valid availability row is required";
  }
  return "";
};

router.post(
  "/upload-image",
  authenticate,
  authorize("VENUE_ADMIN", "ADMIN"),
  uploadTeamImage.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      res.json({ imageUrl: `/uploads/teams/${req.file.filename}` });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/", async (req, res, next) => {
  try {
    const teams = await prisma.homeTeam.findMany({
      where: {
        ...(req.query.venueId ? { venueId: Number(req.query.venueId) } : {}),
        ...(req.query.skillLevel ? { skillLevel: req.query.skillLevel } : {})
      },
      include: homeTeamInclude,
      orderBy: { updatedAt: "desc" }
    });

    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/mine",
  authenticate,
  authorize("VENUE_ADMIN", "ADMIN"),
  async (req, res, next) => {
    try {
      const venue = await ensureVenueAccess(req.user, req.query.venueId);
      const teams = await prisma.homeTeam.findMany({
        where: { venueId: venue.id },
        include: homeTeamInclude,
        orderBy: { updatedAt: "desc" }
      });

      res.json({ teams });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  authenticate,
  authorize("VENUE_ADMIN", "ADMIN"),
  async (req, res, next) => {
    try {
      const { venueId, name, imageUrl, skillLevel, players, availability } = req.body;
      const venue = await ensureVenueAccess(req.user, venueId);
      const validationError = validatePayload({ name, skillLevel, players, availability });
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const created = await prisma.homeTeam.create({
        data: {
          venueId: venue.id,
          name: name.trim(),
          imageUrl: imageUrl?.trim() || null,
          skillLevel,
          players: {
            create: players.map((player, index) => ({
              name: player.name.trim(),
              sortOrder: index
            }))
          },
          availability: {
            create: availability.map((slot) => ({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime
            }))
          }
        },
        include: homeTeamInclude
      });

      res.status(201).json({ team: created });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  authenticate,
  authorize("VENUE_ADMIN", "ADMIN"),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { name, imageUrl, skillLevel, players, availability } = req.body;
      const existing = await prisma.homeTeam.findUnique({
        where: { id },
        include: { venue: true }
      });

      if (!existing) {
        return res.status(404).json({ message: "Home team not found" });
      }
      await ensureVenueAccess(req.user, existing.venueId);

      const validationError = validatePayload({ name, skillLevel, players, availability });
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.homeTeamPlayer.deleteMany({ where: { homeTeamId: id } });
        await tx.homeTeamAvailability.deleteMany({ where: { homeTeamId: id } });

        return tx.homeTeam.update({
          where: { id },
          data: {
            name: name.trim(),
            imageUrl: imageUrl?.trim() || null,
            skillLevel,
            players: {
              create: players.map((player, index) => ({
                name: player.name.trim(),
                sortOrder: index
              }))
            },
            availability: {
              create: availability.map((slot) => ({
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime
              }))
            }
          },
          include: homeTeamInclude
        });
      });

      res.json({ team: updated });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  authorize("VENUE_ADMIN", "ADMIN"),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = await prisma.homeTeam.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ message: "Home team not found" });
      }
      await ensureVenueAccess(req.user, existing.venueId);

      await prisma.$transaction(async (tx) => {
        await tx.homeTeamPlayer.deleteMany({ where: { homeTeamId: id } });
        await tx.homeTeamAvailability.deleteMany({ where: { homeTeamId: id } });
        await tx.homeTeam.delete({ where: { id } });
      });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
