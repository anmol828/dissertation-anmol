import express from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/db.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
  buildUniqueSlug,
  validatePricingRules
} from "../venues/venue.utils.js";

const router = express.Router();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const validateVenuePayload = ({
  ownerName,
  ownerEmail,
  ownerPassword,
  venueName,
  address,
  city,
  hourlyRate,
  courts,
  pricingRules,
  galleryImages = [],
  mapsUrl,
  requirePassword = true
}) => {
  if (!ownerName || !ownerEmail || !venueName || !address || !city || !hourlyRate) {
    return "Missing required venue or owner fields";
  }
  if (!isValidEmail(ownerEmail)) {
    return "Please provide a valid venue admin email address";
  }
  if (requirePassword && String(ownerPassword || "").length < 6) {
    return "Temporary password must be at least 6 characters long";
  }
  if (!requirePassword && ownerPassword && String(ownerPassword).length < 6) {
    return "Updated password must be at least 6 characters long";
  }
  if (Number(hourlyRate) <= 0) {
    return "Hourly rate must be greater than 0";
  }
  if (!Array.isArray(courts) || courts.length === 0 || courts.some((court) => !court.name?.trim())) {
    return "At least one valid court name is required";
  }
  if (
    !Array.isArray(galleryImages) ||
    galleryImages.some((image) => image.imageUrl && !String(image.imageUrl).trim())
  ) {
    return "Venue gallery items must include valid image URLs";
  }
  if (mapsUrl && !/^https?:\/\/.+/i.test(String(mapsUrl).trim())) {
    return "Maps URL must start with http:// or https://";
  }

  return validatePricingRules(pricingRules);
};

router.use(authenticate, authorize("ADMIN"));

