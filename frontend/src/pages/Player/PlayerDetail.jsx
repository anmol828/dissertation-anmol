import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";
import { getApiErrorMessage } from "../../lib/form-utils.js";

const fallbackPlayerImage =
  "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=500&q=80";

const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
};

const buildWhatsAppUrl = (phone, name) => {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  const message = encodeURIComponent(`Hi ${name || "there"}, I found your futsal profile and want to discuss recruitment.`);
  return `https://wa.me/${digits}?text=${message}`;
};

const PlayerDetail = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/players/${id}`);
        setProfile(res.data.profile);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load player profile"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) return <p>Loading player...</p>;
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!profile) return <p>Player profile not found.</p>;

  const playerName = profile.user?.name || "Player";
  const canContact = Boolean(profile.phone);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <img
            src={resolveAssetUrl(profile.profileImageUrl) || fallbackPlayerImage}
            alt={playerName}
            className="h-36 w-36 rounded-[24px] object-cover shadow-sm"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Player profile</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {playerName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {profile.bio || "This player has not added a bio yet."}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {canContact ? (
              <a
                href={buildWhatsAppUrl(profile.phone, playerName)}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-center text-sm font-medium text-white hover:bg-emerald-700"
              >
                Contact on WhatsApp
              </a>
            ) : (
              <span className="rounded-2xl bg-slate-100 px-5 py-3 text-center text-sm text-slate-500">
                No contact added
              </span>
            )}
            <Link
              to="/search"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to search
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Position", value: profile.position?.replaceAll("_", " ") },
          { label: "Skill", value: profile.skill },
          { label: "Status", value: profile.status?.replaceAll("_", " ") },
          { label: "Recruitment availability", value: profile.preferredPlayTime || "Not specified" }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[24px] border border-white/70 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <h2 className="text-xl font-semibold text-slate-950">Player Information</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-slate-600">City: {profile.city || "Not added"}</p>
          <p className="text-sm text-slate-600">Age: {profile.age}</p>
          <p className="text-sm text-slate-600">Preferred foot: {profile.preferredFoot}</p>
          <p className="text-sm text-slate-600">Jersey number: {profile.jerseyNumber || "Not added"}</p>
        </div>
      </section>
    </div>
  );
};

export default PlayerDetail;
