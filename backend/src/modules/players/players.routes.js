import express from "express";
import { prisma } from "../../config/db.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { uploadPlayerImage } from "../../middlewares/upload.js";

const router = express.Router();

const profileInclude = {
  user: {
    select: { id: true, name: true, email: true }
  },
  teamMembers: {
    include: {
      team: {
        select: { id: true, name: true }
      }
    }
  }
};

router.post(
  "/me/upload-image",
  authenticate,
  authorize("PLAYER"),
  uploadPlayerImage.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const profileImageUrl = `/uploads/players/${req.file.filename}`;
      const existing = await prisma.playerProfile.findUnique({
        where: { userId: req.user.id }
      });

      if (!existing) {
        return res.json({ profileImageUrl });
      }

      const profile = await prisma.playerProfile.update({
        where: { userId: req.user.id },
        data: { profileImageUrl },
        include: profileInclude
      });

      return res.json({ profile, profileImageUrl });
    } catch (err) {
      return next(err);
    }
  }
);

// Public: search players with filters
router.get("/", async (req, res, next) => {
  try {
    const {
      q,
      position,
      skill,
      status,
      preferredFoot,
      city,
      minAge,
      maxAge,
      jerseyNumber,
      preferredPlayTime
    } = req.query;

    const where = {};
    if (q) {
      where.OR = [
        { city: { contains: String(q) } },
        { bio: { contains: String(q) } },
        { preferredPlayTime: { contains: String(q) } },
        { user: { name: { contains: String(q) } } }
      ];
    }
    if (position) {
      where.position = position;
    }
    if (skill) {
      where.skill = skill;
    }
    if (status) {
      where.status = status;
    }
    if (preferredFoot) {
      where.preferredFoot = preferredFoot;
    }
    if (city) {
      where.city = { contains: String(city) };
    }
    if (minAge || maxAge) {
      where.age = {
        ...(minAge ? { gte: Number(minAge) } : {}),
        ...(maxAge ? { lte: Number(maxAge) } : {})
      };
    }
    if (jerseyNumber) {
      where.jerseyNumber = Number(jerseyNumber);
    }
    if (preferredPlayTime) {
      where.preferredPlayTime = { contains: String(preferredPlayTime) };
    }

    const players = await prisma.playerProfile.findMany({
      where,
      include: profileInclude,
      orderBy: { updatedAt: "desc" }
    });

    res.json({ players });
  } catch (err) {
    next(err);
  }
});

router.get("/featured", async (req, res, next) => {
  try {
    const players = await prisma.playerProfile.findMany({
      include: profileInclude
    });

    const scored = players
      .map((player) => {
        const completion = [
          player.bio,
          player.city,
          player.phone,
          player.profileImageUrl,
          player.preferredPlayTime,
          player.jerseyNumber
        ].filter(Boolean).length;

        return {
          ...player,
          score: completion + (player.teamMembers?.length || 0) * 2
        };
      })
      .filter((player) => player.status !== "UNAVAILABLE")
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    res.json({ players: scored });
  } catch (err) {
    next(err);
  }
});

// Player: create or update own profile
router.post(
  "/me",
  authenticate,
  authorize("PLAYER"),
  async (req, res, next) => {
    try {
      const {
        age,
        city,
        phone,
        profileImageUrl,
        position,
        skill,
        preferredFoot,
        status,
        preferredPlayTime,
        jerseyNumber,
        bio
      } = req.body;

      if (!age || !position || !skill || !preferredFoot || !status) {
        return res.status(400).json({
          message: "age, position, skill, preferredFoot, and status are required"
        });
      }
      if (Number(age) < 10 || Number(age) > 70) {
        return res.status(400).json({ message: "Age must be between 10 and 70" });
      }

      const existing = await prisma.playerProfile.findUnique({
        where: { userId: req.user.id }
      });

      let profile;
      if (existing) {
        profile = await prisma.playerProfile.update({
          where: { userId: req.user.id },
          data: {
            age,
            city,
            phone,
            profileImageUrl,
            position,
            skill,
            preferredFoot,
            status,
            preferredPlayTime,
            jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
            bio
          },
          include: profileInclude
        });
      } else {
        profile = await prisma.playerProfile.create({
          data: {
            userId: req.user.id,
            age,
            city,
            phone,
            profileImageUrl,
            position,
            skill,
            preferredFoot,
            status,
            preferredPlayTime,
            jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
            bio
          },
          include: profileInclude
        });
      }

      res.json({ profile });
    } catch (err) {
      next(err);
    }
  }
);

// Player: get own profile
router.get(
  "/me",
  authenticate,
  authorize("PLAYER"),
  async (req, res, next) => {
    try {
      const profile = await prisma.playerProfile.findUnique({
        where: { userId: req.user.id },
        include: profileInclude
      });
      res.json({ profile });
    } catch (err) {
      next(err);
    }
  }
);

// Public: player profile detail
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid player profile id" });
    }

    const profile = await prisma.playerProfile.findUnique({
      where: { id },
      include: profileInclude
    });

    if (!profile) {
      return res.status(404).json({ message: "Player profile not found" });
    }

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

export default router;
