import React, { useEffect, useState } from "react";
import AvailabilitySchedule from "../../components/AvailabilitySchedule.jsx";
import Notice from "../../components/Notice.jsx";
import api from "../../lib/api.js";
import { DAYS_OF_WEEK, SKILL_LEVELS } from "../../lib/constants.js";
import {
  getApiErrorMessage,
  hasNonEmptyValue,
  hasPositiveNumber,
  hasValidTimeRange,
  isValidOptionalUrl,
  isValidPhone
} from "../../lib/form-utils.js";

const getInitialDate = () => new Date().toISOString().split("T")[0];

const createEmptyRule = () => ({
  dayOfWeek: "SUNDAY",
  startTime: "06:00",
  endTime: "22:00",
  hourlyRate: 1000
});

const createEmptyCourt = () => ({
  name: "",
  isActive: true
});

const createEmptyGalleryImage = () => ({
  imageUrl: "",
  caption: ""
});

const createEmptyHomeTeam = () => ({
  name: "",
  imageUrl: "",
  skillLevel: "INTERMEDIATE",
  players: [{ name: "" }],
  availability: [{ dayOfWeek: "SUNDAY", startTime: "18:00", endTime: "20:00" }]
});

const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
};

const VenueAdminDashboard = () => {
  const [venue, setVenue] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [homeTeams, setHomeTeams] = useState([]);
  const [bookingsByCourt, setBookingsByCourt] = useState({});
  const [scheduleDate, setScheduleDate] = useState(getInitialDate());
  const [form, setForm] = useState(null);
  const [teamForm, setTeamForm] = useState(createEmptyHomeTeam());
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadingTeamLogo, setUploadingTeamLogo] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const [res, teamsRes] = await Promise.all([
        api.get("/venues/mine"),
        api.get("/home-teams/mine").catch(() => ({ data: { teams: [] } }))
      ]);
      const nextVenue = res.data.venue;
      const venueBookings = res.data.bookings || [];

      setVenue(nextVenue);
      setBookings(venueBookings);
      setHomeTeams(teamsRes.data.teams || []);
      setBookingsByCourt(
        venueBookings.reduce((accumulator, booking) => {
          const courtId = booking.courtId || booking.court?.id;
          if (!accumulator[courtId]) {
            accumulator[courtId] = [];
          }
          accumulator[courtId].push(booking);
          return accumulator;
        }, {})
      );

      setForm({
        name: nextVenue.name,
        description: nextVenue.description || "",
        address: nextVenue.address,
        city: nextVenue.city,
        phone: nextVenue.phone || "",
        mapsUrl: nextVenue.mapsUrl || "",
        hourlyRate: nextVenue.hourlyRate,
        galleryImages:
          nextVenue.galleryImages?.length > 0
            ? nextVenue.galleryImages.map((image) => ({
                id: image.id,
                imageUrl: image.imageUrl,
                caption: image.caption || ""
              }))
            : [createEmptyGalleryImage()],
        courts: (nextVenue.courts || []).map((court) => ({
          id: court.id,
          name: court.name,
          isActive: court.isActive
        })),
        pricingRules:
          nextVenue.pricingRules?.length > 0
            ? nextVenue.pricingRules.map((rule) => ({
                id: rule.id,
                dayOfWeek: rule.dayOfWeek,
                startTime: rule.startTime,
                endTime: rule.endTime,
                hourlyRate: rule.hourlyRate
              }))
            : [createEmptyRule()]
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load venue panel"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFieldChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateRule = (index, key, value) => {
    setForm((prev) => {
      const pricingRules = [...prev.pricingRules];
      pricingRules[index] = { ...pricingRules[index], [key]: value };
      return { ...prev, pricingRules };
    });
  };

  const updateCourt = (index, key, value) => {
    setForm((prev) => {
      const courts = [...prev.courts];
      courts[index] = { ...courts[index], [key]: value };
      return { ...prev, courts };
    });
  };

  const updateGalleryImage = (index, key, value) => {
    setForm((prev) => {
      const galleryImages = [...prev.galleryImages];
      galleryImages[index] = { ...galleryImages[index], [key]: value };
      return { ...prev, galleryImages };
    });
  };

  const addRule = () => {
    setForm((prev) => ({
      ...prev,
      pricingRules: [...prev.pricingRules, createEmptyRule()]
    }));
  };

  const addCourt = () => {
    setForm((prev) => ({
      ...prev,
      courts: [...prev.courts, createEmptyCourt()]
    }));
  };

  const addGalleryImage = () => {
    setForm((prev) => ({
      ...prev,
      galleryImages: [...prev.galleryImages, createEmptyGalleryImage()]
    }));
  };

  const resetTeamForm = () => {
    setEditingTeamId(null);
    setTeamForm(createEmptyHomeTeam());
  };

  const startEditTeam = (team) => {
    setEditingTeamId(team.id);
    setTeamForm({
      name: team.name || "",
      imageUrl: team.imageUrl || "",
      skillLevel: team.skillLevel || "INTERMEDIATE",
      players: team.players?.length
        ? team.players.map((player) => ({ name: player.name || "" }))
        : [{ name: "" }],
      availability: team.availability?.length
        ? team.availability.map((slot) => ({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime
          }))
        : [{ dayOfWeek: "SUNDAY", startTime: "18:00", endTime: "20:00" }]
    });
  };

  const updateHomeTeamPlayer = (index, value) => {
    setTeamForm((prev) => {
      const players = [...prev.players];
      players[index] = { ...players[index], name: value };
      return { ...prev, players };
    });
  };

  const addHomeTeamPlayer = () => {
    setTeamForm((prev) => ({ ...prev, players: [...prev.players, { name: "" }] }));
  };

  const removeHomeTeamPlayer = (index) => {
    setTeamForm((prev) => ({
      ...prev,
      players: prev.players.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const updateHomeTeamAvailability = (index, key, value) => {
    setTeamForm((prev) => {
      const availability = [...prev.availability];
      availability[index] = { ...availability[index], [key]: value };
      return { ...prev, availability };
    });
  };

  const addHomeTeamAvailability = () => {
    setTeamForm((prev) => ({
      ...prev,
      availability: [
        ...prev.availability,
        { dayOfWeek: "SUNDAY", startTime: "18:00", endTime: "20:00" }
      ]
    }));
  };

  const removeHomeTeamAvailability = (index) => {
    setTeamForm((prev) => ({
      ...prev,
      availability: prev.availability.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const removeGalleryImage = (index) => {
    setForm((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const handleGalleryImageUpload = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/venues/upload-image", formData);
      updateGalleryImage(index, "imageUrl", res.data.imageUrl || "");
      setSuccess("Gallery image uploaded.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to upload gallery image"));
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleTeamLogoUpload = async (file) => {
    if (!file) return;
    setUploadingTeamLogo(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/home-teams/upload-image", formData);
      setTeamForm((prev) => ({ ...prev, imageUrl: res.data.imageUrl || "" }));
      setSuccess("Team logo uploaded.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to upload team logo"));
    } finally {
      setUploadingTeamLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!hasNonEmptyValue(form.name) || !hasNonEmptyValue(form.address) || !hasNonEmptyValue(form.city)) {
      setError("Venue name, address, and city are required.");
      setSaving(false);
      return;
    }

    if (!hasPositiveNumber(form.hourlyRate)) {
      setError("Base hourly rate must be greater than 0.");
      setSaving(false);
      return;
    }

    if (!isValidPhone(form.phone)) {
      setError("Please enter a valid phone number.");
      setSaving(false);
      return;
    }
    if (!isValidOptionalUrl(form.mapsUrl)) {
      setError("Maps URL must start with http:// or https://.");
      setSaving(false);
      return;
    }

    if (form.courts.some((court) => !hasNonEmptyValue(court.name))) {
      setError("Every court must have a name.");
      setSaving(false);
      return;
    }
    if (
      form.galleryImages.some(
        (image) => image.imageUrl && !String(image.imageUrl).trim()
      )
    ) {
      setError("Venue gallery image URLs must be valid.");
      setSaving(false);
      return;
    }

    if (
      form.pricingRules.some(
        (rule) =>
          !hasPositiveNumber(rule.hourlyRate) ||
          !hasValidTimeRange(rule.startTime, rule.endTime)
      )
    ) {
      setError("Each pricing rule needs a valid time range and hourly rate.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        ...form,
        hourlyRate: Number(form.hourlyRate),
        galleryImages: form.galleryImages.map((image) => ({
          ...image,
          imageUrl: image.imageUrl.trim(),
          caption: image.caption.trim()
        })),
        mapsUrl: form.mapsUrl.trim(),
        pricingRules: form.pricingRules.map((rule) => ({
          ...rule,
          hourlyRate: Number(rule.hourlyRate)
        }))
      };

      const res = await api.put(`/venues/${venue.id}`, payload);
      setVenue(res.data.venue);
      setSuccess("Venue settings updated.");
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update venue"));
    } finally {
      setSaving(false);
    }
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setSavingTeam(true);
    setError("");
    setSuccess("");

    if (!hasNonEmptyValue(teamForm.name)) {
      setError("Home team name is required.");
      setSavingTeam(false);
      return;
    }
    if (teamForm.players.some((player) => !hasNonEmptyValue(player.name))) {
      setError("Every listed player needs a name.");
      setSavingTeam(false);
      return;
    }
    if (
      teamForm.availability.length === 0 ||
      teamForm.availability.some((slot) => !hasValidTimeRange(slot.startTime, slot.endTime))
    ) {
      setError("Add at least one valid availability row.");
      setSavingTeam(false);
      return;
    }

    try {
      const payload = {
        ...teamForm,
        name: teamForm.name.trim(),
        imageUrl: teamForm.imageUrl.trim(),
        venueId: venue.id,
        players: teamForm.players.map((player) => ({ name: player.name.trim() }))
      };

      if (editingTeamId) {
        await api.put(`/home-teams/${editingTeamId}`, payload);
        setSuccess("Home team updated.");
      } else {
        await api.post("/home-teams", payload);
        setSuccess("Home team created.");
      }

      resetTeamForm();
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save home team"));
    } finally {
      setSavingTeam(false);
    }
  };

  if (loading) return <p>Loading venue panel...</p>;
  if (!form) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 inline-block">
        {error || "Venue not found for this account."}
      </p>
    );
  }

  const upcomingCount = bookings.filter((booking) => new Date(booking.startTime) > new Date())
    .length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Venue</p>
          <p className="mt-2 text-xl font-semibold">{venue.name}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Courts</p>
          <p className="mt-2 text-xl font-semibold">{venue.courts?.length || 0}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Pricing Rules</p>
          <p className="mt-2 text-xl font-semibold">{venue.pricingRules?.length || 0}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Upcoming Bookings</p>
          <p className="mt-2 text-xl font-semibold">{upcomingCount}</p>
        </div>
      </section>

      <AvailabilitySchedule
        title="Daily Booking Calendar"
        dateValue={scheduleDate}
        onDateChange={setScheduleDate}
        courts={venue.courts || []}
        bookingsByCourt={bookingsByCourt}
        pricingRules={venue.pricingRules || []}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Venue Admin Panel</h1>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
          <Notice tone="error" className="mt-4">{error}</Notice>
          <Notice tone="success" className="mt-4">{success}</Notice>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Venue Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFieldChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleFieldChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleFieldChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleFieldChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Google Maps URL
              </label>
              <input
                type="url"
                name="mapsUrl"
                value={form.mapsUrl}
                onChange={handleFieldChange}
                placeholder="https://maps.google.com/..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Base Hourly Rate
              </label>
              <input
                type="number"
                min="1"
                name="hourlyRate"
                value={form.hourlyRate}
                onChange={handleFieldChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFieldChange}
                rows="3"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Venue Gallery</h2>
              <button
                type="button"
                onClick={addGalleryImage}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm"
              >
                Add photo
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {form.galleryImages.map((image, index) => (
                <div
                  key={image.id || `gallery-${index}`}
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={image.imageUrl}
                      onChange={(e) => updateGalleryImage(index, "imageUrl", e.target.value)}
                      placeholder="https://image-url"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleGalleryImageUpload(index, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
                    />
                    {image.imageUrl && (
                      <img
                        src={resolveAssetUrl(image.imageUrl)}
                        alt={image.caption || `Venue image ${index + 1}`}
                        className="h-20 w-full rounded-lg object-cover"
                      />
                    )}
                  </div>
                  <input
                    type="text"
                    value={image.caption}
                    onChange={(e) => updateGalleryImage(index, "caption", e.target.value)}
                    placeholder="Caption"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    disabled={form.galleryImages.length === 1 || uploadingIndex === index}
                    className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 disabled:opacity-50"
                  >
                    {uploadingIndex === index ? "Uploading..." : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Courts</h2>
              <button
                type="button"
                onClick={addCourt}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm"
              >
                Add court
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {form.courts.map((court, index) => (
                <div key={court.id || `new-court-${index}`} className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    type="text"
                    value={court.name}
                    onChange={(e) => updateCourt(index, "name", e.target.value)}
                    placeholder="Court name"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={court.isActive}
                      onChange={(e) => updateCourt(index, "isActive", e.target.checked)}
                    />
                    Active
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Pricing Rules</h2>
              <button
                type="button"
                onClick={addRule}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm"
              >
                Add rule
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {form.pricingRules.map((rule, index) => (
                <div
                  key={rule.id || `rule-${index}`}
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-4"
                >
                  <select
                    value={rule.dayOfWeek}
                    onChange={(e) => updateRule(index, "dayOfWeek", e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={rule.startTime}
                    onChange={(e) => updateRule(index, "startTime", e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="time"
                    value={rule.endTime}
                    onChange={(e) => updateRule(index, "endTime", e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min="1"
                    value={rule.hourlyRate}
                    onChange={(e) => updateRule(index, "hourlyRate", e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Hourly rate"
                  />
                </div>
              ))}
            </div>
          </div>
        </form>

        <section className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Home Teams</h2>
              {editingTeamId && (
                <button
                  type="button"
                  onClick={resetTeamForm}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <form onSubmit={handleTeamSubmit} className="mt-4 space-y-3">
              <input
                type="text"
                value={teamForm.name}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Team name"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={teamForm.skillLevel}
                onChange={(e) =>
                  setTeamForm((prev) => ({ ...prev, skillLevel: e.target.value }))
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                {SKILL_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={teamForm.imageUrl}
                onChange={(e) =>
                  setTeamForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
                placeholder="Optional image URL"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="file"
                accept="image/*"
                disabled={uploadingTeamLogo}
                onChange={(e) => {
                  handleTeamLogoUpload(e.target.files?.[0]);
                  e.target.value = "";
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
              {teamForm.imageUrl && (
                <img
                  src={resolveAssetUrl(teamForm.imageUrl)}
                  alt={teamForm.name || "Home team"}
                  className="h-20 w-full rounded-lg object-cover"
                />
              )}
              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">Player names</p>
                  <button
                    type="button"
                    onClick={addHomeTeamPlayer}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm"
                  >
                    Add player
                  </button>
                </div>
                {teamForm.players.map((player, index) => (
                  <div key={`home-player-${index}`} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updateHomeTeamPlayer(index, e.target.value)}
                      placeholder="Player name"
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeHomeTeamPlayer(index)}
                      disabled={teamForm.players.length === 1}
                      className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">Availability rows</p>
                  <button
                    type="button"
                    onClick={addHomeTeamAvailability}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm"
                  >
                    Add slot
                  </button>
                </div>
                {teamForm.availability.map((slot, index) => (
                  <div key={`home-availability-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <select
                      value={slot.dayOfWeek}
                      onChange={(e) => updateHomeTeamAvailability(index, "dayOfWeek", e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateHomeTeamAvailability(index, "startTime", e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateHomeTeamAvailability(index, "endTime", e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeHomeTeamAvailability(index)}
                      disabled={teamForm.availability.length === 1}
                      className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={savingTeam || uploadingTeamLogo}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {savingTeam
                  ? "Saving..."
                  : editingTeamId
                    ? "Update home team"
                    : "Create home team"}
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {homeTeams.map((team) => (
                <div key={team.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex gap-3">
                    <img
                      src={
                        resolveAssetUrl(team.imageUrl) ||
                        "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=300&q=80"
                      }
                      alt={team.name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-950">{team.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {team.players?.length || 0} players - {team.skillLevel || "Skill not set"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {(team.availability || [])
                          .map((slot) => `${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}`)
                          .join(", ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEditTeam(team)}
                      className="self-start rounded-lg bg-slate-100 px-3 py-2 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
              {homeTeams.length === 0 && (
                <p className="text-sm text-slate-500">No home teams created yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
            <div className="mt-4 space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-medium">
                    {booking.user?.name} - {booking.court?.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(booking.startTime).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Rs. {booking.totalPrice} - {booking.status}
                  </p>
                </div>
              ))}
              {bookings.length === 0 && (
                <p className="text-sm text-slate-500">No bookings available yet.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VenueAdminDashboard;
