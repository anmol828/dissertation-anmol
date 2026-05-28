const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
];

export const getDayOfWeek = (date) => DAY_NAMES[date.getDay()];

export const slugifyVenueName = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const parseTimeToMinutes = (value) => {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
};

export const validatePricingRules = (rules) => {
  if (!Array.isArray(rules) || rules.length === 0) {
    return "At least one pricing rule is required";
  }

  for (const rule of rules) {
    if (!DAY_NAMES.includes(rule.dayOfWeek)) {
      return "Invalid day of week in pricing rules";
    }

    const start = parseTimeToMinutes(rule.startTime);
    const end = parseTimeToMinutes(rule.endTime);

    if (start === null || end === null || end <= start) {
      return "Each pricing rule must have a valid time range";
    }

    if (!rule.hourlyRate || Number(rule.hourlyRate) <= 0) {
      return "Each pricing rule must have a valid hourly rate";
    }
  }

  return null;
};

export const buildUniqueSlug = async (prisma, name, excludeVenueId = null) => {
  const base = slugifyVenueName(name) || "venue";
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.venue.findFirst({
      where: {
        slug,
        ...(excludeVenueId ? { id: { not: excludeVenueId } } : {})
      },
      select: { id: true }
    });

    if (!existing) {
      return slug;
    }

    counter += 1;
    slug = `${base}-${counter}`;
  }
};

export const calculateBookingPrice = (start, end, pricingRules) => {
  const appliedRules = [];
  let totalPrice = 0;

  const cursor = new Date(start);
  while (cursor < end) {
    const next = new Date(cursor.getTime() + 60 * 60 * 1000);
    const dayOfWeek = getDayOfWeek(cursor);
    const minutes = cursor.getHours() * 60 + cursor.getMinutes();

    const matchingRule = pricingRules.find((rule) => {
      const startMinutes = parseTimeToMinutes(rule.startTime);
      const endMinutes = parseTimeToMinutes(rule.endTime);

      return (
        rule.dayOfWeek === dayOfWeek &&
        startMinutes !== null &&
        endMinutes !== null &&
        minutes >= startMinutes &&
        minutes + 60 <= endMinutes
      );
    });

    if (!matchingRule) {
      return {
        error: "Selected slot is outside the venue's available schedule"
      };
    }

    totalPrice += Number(matchingRule.hourlyRate);
    appliedRules.push(matchingRule.id);
    cursor.setTime(next.getTime());
  }

  return { totalPrice, appliedRules };
};
