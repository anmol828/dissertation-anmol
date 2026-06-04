import express from "express";
import { prisma } from "../../config/db.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { uploadTeamImage } from "../../middlewares/upload.js";

const router = express.Router();

const teamInclude = {
  owner: { select: { id: true, name: true } },
  venue: { select: { id: true, name: true, city: true, address: true } },
  members: {
    include: {
      playerProfile: {
        include: { user: { select: { id: true, name: true } } }
      }
    }
  },
  recruitmentPosts: {
    orderBy: { createdAt: "desc" }
  }
};

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
    const error = new Error("Cannot manage teams for this venue");
    error.status = 403;
    throw error;
  }
  return venue;
};

const syncTeamMembers = async (tx, teamId, playerProfileIds = []) => {
  const nextIds = [...new Set((playerProfileIds || []).map(Number).filter(Boolean))];

  await tx.teamMember.deleteMany({
    where: {
      teamId,
      ...(nextIds.length ? { playerProfileId: { notIn: nextIds } } : {})
    }
  });

  if (nextIds.length > 0) {
    const existingMembers = await tx.teamMember.findMany({
      where: { teamId, playerProfileId: { in: nextIds } },
      select: { playerProfileId: true }
    });
    const existingIds = new Set(existingMembers.map((member) => member.playerProfileId));
    const createIds = nextIds.filter((playerProfileId) => !existingIds.has(playerProfileId));

    await tx.teamMember.createMany({
      data: createIds.map((playerProfileId) => ({ teamId, playerProfileId }))
    });
  }
};

router.post(
  "/upload-image",
  authenticate,
  authorize("VENUE_ADMIN", "ADMIN", "PLAYER"),
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

// Public: venue-linked home teams for the landing page and venue pages
router.get("/home", async (req, res, next) => {
  try {
    const where = {
      isHomeTeam: true,
      ...(req.query.venueId ? { venueId: Number(req.query.venueId) } : {})
    };

    const teams = await prisma.team.findMany({
      where,
      include: teamInclude,
      orderBy: { updatedAt: "desc" }
    });
    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

// Venue owner/admin: list manageable home teams
router.get(
  "/venue-admin",
  authenticate,
  authorize("VENUE_ADMIN", "ADMIN"),
  async (req, res, next) => {
    try {
      const venue = await ensureVenueAccess(req.user, req.query.venueId);
      const teams = await prisma.team.findMany({
        where: { venueId: venue.id, isHomeTeam: true },
        include: teamInclude,
        orderBy: { updatedAt: "desc" }
      });

      res.json({ teams });
    } catch (err) {
      next(err);
    }
  }
);

// Public: list teams
router.get("/", async (req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      include: teamInclude,
      orderBy: { updatedAt: "desc" }
    });
    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

// Authenticated: create team (player or normal user)
router.post("/", authenticate, async (req, res, next) => {
  try {
    const {
      name,
      venueId,
      logoImageUrl,
      captainName,
      skillLevel,
      availability,
      isHomeTeam,
      playerProfileIds
    } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }
    if (skillLevel && !["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(skillLevel)) {
      return res.status(400).json({ message: "Invalid skill level" });
    }

    let venue = null;
    const creatingHomeTeam = Boolean(isHomeTeam) || req.user.role === "VENUE_ADMIN";
    if (creatingHomeTeam) {
      if (!["VENUE_ADMIN", "ADMIN"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only venue owners can create home teams" });
      }
      venue = await ensureVenueAccess(req.user, venueId);
    }

    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name: String(name).trim(),
          ownerId: req.user.id,
          venueId: venue?.id || null,
          logoImageUrl: logoImageUrl?.trim() || null,
          captainName: captainName?.trim() || null,
          skillLevel: skillLevel || null,
          availability: availability?.trim() || null,
          isHomeTeam: creatingHomeTeam
        }
      });

      await syncTeamMembers(tx, created.id, playerProfileIds);
      return created;
    });

    const createdTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: teamInclude
    });

    res.status(201).json({ team: createdTeam });
  } catch (err) {
    next(err);
  }
});

// Authenticated: get own teams (as owner)
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      where: { ownerId: req.user.id },
      include: teamInclude,
      orderBy: { updatedAt: "desc" }
    });
    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

// Authenticated: get own and joined teams
router.get("/my", authenticate, async (req, res, next) => {
  try {
    const playerProfile = await prisma.playerProfile.findUnique({
      where: { userId: req.user.id }
    });

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          ...(playerProfile ? [{ members: { some: { playerProfileId: playerProfile.id } } }] : [])
        ]
      },
      include: teamInclude,
      orderBy: { updatedAt: "desc" }
    });
    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

// Owner or venue admin: update team details and player list
router.put("/:teamId", authenticate, async (req, res, next) => {
  try {
    const teamId = Number(req.params.teamId);
    const {
      name,
      logoImageUrl,
      captainName,
      skillLevel,
      availability,
      visibility,
      playerProfileIds
    } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { venue: true }
    });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    const canManage =
      team.ownerId === req.user.id ||
      req.user.role === "ADMIN" ||
      (req.user.role === "VENUE_ADMIN" && team.venue?.adminId === req.user.id);

    if (!canManage) {
      return res.status(403).json({ message: "Not allowed to update this team" });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }
    if (skillLevel && !["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(skillLevel)) {
      return res.status(400).json({ message: "Invalid skill level" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id: teamId },
        data: {
          name: String(name).trim(),
          logoImageUrl: logoImageUrl?.trim() || null,
          captainName: captainName?.trim() || null,
          skillLevel: skillLevel || null,
          availability: availability?.trim() || null,
          ...(typeof visibility === "boolean" ? { isHomeTeam: visibility } : {})
        }
      });
      await syncTeamMembers(tx, teamId, playerProfileIds);
    });

    const updated = await prisma.team.findUnique({
      where: { id: teamId },
      include: teamInclude
    });

    res.json({ team: updated });
  } catch (err) {
    next(err);
  }
});

// Owner: remove player from team
router.delete("/:teamId/members/:memberId", authenticate, async (req, res, next) => {
  try {
    const teamId = Number(req.params.teamId);
    const memberId = Number(req.params.memberId);

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Not team owner" });
    }

    await prisma.teamMember.delete({
      where: { id: memberId }
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Admin only: delete team
router.delete(
  "/:teamId",
  authenticate,
  authorize("ADMIN"),
  async (req, res, next) => {
    try {
      const teamId = Number(req.params.teamId);
      await prisma.team.delete({ where: { id: teamId } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;

