import express from "express";
import { prisma } from "../../config/db.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { uploadVenueImage } from "../../middlewares/upload.js";
import {
  buildUniqueSlug,
  validatePricingRules
} from "./venue.utils.js";

const router = express.Router();

const venueInclude = {
  courts: {
    orderBy: { id: "asc" }
  },
  galleryImages: {
    orderBy: { sortOrder: "asc" }
  },
  pricingRules: {
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  },
  admin: {
    select: { id: true, name: true, email: true }
  }
};

// Public: list venues
router.get("/", async (req, res, next) => {
  try {
    const { q, city, minRate, maxRate, hasMaps, courtCount } = req.query;
    const where = {};

    if (q) {
      where.OR = [
        { name: { contains: String(q) } },
        { description: { contains: String(q) } },
        { address: { contains: String(q) } },
        { city: { contains: String(q) } },
        { phone: { contains: String(q) } }
      ];
    }
    if (city) {
      where.city = { contains: String(city) };
    }
    if (minRate || maxRate) {
      where.hourlyRate = {
        ...(minRate ? { gte: Number(minRate) } : {}),
        ...(maxRate ? { lte: Number(maxRate) } : {})
      };
    }
    if (hasMaps === "true") {
      where.mapsUrl = { not: null };
    }

    const venues = await prisma.venue.findMany({
      where,
      include: venueInclude,
      orderBy: { createdAt: "desc" }
    });

    const filtered = courtCount
      ? venues.filter((venue) => (venue.courts?.length || 0) >= Number(courtCount))
      : venues;

    res.json({ venues: filtered });
  } catch (err) {
    next(err);
  }
});

router.get("/featured", async (req, res, next) => {
  try {
    const venues = await prisma.venue.findMany({
      include: {
        courts: true,
        galleryImages: {
          orderBy: { sortOrder: "asc" }
        },
        pricingRules: true,
        _count: {
          select: {
            courts: true
          }
        }
      }
    });

    const scored = await Promise.all(
      venues.map(async (venue) => {
        const bookingsCount = await prisma.booking.count({
          where: {
            court: {
              venueId: venue.id
            },
            status: "CONFIRMED"
          }
        });

        return {
          ...venue,
          score:
            bookingsCount * 3 +
            (venue.pricingRules?.length || 0) * 2 +
            (venue.courts?.length || 0)
        };
      })
    );

    const featured = scored.sort((a, b) => b.score - a.score).slice(0, 3);
    res.json({ venues: featured });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/upload-image",
  authenticate,
  authorize("VENUE_ADMIN", "ADMIN"),
  uploadVenueImage.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const imageUrl = `/uploads/venues/${req.file.filename}`;
      return res.json({ imageUrl });
    } catch (err) {
      return next(err);
    }
  }
);

// Venue admin: own venue dashboard
router.get(
  "/mine",
  authenticate,
  authorize("VENUE_ADMIN", "ADMIN"),
  async (req, res, next) => {
    try {
      const where =
        req.user.role === "ADMIN"
          ? {}
          : {
              adminId: req.user.id
            };

      const venue = await prisma.venue.findFirst({
        where,
        include: {
          ...venueInclude,
          courts: {
            include: {
              bookings: {
                where: { status: "CONFIRMED" },
                orderBy: { startTime: "asc" },
                take: 5,
                include: {
                  user: {
                    select: { id: true, name: true, email: true, role: true }
                  }
                }
              }
            },
            orderBy: { id: "asc" }
          }
        }
      });

      if (!venue) {
        return res.status(404).json({ message: "Venue not found for this account" });
      }

      const bookings = await prisma.booking.findMany({
        where: {
          court: {
            venueId: venue.id
          }
        },
        include: {
          court: true,
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { startTime: "asc" },
        take: 20
      });

      res.json({ venue, bookings });
    } catch (err) {
      next(err);
    }
  }
);

// Public: get single venue
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: venueInclude
    });
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    res.json({ venue });
  } catch (err) {
    next(err);
  }
});

// Venue admin or admin: update venue details, pricing, and owned courts
router.put(
  "/:id",
  authenticate,
  authorize("VENUE_ADMIN", "ADMIN"),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const {
        name,
        description,
        address,
        city,
        phone,
        galleryImages,
        latitude,
        longitude,
        mapsUrl,
        hourlyRate,
        pricingRules,
        courts
      } = req.body;

      const existing = await prisma.venue.findUnique({
        where: { id },
        include: {
          courts: true,
          pricingRules: true
        }
      });
      if (!existing) {
        return res.status(404).json({ message: "Venue not found" });
      }

      if (req.user.role === "VENUE_ADMIN" && existing.adminId !== req.user.id) {
        return res.status(403).json({ message: "Cannot modify this venue" });
      }

      const pricingError = validatePricingRules(pricingRules);
      if (pricingError) {
        return res.status(400).json({ message: pricingError });
      }
      if (!name?.trim() || !address?.trim() || !city?.trim()) {
        return res.status(400).json({ message: "Venue name, address, and city are required" });
      }
      if (Number(hourlyRate ?? existing.hourlyRate) <= 0) {
        return res.status(400).json({ message: "Base hourly rate must be greater than 0" });
      }
      if (!Array.isArray(courts) || courts.some((court) => !court.name?.trim())) {
        return res.status(400).json({ message: "Each court must have a valid name" });
      }

      const nextSlug =
        name && name !== existing.name
          ? await buildUniqueSlug(prisma, name, existing.id)
          : existing.slug;

      const updated = await prisma.$transaction(async (tx) => {
        const venue = await tx.venue.update({
          where: { id },
          data: {
            name: name ?? existing.name,
            slug: nextSlug,
            description: description ?? existing.description,
            address: address ?? existing.address,
            city: city ?? existing.city,
            phone: phone ?? existing.phone,
            latitude: latitude ?? existing.latitude,
            longitude: longitude ?? existing.longitude,
            mapsUrl: mapsUrl?.trim() || null,
            hourlyRate: Number(hourlyRate ?? existing.hourlyRate)
          }
        });

        await tx.venueImage.deleteMany({
          where: { venueId: id }
        });

        if (Array.isArray(galleryImages) && galleryImages.length > 0) {
          await tx.venueImage.createMany({
            data: galleryImages
              .filter((image) => image.imageUrl?.trim())
              .map((image, index) => ({
                venueId: id,
                imageUrl: image.imageUrl.trim(),
                caption: image.caption?.trim() || null,
                sortOrder: index
              }))
          });
        }

        await tx.venuePricingRule.deleteMany({
          where: { venueId: id }
        });

        await tx.venuePricingRule.createMany({
          data: pricingRules.map((rule) => ({
            venueId: id,
            dayOfWeek: rule.dayOfWeek,
            startTime: rule.startTime,
            endTime: rule.endTime,
            hourlyRate: Number(rule.hourlyRate)
          }))
        });

        if (Array.isArray(courts)) {
          for (const court of courts) {
            if (court.id) {
              await tx.court.update({
                where: { id: Number(court.id) },
                data: {
                  name: court.name,
                  isActive: court.isActive ?? true
                }
              });
            } else if (court.name) {
              await tx.court.create({
                data: {
                  venueId: id,
                  name: court.name,
                  isActive: court.isActive ?? true
                }
              });
            }
          }
        }

        return venue;
      });

      const venue = await prisma.venue.findUnique({
        where: { id: updated.id },
        include: venueInclude
      });

      res.json({ venue });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
