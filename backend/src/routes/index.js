import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import venuesRoutes from "../modules/venues/venues.routes.js";
import bookingsRoutes from "../modules/bookings/bookings.routes.js";
import playersRoutes from "../modules/players/players.routes.js";
import teamsRoutes from "../modules/teams/teams.routes.js";
import homeTeamsRoutes from "../modules/home-teams/home-teams.routes.js";
import recruitmentRoutes from "../modules/recruitment/recruitment.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/venues", venuesRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/players", playersRoutes);
router.use("/teams", teamsRoutes);
router.use("/home-teams", homeTeamsRoutes);
router.use("/recruitment", recruitmentRoutes);
router.use("/admin", adminRoutes);

export default router;

