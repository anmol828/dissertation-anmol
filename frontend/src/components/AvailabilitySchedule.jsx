import React from "react";
import { formatHourLabel, getSlotState, HOUR_SLOTS } from "../lib/schedule.js";

const slotStyles = {
  idle: "bg-surface-2 text-muted border-line",
  closed: "bg-surface-2 text-muted border-line",
  past: "bg-surface-2 text-muted border-line",
  booked: "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/25",
  available:
    "bg-pitch-soft text-pitch-strong border-pitch/30 hover:bg-pitch hover:text-pitch-fg hover:border-pitch"
};

const AvailabilitySchedule = ({
  title,
  dateValue,
  onDateChange,
  courts = [],
  bookingsByCourt = {},
  pricingRules = [],
  selectedCourtId = null,
  selectedTime = "",
  onSelectSlot,
  interactive = false
}) => {
  return (
    <section className="fh-card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Green slots are open, red slots are already booked, and muted slots are outside
            operating hours or already in the past.
          </p>
        </div>
        <input
          type="date"
          value={dateValue}
          onChange={(event) => onDateChange(event.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="fh-input md:w-auto"
        />
      </div>

      <div className="mt-5 space-y-5">
        {courts.map((court) => (
          <div key={court.id} className="overflow-hidden rounded-2xl border border-line">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3">
              <div>
                <h3 className="font-display font-bold text-foreground">{court.name}</h3>
                <p className="text-sm text-muted">
                  {court.isActive ? "Open for booking" : "Marked inactive"}
                </p>
              </div>
              <div className="fh-chip">Court ID: {court.id}</div>
            </div>

            <div className="p-4 grid gap-2 grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
              {HOUR_SLOTS.map((timeValue) => {
                const slot = getSlotState({
                  dateValue,
                  timeValue,
                  bookings: bookingsByCourt[court.id] || [],
                  pricingRules
                });

                const isSelected =
                  String(selectedCourtId) === String(court.id) && selectedTime === timeValue;

                const className = [
                  "rounded-xl border px-3 py-3 text-left text-sm font-medium transition min-h-[78px]",
                  slotStyles[slot.state],
                  interactive && slot.state === "available" ? "cursor-pointer" : "cursor-default",
                  isSelected ? "ring-2 ring-pitch ring-offset-2 ring-offset-surface" : ""
                ]
                  .filter(Boolean)
                  .join(" ");

                const content = (
                  <>
                    <div className="font-medium">{formatHourLabel(timeValue)}</div>
                    <div className="mt-2 text-xs">
                      {slot.state === "available" && `Rs. ${slot.rate}`}
                      {slot.state === "booked" && "Booked"}
                      {slot.state === "closed" && "Closed"}
                      {slot.state === "past" && "Past"}
                      {slot.state === "idle" && "Pick a date"}
                    </div>
                  </>
                );

                if (interactive && slot.state === "available") {
                  return (
                    <button
                      key={`${court.id}-${timeValue}`}
                      type="button"
                      onClick={() => onSelectSlot?.({ courtId: court.id, timeValue })}
                      className={className}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <div key={`${court.id}-${timeValue}`} className={className}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {courts.length === 0 && (
          <p className="text-sm text-muted">No courts available for schedule rendering.</p>
        )}
      </div>
    </section>
  );
};

export default AvailabilitySchedule;
