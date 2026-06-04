import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api.js";

const fallbackVenueImage =
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80";

const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
};

const Home = () => {
  const [featuredVenues, setFeaturedVenues] = useState([]);
  const [featuredPlayers, setFeaturedPlayers] = useState([]);
  const [homeTeams, setHomeTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [venuesRes, playersRes, teamsRes] = await Promise.all([
          api.get("/venues/featured"),
          api.get("/players/featured"),
          api.get("/home-teams")
        ]);

        setFeaturedVenues(venuesRes.data.venues || []);
        setFeaturedPlayers(playersRes.data.players || []);
        setHomeTeams(teamsRes.data.teams || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-8 md:p-12 xl:p-14">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Multi-role futsal operations
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              One place to run bookings, showcase players, and keep venue schedules full.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              FutsalHub is designed around the real day-to-day flow of a sports facility:
              players need visibility, owners need schedule control, and admins need a calm
              operational overview.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/venues"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                Explore venues
              </Link>
              <Link
                to="/register"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Create account
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { label: "Roles", value: "4", note: "Admin, owner, player, user" },
                { label: "Booking logic", value: "Live", note: "Conflict-safe hourly slots" },
                { label: "Venue view", value: "Calendar", note: "Availability by court" }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] bg-slate-950">
            <img
              src={
                resolveAssetUrl(featuredVenues[0]?.galleryImages?.[0]?.imageUrl) ||
                fallbackVenueImage
              }
              alt="Featured futsal venue"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/45 to-transparent" />
            <div className="relative z-10 flex h-full items-end p-8 md:p-10">
              <div className="max-w-md rounded-3xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">
                  Featured venue snapshot
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {featuredVenues[0]?.name || "Prime-time courts ready to book"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {featuredVenues[0]?.description ||
                    "Use the live schedule grid to book faster, review slot pressure, and manage evening demand without spreadsheet work."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          {
            title: "Built for players",
            text: "Profile cards, availability status, and team invitations stay close to the actions players care about."
          },
          {
            title: "Built for venue owners",
            text: "Court calendars, flexible pricing rules, and booking oversight give owners a real operating panel."
          },
          {
            title: "Built for admins",
            text: "The platform view stays decision-first: venue setup, role control, and system visibility without clutter."
          }
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[24px] border border-white/70 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl"
          >
            <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Featured Futsals
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Popular venues surfaced from booking activity and schedule coverage.
            </p>
          </div>
          <Link to="/venues" className="text-sm font-medium text-slate-700 hover:underline">
            Explore more
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading featured venues...</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredVenues.map((venue) => (
              <Link
                key={venue.id}
                to={`/venues/${venue.id}`}
                className="overflow-hidden rounded-[24px] border border-white/70 bg-white/85 shadow-[0_12px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.1)]"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={resolveAssetUrl(venue.galleryImages?.[0]?.imageUrl) || fallbackVenueImage}
                    alt={venue.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{venue.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {venue.address}, {venue.city}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                      {venue.courts?.length || 0} courts
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {venue.description || "Indoor futsal venue with role-based booking support."}
                  </p>
                  <div className="mt-5 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Base rate</span>
                    <span className="font-semibold text-slate-950">Rs. {venue.hourlyRate}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Home Teams</h2>
            <p className="mt-1 text-sm text-slate-500">
              Venue-backed squads available for community matches and player discovery.
            </p>
          </div>
          <Link to="/venues" className="text-sm font-medium text-slate-700 hover:underline">
            Explore more
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading home teams...</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {homeTeams.slice(0, 8).map((team) => (
              <div
                key={team.id}
                className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={resolveAssetUrl(team.imageUrl) || fallbackVenueImage}
                    alt={team.name}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-slate-950">
                      {team.name}
                    </h3>
                    <p className="truncate text-sm text-slate-500">
                      {team.venue?.name || "Independent venue"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Players</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {team.players?.length || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Skill</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {team.skillLevel || "Open"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {homeTeams.length === 0 && (
              <p className="text-sm text-slate-600">No home teams available yet.</p>
            )}
          </div>
        )}
      </section> */}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Star Players</h2>
            <p className="mt-1 text-sm text-slate-500">
              High-completion player profiles that help teams and venue communities connect faster.
            </p>
          </div>
          <Link
            to="/search?tab=players"
            className="text-sm font-medium text-slate-700 hover:underline"
          >
            Explore more
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading player spotlight...</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredPlayers.map((player) => (
              <Link
                key={player.id}
                to={`/players/${player.id}`}
                className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={
                      resolveAssetUrl(player.profileImageUrl) ||
                      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=400&q=80"
                    }
                    alt={player.user?.name || "Player"}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{player.user?.name}</h3>
                    <p className="text-sm text-slate-500">
                      {player.position.replaceAll("_", " ")} - {player.skill}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {player.status.replaceAll("_", " ")}
                  </span>
                  {player.city && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {player.city}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {player.bio || "Profile completed and ready for match-day discovery."}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
