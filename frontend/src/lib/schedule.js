export const HOUR_SLOTS = Array.from({ length: 18 }, (_, index) => {
  const hour = index + 6;
  return `${String(hour).padStart(2, "0")}:00`;
});

export const getDayNameFromDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

export const formatHourLabel = (timeValue) => {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

export const getSlotState = ({
  dateValue,
  timeValue,
  bookings = [],
  pricingRules = []
}) => {
  if (!dateValue) {
    return { state: "idle", rate: null };
  }

  const selectedDay = getDayNameFromDate(dateValue);
  const matchingRule = pricingRules.find(
    (rule) =>
      rule.dayOfWeek === selectedDay &&
      timeValue >= rule.startTime &&
      timeValue < rule.endTime
  );

  if (!matchingRule) {
    return { state: "closed", rate: null };
  }

  const slotStart = new Date(`${dateValue}T${timeValue}:00`);
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

  const overlapping = bookings.some((booking) => {
    const bookingStart = new Date(booking.startTime);
    const bookingEnd = new Date(booking.endTime);
    return bookingStart < slotEnd && bookingEnd > slotStart;
  });

  if (overlapping) {
    return { state: "booked", rate: matchingRule.hourlyRate };
  }

  if (slotStart < new Date()) {
    return { state: "past", rate: matchingRule.hourlyRate };
  }

  return { state: "available", rate: matchingRule.hourlyRate };
};
