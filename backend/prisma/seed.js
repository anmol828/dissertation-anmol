import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addDays = (date, days, hours = 0) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(hours, 0, 0, 0);
  return next;
};

const buildPricingRules = (weekdayRate, weekendRate) => [
  { dayOfWeek: "SUNDAY", startTime: "06:00", endTime: "22:00", hourlyRate: weekendRate },
  { dayOfWeek: "MONDAY", startTime: "06:00", endTime: "22:00", hourlyRate: weekdayRate },
  { dayOfWeek: "TUESDAY", startTime: "06:00", endTime: "22:00", hourlyRate: weekdayRate },
  { dayOfWeek: "WEDNESDAY", startTime: "06:00", endTime: "22:00", hourlyRate: weekdayRate },
  { dayOfWeek: "THURSDAY", startTime: "06:00", endTime: "22:00", hourlyRate: weekdayRate },
  { dayOfWeek: "FRIDAY", startTime: "06:00", endTime: "23:00", hourlyRate: weekdayRate + 200 },
  { dayOfWeek: "SATURDAY", startTime: "06:00", endTime: "23:00", hourlyRate: weekendRate }
];

const seed = async () => {
  const passwordHash = await bcrypt.hash("demo123", 10);

  await prisma.$transaction([
    prisma.recruitmentRequest.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.team.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.venuePricingRule.deleteMany(),
    prisma.court.deleteMany(),
    prisma.venue.deleteMany(),
    prisma.playerProfile.deleteMany(),
    prisma.user.deleteMany()
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@futsalhub.demo",
      passwordHash,
      role: "ADMIN"
    }
  });

  const venueOwnerOne = await prisma.user.create({
    data: {
      name: "Aarav Arena Owner",
      email: "owner1@futsalhub.demo",
      passwordHash,
      role: "VENUE_ADMIN"
    }
  });

  const venueOwnerTwo = await prisma.user.create({
    data: {
      name: "Milan Court Owner",
      email: "owner2@futsalhub.demo",
      passwordHash,
      role: "VENUE_ADMIN"
    }
  });

  const playerOne = await prisma.user.create({
    data: {
      name: "Rohan Shrestha",
      email: "player1@futsalhub.demo",
      passwordHash,
      role: "PLAYER"
    }
  });

  const playerTwo = await prisma.user.create({
    data: {
      name: "Sujan Karki",
      email: "player2@futsalhub.demo",
      passwordHash,
      role: "PLAYER"
    }
  });

  const playerThree = await prisma.user.create({
    data: {
      name: "Bikash Lama",
      email: "player3@futsalhub.demo",
      passwordHash,
      role: "PLAYER"
    }
  });

  const playerFour = await prisma.user.create({
    data: {
      name: "Niraj Rai",
      email: "player4@futsalhub.demo",
      passwordHash,
      role: "PLAYER"
    }
  });

  const regularUser = await prisma.user.create({
    data: {
      name: "Demo Booker",
      email: "user@futsalhub.demo",
      passwordHash,
      role: "USER"
    }
  });

  const [profileOne, profileTwo, profileThree, profileFour] = await Promise.all([
    prisma.playerProfile.create({
      data: {
        userId: playerOne.id,
        age: 24,
        city: "Kathmandu",
        phone: "9800000001",
        profileImageUrl:
          "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=500&q=80",
        position: "FORWARD",
        skill: "ADVANCED",
        preferredFoot: "RIGHT",
        status: "AVAILABLE",
        preferredPlayTime: "Weekday evenings",
        jerseyNumber: 9,
        bio: "Quick finisher who likes high-tempo futsal."
      }
    }),
    prisma.playerProfile.create({
      data: {
        userId: playerTwo.id,
        age: 22,
        city: "Lalitpur",
        phone: "9800000002",
        profileImageUrl:
          "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=500&q=80",
        position: "MIDFIELDER",
        skill: "INTERMEDIATE",
        preferredFoot: "BOTH",
        status: "LOOKING_FOR_TEAM",
        preferredPlayTime: "Friday nights",
        jerseyNumber: 8,
        bio: "Two-way player who can organize the game."
      }
    }),
    prisma.playerProfile.create({
      data: {
        userId: playerThree.id,
        age: 27,
        city: "Bhaktapur",
        phone: "9800000003",
        profileImageUrl:
          "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=500&q=80",
        position: "DEFENDER",
        skill: "ADVANCED",
        preferredFoot: "LEFT",
        status: "AVAILABLE",
        preferredPlayTime: "Weekend mornings",
        jerseyNumber: 4,
        bio: "Strong defender with calm passing under pressure."
      }
    }),
    prisma.playerProfile.create({
      data: {
        userId: playerFour.id,
        age: 25,
        city: "Kathmandu",
        phone: "9800000004",
        profileImageUrl:
          "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=500&q=80",
        position: "GOALKEEPER",
        skill: "INTERMEDIATE",
        preferredFoot: "RIGHT",
        status: "INJURED",
        preferredPlayTime: "Late afternoons",
        jerseyNumber: 1,
        bio: "Shot-stopper working back toward match fitness."
      }
    })
  ]);

  const venueOne = await prisma.venue.create({
    data: {
      name: "Arena 5 Futsal",
      slug: "arena-5-futsal",
      description: "Indoor futsal venue with two busy evening courts and weekend peak traffic.",
      address: "New Baneshwor",
      city: "Kathmandu",
      phone: "014000001",
      hourlyRate: 1800,
      adminId: venueOwnerOne.id,
      courts: {
        create: [
          { name: "Arena 5 - Court A", isActive: true },
          { name: "Arena 5 - Court B", isActive: true }
        ]
      },
      pricingRules: {
        create: buildPricingRules(1800, 2200)
      },
      galleryImages: {
        create: [
          {
            imageUrl:
              "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80",
            caption: "Arena 5 match court",
            sortOrder: 0
          },
          {
            imageUrl:
              "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80",
            caption: "Evening session setup",
            sortOrder: 1
          }
        ]
      }
    },
    include: { courts: true }
  });

  const venueTwo = await prisma.venue.create({
    data: {
      name: "Milan Sports Center",
      slug: "milan-sports-center",
      description: "Community-friendly futsal center with one premium court and one training court.",
      address: "Jawalakhel",
      city: "Lalitpur",
      phone: "015000002",
      hourlyRate: 1600,
      adminId: venueOwnerTwo.id,
      courts: {
        create: [
          { name: "Milan - Main Court", isActive: true },
          { name: "Milan - Training Court", isActive: true }
        ]
      },
      pricingRules: {
        create: buildPricingRules(1600, 2000)
      },
      galleryImages: {
        create: [
          {
            imageUrl:
              "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
            caption: "Milan Sports main court",
            sortOrder: 0
          },
          {
            imageUrl:
              "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
            caption: "Training court atmosphere",
            sortOrder: 1
          }
        ]
      }
    },
    include: { courts: true }
  });

  const team = await prisma.team.create({
    data: {
      name: "Kathmandu Blazers",
      ownerId: playerOne.id
    }
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: team.id, playerProfileId: profileOne.id },
      { teamId: team.id, playerProfileId: profileThree.id }
    ]
  });

  await prisma.recruitmentRequest.create({
    data: {
      teamId: team.id,
      playerProfileId: profileTwo.id,
      status: "PENDING"
    }
  });

  const now = new Date();
  const futureBookingOneStart = addDays(now, 1, 18);
  const futureBookingOneEnd = addDays(now, 1, 20);
  const futureBookingTwoStart = addDays(now, 2, 19);
  const futureBookingTwoEnd = addDays(now, 2, 20);
  const pastBookingStart = addDays(now, -2, 17);
  const pastBookingEnd = addDays(now, -2, 18);

  await prisma.booking.createMany({
    data: [
      {
        userId: regularUser.id,
        courtId: venueOne.courts[0].id,
        startTime: futureBookingOneStart,
        endTime: futureBookingOneEnd,
        totalPrice: 3600,
        status: "CONFIRMED"
      },
      {
        userId: playerTwo.id,
        courtId: venueTwo.courts[0].id,
        startTime: futureBookingTwoStart,
        endTime: futureBookingTwoEnd,
        totalPrice: 1600,
        status: "CONFIRMED"
      },
      {
        userId: playerOne.id,
        courtId: venueOne.courts[1].id,
        startTime: pastBookingStart,
        endTime: pastBookingEnd,
        totalPrice: 1800,
        status: "CONFIRMED"
      }
    ]
  });

  console.log("Seed complete.");
  console.log("Admin login: admin@futsalhub.demo / demo123");
  console.log("Venue owner login: owner1@futsalhub.demo / demo123");
  console.log("Player login: player1@futsalhub.demo / demo123");
  console.log("User login: user@futsalhub.demo / demo123");
  console.log(`Created users: ${admin.id}, ${venueOwnerOne.id}, ${venueOwnerTwo.id}, ${playerOne.id}`);
};

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
