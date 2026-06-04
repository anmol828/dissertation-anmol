import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api.js";
import Notice from "../components/Notice.jsx";
import {
  PLAYER_POSITIONS,
  PLAYER_STATUSES,
  PREFERRED_FEET,
  SKILL_LEVELS
} from "../lib/constants.js";
import { getApiErrorMessage } from "../lib/form-utils.js";

const fallbackVenueImage =
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80";
const fallbackPlayerImage =
  "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=500&q=80";

const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "players" ? "players" : "venues";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [venues, setVenues] = useState([]);
  const [players, setPlayers] = useState([]);
  const [venueFilters, setVenueFilters] = useState({
    q: "",
    city: "",
    minRate: "",
    maxRate: "",
    courtCount: "",
    hasMaps: false
  });
  const [playerFilters, setPlayerFilters] = useState({
    q: "",
    city: "",
    position: "",
    skill: "",
    status: "",
    preferredFoot: "",
    minAge: "",
    maxAge: "",
    jerseyNumber: "",
    preferredPlayTime: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadVenues = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        ...venueFilters,
        hasMaps: venueFilters.hasMaps ? "true" : ""
      };
      const res = await api.get("/venues", { params });
      setVenues(res.data.venues || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to search venues"));
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/players", { params: playerFilters });
      setPlayers(res.data.players || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to search players"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
    loadPlayers();
  }, []);

  const handleVenueChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVenueFilters((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handlePlayerChange = (e) => {
    setPlayerFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/85 p-8 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Search</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Search venues and players separately with filters based on their available profile data.
        </p>
      </section>

      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
        {[
          { value: "venues", label: "Venues" },
          { value: "players", label: "Players" }
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              activeTab === tab.value ? "bg-slate-950 text-white" : "text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Notice tone="error">{error}</Notice>

      {activeTab === "venues" ? (
        <section className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadVenues();
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <input name="q" value={venueFilters.q} onChange={handleVenueChange} placeholder="Name, address, phone" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm" />
              <input name="city" value={venueFilters.city} onChange={handleVenueChange} placeholder="City" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm" />
              <input type="number" name="courtCount" value={venueFilters.courtCount} onChange={handleVenueChange} placeholder="Minimum courts" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm" />
              <input type="number" name="minRate" value={venueFilters.minRate} onChange={handleVenueChange} placeholder="Min rate" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm" />
              <input type="number" name="maxRate" value={venueFilters.maxRate} onChange={handleVenueChange} placeholder="Max rate" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm" />
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600">
                <input type="checkbox" name="hasMaps" checked={venueFilters.hasMaps} onChange={handleVenueChange} />
                Has map link
              </label>
            </div>
            <button type="submit" className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white">
              Search venues
            </button>
          </form>

          {loading ? <p className="text-sm text-slate-500">Searching venues...</p> : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {venues.map((venue) => (
                <Link key={venue.id} to={`/venues/${venue.id}`} className="overflow-hidden rounded-[24px] border border-white/70 bg-white/85 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
                  <img src={resolveAssetUrl(venue.galleryImages?.[0]?.imageUrl) || fallbackVenueImage} alt={venue.name} className="h-44 w-full object-cover" />
                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-slate-950">{venue.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{venue.address}, {venue.city}</p>
                    <p className="mt-3 text-sm text-slate-600">Rs. {venue.hourlyRate} / hour - {venue.courts?.length || 0} courts</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadPlayers();
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <input name="q" value={playerFilters.q} onChange={handlePlayerChange} placeholder="Name, bio, availability" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm" />
              <input name="city" value={playerFilters.city} onChange={handlePlayerChange} placeholder="City" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm" />
              <select name="position" value={playerFilters.position} onChange={handlePlayerChange} className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm">
                <option value="">Any position</option>
                {PLAYER_POSITIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select name="skill" value={playerFilters.skill} onChange={handlePlayerChange} className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm">
                <option value="">Any skill</option>
                {SKILL_LEVELS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select name="status" value={playerFilters.status} onChange={handlePlayerChange} className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm">
                <option value="">Any status</option>
                {PLAYER_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select name="preferredFoot" value={playerFilters.preferredFoot} onChange={handlePlayerChange} className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm">
                <option value="">Any foot</option>
                {PREFERRED_FEET.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <input type="number" name="minAge" value={playerFilters.minAge} onChange={handlePlayerChange} placeholder="Min age" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm" />
              <input type="number" name="maxAge" value={playerFilters.maxAge} onChange={handlePlayerChange} placeholder="Max age" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm" />
              <input type="number" name="jerseyNumber" value={playerFilters.jerseyNumber} onChange={handlePlayerChange} placeholder="Jersey number" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm" />
              <input name="preferredPlayTime" value={playerFilters.preferredPlayTime} onChange={handlePlayerChange} placeholder="Recruitment availability" className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm md:col-span-3" />
            </div>
            <button type="submit" className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white">
              Search players
            </button>
          </form>

          {loading ? <p className="text-sm text-slate-500">Searching players...</p> : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {players.map((player) => (
                <Link key={player.id} to={`/players/${player.id}`} className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
                  <img src={resolveAssetUrl(player.profileImageUrl) || fallbackPlayerImage} alt={player.user?.name || "Player"} className="h-24 w-24 rounded-2xl object-cover" />
                  <h2 className="mt-4 text-lg font-semibold text-slate-950">{player.user?.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{player.position?.replaceAll("_", " ")} - {player.skill}</p>
                  <p className="mt-3 text-sm text-slate-600">{player.preferredPlayTime || player.status?.replaceAll("_", " ")}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Search;
