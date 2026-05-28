import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn
  });
  const refreshToken = jwt.sign({ userId, role }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn
  });
  return { accessToken, refreshToken };
};

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" }
    });

    let finalRole = "USER";
    if (role === "PLAYER") {
      finalRole = "PLAYER";
    } else if (role === "ADMIN" && adminCount === 0) {
      finalRole = "ADMIN";
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: finalRole
      }
    });

    const tokens = generateTokens(user.id, user.role);
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tokens = generateTokens(user.id, user.role);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    const payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
    const tokens = generateTokens(payload.userId, payload.role);
    res.json(tokens);
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.get("/bootstrap", async (req, res, next) => {
  try {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" }
    });

    res.json({ allowAdminRegistration: adminCount === 0 });
  } catch (err) {
    next(err);
  }
});

export default router;

