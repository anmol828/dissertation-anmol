import React, { useEffect, useState } from "react";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";
import {
  PLAYER_POSITIONS,
  PLAYER_STATUSES,
  PREFERRED_FEET,
  SKILL_LEVELS
} from "../../lib/constants.js";
import {
  getApiErrorMessage,
  hasPositiveNumber,
  isValidPhone
} from "../../lib/form-utils.js";

const fallbackPlayerImage =
  "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=500&q=80";

const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
};

const PlayerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    age: "",
    city: "",
    phone: "",
    profileImageUrl: "",
    position: "FORWARD",
    skill: "INTERMEDIATE",
    preferredFoot: "RIGHT",
    status: "AVAILABLE",
    preferredPlayTime: "",
    jerseyNumber: "",
    bio: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const [profileRes, incomingRes] = await Promise.all([
        api.get("/players/me"),
        api.get("/recruitment/incoming").catch(() => ({ data: { requests: [] } }))
      ]);

      if (profileRes.data.profile) {
        setProfile(profileRes.data.profile);
        setForm({
          age: profileRes.data.profile.age || "",
          city: profileRes.data.profile.city || "",
          phone: profileRes.data.profile.phone || "",
          profileImageUrl: profileRes.data.profile.profileImageUrl || "",
          position: profileRes.data.profile.position,
          skill: profileRes.data.profile.skill,
          preferredFoot: profileRes.data.profile.preferredFoot,
          status: profileRes.data.profile.status,
          preferredPlayTime: profileRes.data.profile.preferredPlayTime || "",
          jerseyNumber: profileRes.data.profile.jerseyNumber || "",
          bio: profileRes.data.profile.bio || ""
        });
      }

      setRequests(incomingRes.data.requests || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load player panel"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!hasPositiveNumber(form.age) || Number(form.age) < 10 || Number(form.age) > 70) {
      setError("Age must be between 10 and 70.");
      setSaving(false);
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError("Please enter a valid phone number.");
      setSaving(false);
      return;
    }

    try {
      const res = await api.post("/players/me", {
        age: Number(form.age),
        city: form.city,
        phone: form.phone,
        profileImageUrl: form.profileImageUrl,
        position: form.position,
        skill: form.skill,
        preferredFoot: form.preferredFoot,
        status: form.status,
        preferredPlayTime: form.preferredPlayTime,
        jerseyNumber: form.jerseyNumber ? Number(form.jerseyNumber) : null,
        bio: form.bio
      });
      setProfile(res.data.profile);
      setSuccess("Player profile updated.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/players/me/upload-image", formData);
      const uploadedUrl = res.data.profileImageUrl;

      setForm((prev) => ({ ...prev, profileImageUrl: uploadedUrl }));
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
      setSuccess("Profile image uploaded.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to upload profile image"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRespond = async (id, status) => {
    try {
      await api.post(`/recruitment/${id}/respond`, { status });
      setSuccess(`Invitation ${status === "ACCEPTED" ? "accepted" : "rejected"}.`);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to respond to recruitment request"));
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)] md:p-8">
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="flex items-start gap-5">
              <img
                src={resolveAssetUrl(form.profileImageUrl) || fallbackPlayerImage}
                alt={profile?.user?.name || "Player"}
                className="h-28 w-28 rounded-[24px] object-cover shadow-sm"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Player panel</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {profile?.user?.name || "Complete your profile"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Build a strong player card with status, role, and availability so teams and
                  venue communities can identify the right fit quickly.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Current status",
                  value: profile?.status?.replaceAll("_", " ") || "Not set"
                },
                {
                  label: "Position",
                  value: profile?.position?.replaceAll("_", " ") || "Not set"
                },
                {
                  label: "Skill level",
                  value: profile?.skill || "Not set"
                },
                {
                  label: "Teams joined",
                  value: String(profile?.teamMembers?.length || 0)
                }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Recruitment Status</h2>
              <div className="mt-4 space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="font-medium text-slate-950">{request.team?.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.postId ? `Join request: ${request.post?.title || "Recruitment post"}` : "Team invitation"} - {request.status}
                    </p>
                    {request.status === "PENDING" && !request.postId && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleRespond(request.id, "ACCEPTED")}
                          className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(request.id, "REJECTED")}
                          className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {requests.length === 0 && (
                  <p className="text-sm text-slate-500">No recruitment activity yet.</p>
                )}
              </div>
            </section>
          </div>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Profile Details</h2>
            <Notice tone="error" className="mt-4">{error}</Notice>
            <Notice tone="success" className="mt-4">{success}</Notice>
            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Profile image URL
                </label>
                <input
                  type="text"
                  name="profileImageUrl"
                  value={form.profileImageUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                />
                <label className="mt-3 block text-sm font-medium text-slate-700 mb-1">
                  Or upload profile image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Accepted: JPG, PNG, WEBP, GIF (max 5MB).
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  required
                  min="10"
                  max="70"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jersey Number</label>
                <input
                  type="number"
                  name="jerseyNumber"
                  value={form.jerseyNumber}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                <select
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                >
                  {PLAYER_POSITIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skill Level</label>
                <select
                  name="skill"
                  value={form.skill}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                >
                  {SKILL_LEVELS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Foot</label>
                <select
                  name="preferredFoot"
                  value={form.preferredFoot}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                >
                  {PREFERRED_FEET.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Playing Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                >
                  {PLAYER_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Recruitment Availability
                </label>
                <input
                  type="text"
                  name="preferredPlayTime"
                  value={form.preferredPlayTime}
                  onChange={handleChange}
                  placeholder="Available for recruitment on weekday evenings, Friday night, early mornings"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? "Saving..." : uploading ? "Uploading image..." : "Save Profile"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
};

export default PlayerProfile;
