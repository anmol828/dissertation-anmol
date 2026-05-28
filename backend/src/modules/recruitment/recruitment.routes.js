import express from "express";
import { prisma } from "../../config/db.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

const requestInclude = {
  team: {
    include: {
      venue: { select: { id: true, name: true, city: true } },
      owner: { select: { id: true, name: true } }
    }
  },
  post: true,
  playerProfile: {
    include: {
      user: { select: { id: true, name: true } }
    }
  }
};

const getOwnPlayerProfile = async (userId) =>
  prisma.playerProfile.findUnique({
    where: { userId }
  });

const ensureTeamOwner = async (teamId, userId) => {
  const team = await prisma.team.findUnique({ where: { id: Number(teamId) } });
  if (!team) {
    const error = new Error("Team not found");
    error.status = 404;
    throw error;
  }
  if (team.ownerId !== userId) {
    const error = new Error("Only team owner can manage recruitment");
    error.status = 403;
    throw error;
  }
  return team;
};

// Public: visible recruitment posts
router.get("/posts", async (req, res, next) => {
  try {
    const posts = await prisma.recruitmentPost.findMany({
      where: {
        visibility: true,
        status: "OPEN",
        ...(req.query.teamId ? { teamId: Number(req.query.teamId) } : {})
      },
      include: {
        team: {
          include: {
            venue: { select: { id: true, name: true, city: true } },
            members: true
          }
        },
        _count: {
          select: { requests: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

// Team owner: create recruitment post
router.post("/posts", authenticate, async (req, res, next) => {
  try {
    const {
      teamId,
      title,
      description,
      neededPosition,
      skillLevel,
      visibility = true,
      status = "OPEN"
    } = req.body;

    if (!teamId || !title?.trim()) {
      return res.status(400).json({ message: "teamId and title are required" });
    }
    if (neededPosition && !["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"].includes(neededPosition)) {
      return res.status(400).json({ message: "Invalid needed position" });
    }
    if (skillLevel && !["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(skillLevel)) {
      return res.status(400).json({ message: "Invalid skill level" });
    }
    if (!["OPEN", "CLOSED"].includes(status)) {
      return res.status(400).json({ message: "Invalid post status" });
    }

    await ensureTeamOwner(teamId, req.user.id);

    const post = await prisma.recruitmentPost.create({
      data: {
        teamId: Number(teamId),
        title: title.trim(),
        description: description?.trim() || null,
        neededPosition: neededPosition || null,
        skillLevel: skillLevel || null,
        visibility: Boolean(visibility),
        status
      }
    });

    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
});

// Team owner: update recruitment post visibility/status/details
router.put("/posts/:id", authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const post = await prisma.recruitmentPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: "Recruitment post not found" });
    }
    await ensureTeamOwner(post.teamId, req.user.id);

    const { title, description, neededPosition, skillLevel, visibility, status } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (neededPosition && !["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"].includes(neededPosition)) {
      return res.status(400).json({ message: "Invalid needed position" });
    }
    if (skillLevel && !["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(skillLevel)) {
      return res.status(400).json({ message: "Invalid skill level" });
    }
    if (status && !["OPEN", "CLOSED"].includes(status)) {
      return res.status(400).json({ message: "Invalid post status" });
    }

    const updated = await prisma.recruitmentPost.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        neededPosition: neededPosition || null,
        skillLevel: skillLevel || null,
        visibility: Boolean(visibility),
        status: status || post.status
      }
    });

    res.json({ post: updated });
  } catch (err) {
    next(err);
  }
});

// Player: request to join a recruitment post
router.post("/posts/:id/apply", authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const profile = await getOwnPlayerProfile(req.user.id);
    if (!profile) {
      return res.status(400).json({ message: "Create a player profile before applying" });
    }

    const post = await prisma.recruitmentPost.findUnique({
      where: { id },
      include: { team: true }
    });
    if (!post || !post.visibility || post.status !== "OPEN") {
      return res.status(404).json({ message: "Recruitment post is not open" });
    }

    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: post.teamId,
        playerProfileId: profile.id
      }
    });
    if (existingMember) {
      return res.status(409).json({ message: "You are already on this team" });
    }

    const existingRequest = await prisma.recruitmentRequest.findFirst({
      where: {
        teamId: post.teamId,
        playerProfileId: profile.id,
        status: "PENDING"
      }
    });
    if (existingRequest) {
      return res.status(409).json({ message: "A pending request already exists for this team" });
    }

    const request = await prisma.recruitmentRequest.create({
      data: {
        teamId: post.teamId,
        postId: post.id,
        playerProfileId: profile.id,
        message: req.body.message?.trim() || null,
        status: "PENDING"
      },
      include: requestInclude
    });

    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
});

