import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import api from "../lib/api.js";
import { Reveal, RevealGroup, RevealItem } from "../components/motion/Reveal.jsx";
import {
  glassPanel,
  glassPanelStrong,
  glassCardHover,
  glassOnDark,
} from "../lib/glass.js";

const fallbackVenueImage =
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80";
const fallbackPlayerImage =
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=400&q=80";

const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
};

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

const SectionHeader = ({ title, subtitle, to, action = "Explore more" }) => (
  <Reveal className="flex items-end justify-between gap-4">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
    </div>
    {to && (
      <Link
        to={to}
        className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-slate-700 transition hover:text-emerald-700"
      >
        {action}
        <span className="transition-transform duration-300 group-hover:translate-x-0.5">
          &rarr;
        </span>
      </Link>
    )}
  </Reveal>
);

const SkeletonRow = ({ label }) => (
  <div className="flex items-center gap-2 text-sm text-slate-500">
    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
    {label}
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

const Hero = ({ featuredVenue }) => {
  const reduceMotion = useReducedMotion();

  const stats = [
    { label: "Roles", value: "4", note: "Admin, owner, player, user" },
    { label: "Booking logic", value: "Live", note: "Conflict-safe hourly slots" },
    { label: "Venue view", value: "Calendar", note: "Availability by court" },
  ];

  return (
    <section
      className={`relative overflow-hidden rounded-[28px] ${glassPanelStrong}`}
    >
      {/* Soft ambient glow behind the glass */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl"
      />

      <div className="relative grid lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          className="p-8 md:p-12 xl:p-14"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 backdrop-blur">
            Multi-role futsal operations
          </span>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            One place to run bookings, showcase players, and keep venue schedules full.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-600">
            FutsalHub is designed around the real day-to-day flow of a sports facility:
            players need visibility, owners need schedule control, and admins need a calm
            operational overview.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/venues"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
            >
              Explore venues
            </Link>
            <Link
              to="/register"
              className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-medium text-slate-700 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              Create account
            </Link>
          </div>

          <RevealGroup className="mt-10 grid gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <RevealItem
                key={item.label}
                className="rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur-md"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500">{item.note}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </motion.div>

        <div className="relative min-h-[360px] overflow-hidden bg-slate-950">
          <motion.img
            src={
              resolveAssetUrl(featuredVenue?.galleryImages?.[0]?.imageUrl) ||
              fallbackVenueImage
            }
            alt="Featured futsal venue"
            className="absolute inset-0 h-full w-full object-cover"
            initial={reduceMotion ? {} : { scale: 1.12 }}
            animate={reduceMotion ? {} : { scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/45 to-transparent" />
          <div className="relative z-10 flex h-full items-end p-8 md:p-10">
            <Reveal
              className={`max-w-md rounded-3xl p-5 text-white ${glassOnDark}`}
              delay={0.15}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">
                Featured venue snapshot
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                {featuredVenue?.name || "Prime-time courts ready to book"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                {featuredVenue?.description ||
                  "Use the live schedule grid to book faster, review slot pressure, and manage evening demand without spreadsheet work."}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Value props                                                               */
/* -------------------------------------------------------------------------- */

const ValueProps = () => {
  const items = [
    {
      title: "Built for players",
      text: "Profile cards, availability status, and team invitations stay close to the actions players care about.",
    },
    {
      title: "Built for venue owners",
      text: "Court calendars, flexible pricing rules, and booking oversight give owners a real operating panel.",
    },
    {
      title: "Built for admins",
      text: "The platform view stays decision-first: venue setup, role control, and system visibility without clutter.",
    },
  ];

  return (
    <RevealGroup className="grid gap-5 lg:grid-cols-3">
      {items.map((item) => (
        <RevealItem
          key={item.title}
          className={`rounded-[24px] p-6 ${glassCardHover}`}
        >
          <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
        </RevealItem>
      ))}
    </RevealGroup>
  );
};

/* -------------------------------------------------------------------------- */
/*  Featured venues                                                           */
/* -------------------------------------------------------------------------- */

const VenueCard = ({ venue }) => (
  <RevealItem>
    <Link
      to={`/venues/${venue.id}`}
      className={`group block h-full overflow-hidden rounded-[24px] ${glassCardHover}`}
    >
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={resolveAssetUrl(venue.galleryImages?.[0]?.imageUrl) || fallbackVenueImage}
          alt={venue.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
          <span className="rounded-xl bg-slate-100/80 px-3 py-2 text-xs font-medium text-slate-700 backdrop-blur">
            {venue.courts?.length || 0} courts
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {venue.description || "Indoor futsal venue with role-based booking support."}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-500">Base rate</span>
          <span className="font-semibold text-slate-950">Rs. {venue.hourlyRate}</span>
        </div>
      </div>
    </Link>
  </RevealItem>
);

const FeaturedVenues = ({ loading, venues }) => (
  <section className="space-y-6">
    <SectionHeader
      title="Featured Futsals"
      subtitle="Popular venues surfaced from booking activity and schedule coverage."
      to="/venues"
    />
    {loading ? (
      <SkeletonRow label="Loading featured venues..." />
    ) : (
      <RevealGroup className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </RevealGroup>
    )}
  </section>
);

/* -------------------------------------------------------------------------- */
/*  Home teams                                                                */
/* -------------------------------------------------------------------------- */

const TeamCard = ({ team }) => (
  <RevealItem className={`rounded-[24px] p-5 ${glassCardHover}`}>
    <div className="flex items-center gap-4">
      <img
        src={resolveAssetUrl(team.imageUrl) || fallbackVenueImage}
        alt={team.name}
        className="h-16 w-16 rounded-2xl object-cover"
      />
      <div className="min-w-0">
        <h3 className="truncate text-lg font-semibold text-slate-950">{team.name}</h3>
        <p className="truncate text-sm text-slate-500">
          {team.venue?.name || "Independent venue"}
        </p>
      </div>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
      <div className="rounded-2xl border border-white/50 bg-slate-50/70 px-3 py-2 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Players</p>
        <p className="mt-1 font-semibold text-slate-950">{team.players?.length || 0}</p>
      </div>
      <div className="rounded-2xl border border-white/50 bg-slate-50/70 px-3 py-2 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Skill</p>
        <p className="mt-1 font-semibold text-slate-950">{team.skillLevel || "Open"}</p>
      </div>
    </div>
  </RevealItem>
);

const HomeTeams = ({ loading, teams }) => (
  <section className="space-y-6">
    <SectionHeader
      title="Home Teams"
      subtitle="Venue-backed squads available for community matches and player discovery."
      to="/venues"
    />
    {loading ? (
      <SkeletonRow label="Loading home teams..." />
    ) : (
      <RevealGroup className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {teams.slice(0, 8).map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
        {teams.length === 0 && (
          <p className="text-sm text-slate-600">No home teams available yet.</p>
        )}
      </RevealGroup>
    )}
  </section>
);

/* -------------------------------------------------------------------------- */
/*  Star players                                                              */
/* -------------------------------------------------------------------------- */

const PlayerCard = ({ player }) => (
  <RevealItem>
    <Link
      to={`/players/${player.id}`}
      className={`group block h-full rounded-[24px] p-5 ${glassCardHover}`}
    >
      <div className="flex items-center gap-4">
        <img
          src={resolveAssetUrl(player.profileImageUrl) || fallbackPlayerImage}
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
  </RevealItem>
);

const StarPlayers = ({ loading, players }) => (
  <section className="space-y-6">
    <SectionHeader
      title="Star Players"
      subtitle="High-completion player profiles that help teams and venue communities connect faster."
      to="/search?tab=players"
    />
    {loading ? (
      <SkeletonRow label="Loading player spotlight..." />
    ) : (
      <RevealGroup className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </RevealGroup>
    )}
  </section>
);

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

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
          api.get("/home-teams"),
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
    <div className="space-y-14">
      <Hero featuredVenue={featuredVenues[0]} />
      <ValueProps />
      <FeaturedVenues loading={loading} venues={featuredVenues} />
      <HomeTeams loading={loading} teams={homeTeams} />
      <StarPlayers loading={loading} players={featuredPlayers} />
    </div>
  );
};

export default Home;
