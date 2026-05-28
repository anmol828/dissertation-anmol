import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../lib/api.js";
import AvailabilitySchedule from "../../components/AvailabilitySchedule.jsx";
import Notice from "../../components/Notice.jsx";
import { getApiErrorMessage } from "../../lib/form-utils.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getDayNameFromDate } from "../../lib/schedule.js";

const fallbackVenueImage =
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80";

const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
};

const getInitialDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const defaultBookingState = {
  courtId: "",
  date: getInitialDate(),
  startHour: "18:00",
  durationHours: 1
};

const VenueDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [venue, setVenue] = useState(null);
  const [homeTeams, setHomeTeams] = useState([]);
  const [bookingsByCourt, setBookingsByCourt] = useState({});
  const [bookingForm, setBookingForm] = useState(defaultBookingState);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fetchVenue = async () => {
    const res = await api.get(`/venues/${id}`);
    const teamsRes = await api.get(`/home-teams?venueId=${id}`).catch(() => ({ data: { teams: [] } }));
    const nextVenue = res.data.venue;
    setVenue(nextVenue);
    setHomeTeams(teamsRes.data.teams || []);

    if (!bookingForm.courtId && nextVenue.courts?.length > 0) {
      setBookingForm((prev) => ({
        ...prev,
        courtId: String(nextVenue.courts[0].id)
      }));
    }

    const bookingsResponses = await Promise.all(
      (nextVenue.courts || []).map((court) => api.get(`/bookings/court/${court.id}`))
    );

    const nextBookings = {};
    nextVenue.courts.forEach((court, index) => {
      nextBookings[court.id] = bookingsResponses[index].data.bookings || [];
    });
    setBookingsByCourt(nextBookings);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchVenue();
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load venue"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [venue?.id]);

  const pricingPreview = useMemo(() => {
    if (!venue || !bookingForm.date || !bookingForm.startHour) {
      return null;
    }

    const selectedDay = getDayNameFromDate(bookingForm.date);
    const rule = (venue.pricingRules || []).find(
      (item) =>
        item.dayOfWeek === selectedDay &&
        bookingForm.startHour >= item.startTime &&
        bookingForm.startHour < item.endTime
    );

    if (!rule) {
      return "No pricing rule for the selected time.";
    }

    return `Selected slot starts from Rs. ${rule.hourlyRate} per hour on ${selectedDay.toLowerCase()}.`;
  }, [bookingForm.date, bookingForm.startHour, venue]);

  const handleBookingChange = (e) => {
    setBookingForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectSlot = ({ courtId, timeValue }) => {
    setError("");
    setMessage("");
    setBookingForm((prev) => ({
      ...prev,
      courtId: String(courtId),
      startHour: timeValue
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    if (!bookingForm.courtId) {
      setError("Please select an active court.");
      setSubmitting(false);
      return;
    }
    if (!bookingForm.date) {
      setError("Please choose a booking date.");
      setSubmitting(false);
      return;
    }

    try {
      const startTime = new Date(`${bookingForm.date}T${bookingForm.startHour}:00`);
      const endTime = new Date(
        startTime.getTime() + Number(bookingForm.durationHours) * 60 * 60 * 1000
      );

      const res = await api.post("/bookings", {
        courtId: Number(bookingForm.courtId),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      setMessage(
        `Booking confirmed for Rs. ${res.data.booking.totalPrice} at ${res.data.booking.court.venue.name}.`
      );
      await fetchVenue();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create booking"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading venue...</p>;
  if (error && !venue) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 inline-block">
        {error}
      </p>
    );
  }
  if (!venue) return <p>Venue not found.</p>;

  const activeCourts = (venue.courts || []).filter((court) => court.isActive);
  const galleryImages =
    venue.galleryImages?.length > 0
      ? venue.galleryImages
      : [{ imageUrl: fallbackVenueImage, caption: venue.name }];
  const activeImage = galleryImages[activeImageIndex] || galleryImages[0];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
        <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 md:p-8">
            <div className="overflow-hidden rounded-[24px]">
              <img
                src={resolveAssetUrl(activeImage?.imageUrl) || fallbackVenueImage}
                alt={activeImage?.caption || venue.name}
                className="h-[320px] w-full object-cover md:h-[420px]"
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {galleryImages.slice(0, 4).map((image, index) => (
                <button
                  key={`${image.imageUrl}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`overflow-hidden rounded-2xl border ${
                    index === activeImageIndex ? "border-slate-900" : "border-slate-200"
                  }`}
                >
                  <img
                    src={resolveAssetUrl(image.imageUrl) || fallbackVenueImage}
                    alt={image.caption || venue.name}
                    className="h-20 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 md:p-8 xl:border-l xl:border-slate-200">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Venue profile
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
              {venue.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {venue.address}, {venue.city}
            </p>
            {venue.description && (
              <p className="mt-5 text-sm leading-7 text-slate-600">{venue.description}</p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Base rate</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">Rs. {venue.hourlyRate}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Active courts</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{activeCourts.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Gallery</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{galleryImages.length} photos</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Contact</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{venue.phone || "Not added yet"}</p>
              </div>
            </div>
            {venue.mapsUrl && (
              <a
                href={venue.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Open Location
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <AvailabilitySchedule
            title="Court Availability Calendar"
            dateValue={bookingForm.date}
            onDateChange={(dateValue) =>
              setBookingForm((prev) => ({
                ...prev,
                date: dateValue
              }))
            }
            courts={activeCourts}
            bookingsByCourt={bookingsByCourt}
            pricingRules={venue.pricingRules || []}
            selectedCourtId={bookingForm.courtId}
            selectedTime={bookingForm.startHour}
            onSelectSlot={user ? handleSelectSlot : undefined}
            interactive={Boolean(user)}
          />

          <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Home Teams
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {homeTeams.map((team) => (
                <div key={team.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveAssetUrl(team.imageUrl) || fallbackVenueImage}
                      alt={team.name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-medium text-slate-950">{team.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {team.players?.length || 0} players - {team.skillLevel || "Open"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(team.players || []).slice(0, 5).map((player) => (
                      <span key={player.id} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600">
                        {player.name}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {(team.availability || [])
                      .map((slot) => `${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}`)
                      .join(", ")}
                  </p>
                </div>
              ))}
              {homeTeams.length === 0 && (
                <p className="text-sm text-slate-500">No home teams listed for this venue yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Weekly Pricing Rules
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(venue.pricingRules || []).map((rule) => (
                <div key={rule.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-950">{rule.dayOfWeek}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {rule.startTime} - {rule.endTime}
                  </p>
                  <p className="mt-3 text-sm text-slate-700">
                    Rs. <span className="font-semibold">{rule.hourlyRate}</span> / hour
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Book This Venue</h2>
            {!user ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Login as a player or user to book directly from the schedule grid and lock in
                your preferred court.
              </p>
            ) : (
              <form onSubmit={handleBookingSubmit} className="mt-5 space-y-4">
                <Notice tone="success">{message}</Notice>
                <Notice tone="error">{error}</Notice>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Court</label>
                  <select
                    name="courtId"
                    value={bookingForm.courtId}
                    onChange={handleBookingChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                  >
                    {activeCourts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={bookingForm.date}
                    onChange={handleBookingChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start time</label>
                  <input
                    type="time"
                    name="startHour"
                    value={bookingForm.startHour}
                    onChange={handleBookingChange}
                    step="3600"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                  <select
                    name="durationHours"
                    value={bookingForm.durationHours}
                    onChange={handleBookingChange}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                  </select>
                </div>
                {pricingPreview && (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {pricingPreview}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-slate-950 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default VenueDetail;