router.get("/dashboard", async (req, res, next) => {
  try {
    const [users, players, venueAdmins, venues, bookings] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "PLAYER" } }),
      prisma.user.count({ where: { role: "VENUE_ADMIN" } }),
      prisma.venue.count(),
      prisma.booking.count()
    ]);

    const recentVenues = await prisma.venue.findMany({
      include: {
        admin: {
          select: { id: true, name: true, email: true }
        },
        courts: true
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    res.json({
      stats: { users, players, venueAdmins, venues, bookings },
      recentVenues
    });
  } catch (err) {
    next(err);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        managedVenue: {
          select: { id: true, name: true }
        },
        playerProfile: {
          select: { id: true, position: true, status: true, skill: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.get("/venues", async (req, res, next) => {
  try {
    const venues = await prisma.venue.findMany({
      include: {
        admin: {
          select: { id: true, name: true, email: true, isActive: true }
        },
        courts: true,
        pricingRules: true,
        galleryImages: {
          orderBy: { sortOrder: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ venues });
  } catch (err) {
    next(err);
  }
});

router.post("/venues", async (req, res, next) => {
  try {
    const {
      ownerName,
      ownerEmail,
      ownerPassword,
      venueName,
      description,
      address,
      city,
      phone,
      galleryImages,
      latitude,
      longitude,
      mapsUrl,
      hourlyRate,
      courts,
      pricingRules
    } = req.body;

    const validationError = validateVenuePayload({
      ownerName,
      ownerEmail,
      ownerPassword,
      venueName,
      address,
      city,
      hourlyRate,
      courts,
      pricingRules,
      galleryImages,
      mapsUrl,
      requirePassword: true
    });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail }
    });
    if (existingUser) {
      return res.status(409).json({ message: "Venue admin email already exists" });
    }

    const slug = await buildUniqueSlug(prisma, venueName);
    const passwordHash = await bcrypt.hash(ownerPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const venueAdmin = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          passwordHash,
          role: "VENUE_ADMIN"
        }
      });

      const venue = await tx.venue.create({
        data: {
          name: venueName,
          slug,
          description,
          address,
          city,
          phone,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          mapsUrl: mapsUrl?.trim() || null,
          hourlyRate: Number(hourlyRate),
          adminId: venueAdmin.id,
          courts: {
            create:
              Array.isArray(courts) && courts.length > 0
                ? courts.map((court) => ({
                    name: court.name,
                    isActive: court.isActive ?? true
                  }))
                : [{ name: "Main Court", isActive: true }]
          },
          pricingRules: {
            create: pricingRules.map((rule) => ({
              dayOfWeek: rule.dayOfWeek,
              startTime: rule.startTime,
              endTime: rule.endTime,
              hourlyRate: Number(rule.hourlyRate)
            }))
          },
          galleryImages: {
            create: (galleryImages || [])
              .filter((image) => image.imageUrl?.trim())
              .map((image, index) => ({
                imageUrl: image.imageUrl.trim(),
                caption: image.caption?.trim() || null,
                sortOrder: index
              }))
          }
        },
        include: {
          admin: {
            select: { id: true, name: true, email: true }
          },
          courts: true,
          pricingRules: true,
          galleryImages: true
        }
      });

      return { venueAdmin, venue };
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.put("/venues/:id", async (req, res, next) => {
  try {
    const venueId = Number(req.params.id);
    const {
      ownerName,
      ownerEmail,
      ownerPassword,
      venueName,
      description,
      address,
      city,
      phone,
      galleryImages,
      latitude,
      longitude,
      mapsUrl,
      hourlyRate,
      courts,
      pricingRules
    } = req.body;

    const validationError = validateVenuePayload({
      ownerName,
      ownerEmail,
      ownerPassword,
      venueName,
      address,
      city,
      hourlyRate,
      courts,
      pricingRules,
      galleryImages,
      mapsUrl,
      requirePassword: false
    });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingVenue = await prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        admin: true,
        courts: true,
        galleryImages: true
      }
    });

    if (!existingVenue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const emailOwner = await prisma.user.findUnique({
      where: { email: ownerEmail }
    });
    if (emailOwner && emailOwner.id !== existingVenue.adminId) {
      return res.status(409).json({ message: "Venue admin email already exists" });
    }

    const slug =
      venueName !== existingVenue.name
        ? await buildUniqueSlug(prisma, venueName, venueId)
        : existingVenue.slug;

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingVenue.adminId },
        data: {
          name: ownerName.trim(),
          email: ownerEmail.trim(),
          ...(ownerPassword
            ? {
                passwordHash: await bcrypt.hash(ownerPassword, 10)
              }
            : {})
        }
      });

      await tx.venue.update({
        where: { id: venueId },
        data: {
          name: venueName.trim(),
          slug,
          description,
          address: address.trim(),
          city: city.trim(),
          phone,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          mapsUrl: mapsUrl?.trim() || null,
          hourlyRate: Number(hourlyRate)
        }
      });

      await tx.venueImage.deleteMany({
        where: { venueId }
      });

      if (Array.isArray(galleryImages) && galleryImages.length > 0) {
        await tx.venueImage.createMany({
          data: galleryImages
            .filter((image) => image.imageUrl?.trim())
            .map((image, index) => ({
              venueId,
              imageUrl: image.imageUrl.trim(),
              caption: image.caption?.trim() || null,
              sortOrder: index
            }))
        });
      }

      await tx.venuePricingRule.deleteMany({
        where: { venueId }
      });

      await tx.venuePricingRule.createMany({
        data: pricingRules.map((rule) => ({
          venueId,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          hourlyRate: Number(rule.hourlyRate)
        }))
      });

      const incomingCourtIds = courts.filter((court) => court.id).map((court) => Number(court.id));
      const removableCourts = existingVenue.courts.filter((court) => !incomingCourtIds.includes(court.id));

      for (const court of removableCourts) {
        const activeBookings = await tx.booking.count({
          where: {
            courtId: court.id,
            status: "CONFIRMED",
            startTime: { gt: new Date() }
          }
        });

        if (activeBookings > 0) {
          const error = new Error(`Cannot remove court "${court.name}" because it has future bookings`);
          error.status = 409;
          throw error;
        }

        await tx.booking.deleteMany({
          where: { courtId: court.id }
        });
        await tx.court.delete({
          where: { id: court.id }
        });
      }

      for (const court of courts) {
        if (court.id) {
          await tx.court.update({
            where: { id: Number(court.id) },
            data: {
              name: court.name.trim(),
              isActive: court.isActive ?? true
            }
          });
        } else {
          await tx.court.create({
            data: {
              venueId,
              name: court.name.trim(),
              isActive: court.isActive ?? true
            }
          });
        }
      }

      return tx.venue.findUnique({
        where: { id: venueId },
        include: {
          admin: {
            select: { id: true, name: true, email: true, isActive: true }
          },
          courts: true,
          pricingRules: true,
          galleryImages: true
        }
      });
    });

    res.json({ venue: result });
  } catch (err) {
    next(err);
  }
});

router.delete("/venues/:id", async (req, res, next) => {
  try {
    const venueId = Number(req.params.id);

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        admin: true,
        courts: true
      }
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const courtIds = venue.courts.map((court) => court.id);
    const futureBookings = courtIds.length
      ? await prisma.booking.count({
          where: {
            courtId: { in: courtIds },
            status: "CONFIRMED",
            startTime: { gt: new Date() }
          }
        })
      : 0;

    if (futureBookings > 0) {
      return res.status(409).json({
        message: "Cannot delete a venue that still has future confirmed bookings"
      });
    }

    await prisma.$transaction(async (tx) => {
      if (courtIds.length > 0) {
        await tx.booking.deleteMany({
          where: { courtId: { in: courtIds } }
        });
      }

      await tx.venueImage.deleteMany({
        where: { venueId }
      });

      await tx.venuePricingRule.deleteMany({
        where: { venueId }
      });

      await tx.court.deleteMany({
        where: { venueId }
      });

      await tx.venue.delete({
        where: { id: venueId }
      });

      await tx.user.update({
        where: { id: venue.adminId },
        data: {
          isActive: false
        }
      });
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id/status", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) }
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
