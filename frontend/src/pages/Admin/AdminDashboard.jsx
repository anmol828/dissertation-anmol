import React, { useEffect, useState } from "react";
import Notice from "../../components/Notice.jsx";
import api from "../../lib/api.js";
import { DAYS_OF_WEEK } from "../../lib/constants.js";
import {
  getApiErrorMessage,
  hasNonEmptyValue,
  hasPositiveNumber,
  hasValidTimeRange,
  isValidOptionalUrl,
  isStrongEnoughPassword,
  isValidEmail,
  isValidPhone
} from "../../lib/form-utils.js";

const createEmptyRule = () => ({
  dayOfWeek: "SUNDAY",
  startTime: "06:00",
  endTime: "22:00",
  hourlyRate: 1000
});

const createInitialForm = () => ({
  ownerName: "",
  ownerEmail: "",
  ownerPassword: "",
  venueName: "",
  description: "",
  address: "",
  city: "",
  phone: "",
  mapsUrl: "",
  hourlyRate: 1000,
  galleryImages: [{ imageUrl: "", caption: "" }],
  courts: [{ name: "Main Court", isActive: true }],
  pricingRules: [createEmptyRule()]
});

const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState(createInitialForm());
  const [editingVenueId, setEditingVenueId] = useState(null);
  const [confirmDeleteVenueId, setConfirmDeleteVenueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = editingVenueId !== null;

  const load = async () => {
    try {
      const [dashboardRes, usersRes, venuesRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/users"),
        api.get("/admin/venues")
      ]);

      setStats(dashboardRes.data.stats);
      setUsers(usersRes.data.users || []);
      setVenues(venuesRes.data.venues || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load admin panel"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingVenueId(null);
    setForm(createInitialForm());
  };

  const startEdit = (venue) => {
    setError("");
    setSuccess("");
    setEditingVenueId(venue.id);
    setForm({
      ownerName: venue.admin?.name || "",
      ownerEmail: venue.admin?.email || "",
      ownerPassword: "",
      venueName: venue.name || "",
      description: venue.description || "",
      address: venue.address || "",
      city: venue.city || "",
      phone: venue.phone || "",
      mapsUrl: venue.mapsUrl || "",
      hourlyRate: venue.hourlyRate || 1000,
      galleryImages:
        venue.galleryImages?.length > 0
          ? venue.galleryImages.map((image) => ({
              id: image.id,
              imageUrl: image.imageUrl,
              caption: image.caption || ""
            }))
          : [{ imageUrl: "", caption: "" }],
      courts:
        venue.courts?.length > 0
          ? venue.courts.map((court) => ({
              id: court.id,
              name: court.name,
              isActive: court.isActive
            }))
          : [{ name: "Main Court", isActive: true }],
      pricingRules:
        venue.pricingRules?.length > 0
          ? venue.pricingRules.map((rule) => ({
              id: rule.id,
              dayOfWeek: rule.dayOfWeek,
              startTime: rule.startTime,
              endTime: rule.endTime,
              hourlyRate: rule.hourlyRate
            }))
          : [createEmptyRule()]
    });
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

  const updateRule = (index, key, value) => {
    setForm((prev) => {
      const pricingRules = [...prev.pricingRules];
      pricingRules[index] = { ...pricingRules[index], [key]: value };
      return { ...prev, pricingRules };
    });
  };

  const addCourt = () => {
    setForm((prev) => ({
      ...prev,
      courts: [...prev.courts, { name: "", isActive: true }]
    }));
  };

  const addGalleryImage = () => {
    setForm((prev) => ({
      ...prev,
      galleryImages: [...prev.galleryImages, { imageUrl: "", caption: "" }]
    }));
  };

  const removeGalleryImage = (index) => {
    setForm((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const removeCourt = (index) => {
    setForm((prev) => ({
      ...prev,
      courts: prev.courts.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const addRule = () => {
    setForm((prev) => ({
      ...prev,
      pricingRules: [...prev.pricingRules, createEmptyRule()]
    }));
  };

  const removeRule = (index) => {
    setForm((prev) => ({
      ...prev,
      pricingRules: prev.pricingRules.filter((_, itemIndex) => itemIndex !== index)
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

  const validateForm = () => {
    if (
      !hasNonEmptyValue(form.ownerName) ||
      !hasNonEmptyValue(form.venueName) ||
      !hasNonEmptyValue(form.address) ||
      !hasNonEmptyValue(form.city)
    ) {
      return "Owner name, venue name, address, and city are required.";
    }
    if (!isValidEmail(form.ownerEmail)) {
      return "Please enter a valid venue owner email address.";
    }
    if (!isEditing && !isStrongEnoughPassword(form.ownerPassword)) {
      return "Temporary password must be at least 6 characters long.";
    }
    if (isEditing && form.ownerPassword && !isStrongEnoughPassword(form.ownerPassword)) {
      return "Updated password must be at least 6 characters long.";
    }
    if (!hasPositiveNumber(form.hourlyRate)) {
      return "Base hourly rate must be greater than 0.";
    }
    if (!isValidPhone(form.phone)) {
      return "Please enter a valid venue phone number.";
    }
    if (!isValidOptionalUrl(form.mapsUrl)) {
      return "Maps URL must start with http:// or https://.";
    }
    if (form.courts.length === 0 || form.courts.some((court) => !hasNonEmptyValue(court.name))) {
      return "At least one valid court name is required.";
    }
    if (
      form.galleryImages.some(
        (image) => image.imageUrl && !String(image.imageUrl).trim()
      )
    ) {
      return "Venue gallery image URLs must be valid.";
    }
    if (
      form.pricingRules.length === 0 ||
      form.pricingRules.some(
        (rule) =>
          !hasPositiveNumber(rule.hourlyRate) ||
          !hasValidTimeRange(rule.startTime, rule.endTime)
      )
    ) {
      return "Each pricing rule needs a valid time range and hourly rate.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      ownerName: form.ownerName.trim(),
      ownerEmail: form.ownerEmail.trim(),
      venueName: form.venueName.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
      mapsUrl: form.mapsUrl.trim(),
      description: form.description.trim(),
      hourlyRate: Number(form.hourlyRate),
      galleryImages: form.galleryImages.map((image) => ({
        ...image,
        imageUrl: image.imageUrl.trim(),
        caption: image.caption.trim()
      })),
      courts: form.courts.map((court) => ({
        ...court,
        name: court.name.trim()
      })),
      pricingRules: form.pricingRules.map((rule) => ({
        ...rule,
        hourlyRate: Number(rule.hourlyRate)
      }))
    };

    try {
      if (isEditing) {
        await api.put(`/admin/venues/${editingVenueId}`, payload);
        setSuccess("Venue and venue owner updated successfully.");
      } else {
        await api.post("/admin/venues", payload);
        setSuccess("Venue and venue admin created together.");
      }

      resetForm();
      setConfirmDeleteVenueId(null);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, isEditing ? "Failed to update venue" : "Failed to create venue"));
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: !isActive });
      setSuccess(`User ${isActive ? "deactivated" : "activated"} successfully.`);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update user status"));
    }
  };

  const handleDeleteVenue = async (venueId) => {
    try {
      await api.delete(`/admin/venues/${venueId}`);
      setSuccess("Venue deleted and its owner account was deactivated.");
      setConfirmDeleteVenueId(null);
      if (editingVenueId === venueId) {
        resetForm();
      }
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete venue"));
    }
  };

  if (loading) return <p>Loading admin panel...</p>;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-5">
        {stats &&
          [
            { label: "Users", value: stats.users },
            { label: "Players", value: stats.players },
            { label: "Venue Admins", value: stats.venueAdmins },
            { label: "Venues", value: stats.venues },
            { label: "Bookings", value: stats.bookings }
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            </div>
          ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">
              {isEditing ? "Edit Venue + Owner" : "Create Venue + Owner"}
            </h1>
            <div className="flex gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium"
                >
                  Cancel edit
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                {saving ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save" : "Create"}
              </button>
            </div>
          </div>

          <Notice tone="error" className="mt-4">{error}</Notice>
          <Notice tone="success" className="mt-4">{success}</Notice>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              type="text"
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              placeholder="Venue owner name"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="email"
              name="ownerEmail"
              value={form.ownerEmail}
              onChange={handleChange}
              placeholder="Venue owner email"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="password"
              name="ownerPassword"
              value={form.ownerPassword}
              onChange={handleChange}
              placeholder={isEditing ? "Leave blank to keep current password" : "Temporary password"}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              name="venueName"
              value={form.venueName}
              onChange={handleChange}
              placeholder="Venue name"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Venue phone"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="url"
              name="mapsUrl"
              value={form.mapsUrl}
              onChange={handleChange}
              placeholder="Google Maps URL"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="1"
              name="hourlyRate"
              value={form.hourlyRate}
              onChange={handleChange}
              placeholder="Base hourly rate"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Venue description"
              rows="3"
              className="md:col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Venue Gallery</h2>
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
              <h2 className="text-lg font-semibold">Courts</h2>
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
                <div key={court.id || `court-${index}`} className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <input
                    type="text"
                    value={court.name}
                    onChange={(e) => updateCourt(index, "name", e.target.value)}
                    placeholder="Court name"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={court.isActive}
                      onChange={(e) => updateCourt(index, "isActive", e.target.checked)}
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCourt(index)}
                    disabled={form.courts.length === 1}
                    className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pricing Rules</h2>
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
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
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
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    disabled={form.pricingRules.length === 1}
                    className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">Venue Owners</h2>
            <div className="mt-4 space-y-3 max-h-[320px] overflow-auto pr-1">
              {users.map((user) => (
                <div key={user.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {user.name} - {user.role}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      {user.managedVenue && (
                        <p className="mt-1 text-sm text-slate-600">
                          Venue: {user.managedVenue.name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleUserStatus(user.id, user.isActive)}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        user.isActive
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">Venues</h2>
            <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
              {venues.map((venue) => (
                <div key={venue.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 overflow-hidden rounded-2xl">
                    <img
                      src={
                        resolveAssetUrl(venue.galleryImages?.[0]?.imageUrl) ||
                        "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={venue.name}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                  <p className="font-medium">{venue.name}</p>
                  <p className="text-sm text-slate-500">
                    {venue.city} - {venue.admin?.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {venue.courts?.length || 0} courts - {venue.pricingRules?.length || 0} pricing rules
                  </p>
                  {venue.mapsUrl && (
                    <a
                      href={venue.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-sm font-medium text-slate-700 hover:underline"
                    >
                      Open map
                    </a>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => startEdit(venue)}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm"
                    >
                      Edit
                    </button>
                    {confirmDeleteVenueId === venue.id ? (
                      <>
                        <button
                          onClick={() => handleDeleteVenue(venue.id)}
                          className="rounded-lg bg-rose-600 px-3 py-2 text-sm text-white"
                        >
                          Confirm delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteVenueId(null)}
                          className="rounded-lg bg-slate-100 px-3 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteVenueId(venue.id)}
                        className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