// Team owner: send recruitment request to player
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { teamId, playerProfileId, message } = req.body;
    if (!teamId || !playerProfileId) {
      return res
        .status(400)
        .json({ message: "teamId and playerProfileId are required" });
    }

    await ensureTeamOwner(teamId, req.user.id);

    const playerProfile = await prisma.playerProfile.findUnique({
      where: { id: Number(playerProfileId) }
    });
    if (!playerProfile) {
      return res.status(404).json({ message: "Player profile not found" });
    }

    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: Number(teamId),
        playerProfileId: Number(playerProfileId)
      }
    });
    if (existingMember) {
      return res.status(409).json({ message: "Player is already on this team" });
    }

    const existingRequest = await prisma.recruitmentRequest.findFirst({
      where: {
        teamId: Number(teamId),
        playerProfileId: Number(playerProfileId),
        status: "PENDING"
      }
    });
    if (existingRequest) {
      return res.status(409).json({ message: "A pending request already exists" });
    }

    const request = await prisma.recruitmentRequest.create({
      data: {
        teamId: Number(teamId),
        playerProfileId: Number(playerProfileId),
        message: message?.trim() || null,
        status: "PENDING"
      },
      include: requestInclude
    });

    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
});

// Player: view incoming recruitment requests
router.get("/incoming", authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile) {
      return res.status(400).json({ message: "No player profile found" });
    }

    const requests = await prisma.recruitmentRequest.findMany({
      where: { playerProfileId: profile.id },
      include: requestInclude,
      orderBy: { updatedAt: "desc" }
    });

    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

// Team owner: view outgoing recruitment requests
router.get("/outgoing", authenticate, async (req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      where: { ownerId: req.user.id },
      select: { id: true }
    });
    const teamIds = teams.map((t) => t.id);

    const requests = await prisma.recruitmentRequest.findMany({
      where: { teamId: { in: teamIds } },
      include: requestInclude,
      orderBy: { updatedAt: "desc" }
    });

    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

// Player: respond to recruitment request (accept/reject)
router.post("/:id/respond", authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, responseNote } = req.body;
    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await prisma.recruitmentRequest.findUnique({
      where: { id },
      include: {
        playerProfile: true
      }
    });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Ensure current user is the player
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile || profile.id !== request.playerProfileId) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (request.status !== "PENDING") {
      return res.status(409).json({ message: "This request has already been handled" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextRequest = await tx.recruitmentRequest.update({
        where: { id },
        data: { status, responseNote: responseNote?.trim() || null }
      });

      if (status === "ACCEPTED") {
        const existingMember = await tx.teamMember.findFirst({
          where: {
            teamId: request.teamId,
            playerProfileId: request.playerProfileId
          }
        });
        if (!existingMember) {
          await tx.teamMember.create({
            data: {
              teamId: request.teamId,
              playerProfileId: request.playerProfileId
            }
          });
        }
      }

      return nextRequest;
    });

    res.json({ request: updated });
  } catch (err) {
    next(err);
  }
});

// Team owner: approve/reject a player application
router.post("/:id/decision", authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, responseNote } = req.body;
    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await prisma.recruitmentRequest.findUnique({
      where: { id },
      include: { team: true }
    });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.team.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Only team owner can decide this request" });
    }
    if (request.status !== "PENDING") {
      return res.status(409).json({ message: "This request has already been handled" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextRequest = await tx.recruitmentRequest.update({
        where: { id },
        data: { status, responseNote: responseNote?.trim() || null }
      });

      if (status === "ACCEPTED") {
        const existingMember = await tx.teamMember.findFirst({
          where: {
            teamId: request.teamId,
            playerProfileId: request.playerProfileId
          }
        });
        if (!existingMember) {
          await tx.teamMember.create({
            data: {
              teamId: request.teamId,
              playerProfileId: request.playerProfileId
            }
          });
        }
      }

      return nextRequest;
    });

    res.json({ request: updated });
  } catch (err) {
    next(err);
  }
});

export default router;

