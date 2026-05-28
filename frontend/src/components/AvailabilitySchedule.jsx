import React from "react";
import { formatHourLabel, getSlotState, HOUR_SLOTS } from "../lib/schedule.js";

const slotStyles = {
  idle: "bg-slate-50 text-slate-400 border-slate-200",
  closed: "bg-slate-100 text-slate-400 border-slate-200",
  past: "bg-slate-100 text-slate-400 border-slate-200",
  booked: "bg-rose-50 text-rose-700 border-rose-200",
  available: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
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
    <section className="rounded-2xl bg-white border border-slate-200 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Green slots are open, red slots are already booked, and muted slots are outside
            operating hours or already in the past.
          </p>
        </div>
        <input
          type="date"
          value={dateValue}
          onChange={(event) => onDateChange(event.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-5 space-y-5">
        {courts.map((court) => (
          <div key={court.id} className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{court.name}</h3>
                <p className="text-sm text-slate-500">
                  {court.isActive ? "Open for booking" : "Marked inactive"}
                </p>
              </div>
              <div className="text-xs text-slate-500">Court ID: {court.id}</div>
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
                  "rounded-lg border px-3 py-3 text-left text-sm transition min-h-[78px]",
                  slotStyles[slot.state],
                  interactive && slot.state === "available" ? "cursor-pointer" : "cursor-default",
                  isSelected ? "ring-2 ring-slate-900" : ""
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
          <p className="text-sm text-slate-500">No courts available for schedule rendering.</p>
        )}
      </div>
    </section>
  );
};

export default AvailabilitySchedule;
