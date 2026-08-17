import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";

const fallbackVenueImage =
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80";

const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
};

const VenueList = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await api.get("/venues");
        setVenues(res.data.venues || []);
      } catch (err) {
        setError("Failed to load venues");
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  if (loading) return <p>Loading venues...</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-line bg-surface p-8 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-pitch-strong">
              Venue discovery
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Browse futsal venues with schedules, pricing, and booking-ready courts.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
              Every venue is presented as an operational card: image-led, location-aware,
              rate-visible, and ready to drill into the calendar view.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface-2 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Visible venues</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{venues.length}</p>
            </div>
            <div className="rounded-2xl bg-surface-2 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Booking mode</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">Live</p>
            </div>
          </div>
        </div>
      </section>

      <Notice tone="error">{error}</Notice>

      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => (
          <Link
            key={venue.id}
            to={`/venues/${venue.id}`}
            className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_54px_rgba(15,23,42,0.1)]"
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
                  <h2 className="text-xl font-semibold text-foreground">{venue.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {venue.address}, {venue.city}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-2 px-3 py-2 text-xs font-medium text-foreground">
                  {venue.courts?.length || 0} courts
                </div>
              </div>

              {venue.description && (
                <p className="mt-4 text-sm leading-6 text-muted">{venue.description}</p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-2 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Base rate</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">Rs. {venue.hourlyRate}</p>
                </div>
                <div className="rounded-2xl bg-surface-2 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Gallery</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {venue.galleryImages?.length || 0} photos
                  </p>
                </div>
              </div>
              {venue.mapsUrl && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(venue.mapsUrl, "_blank");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View on Google Maps
                </button>
              )}
            </div>
          </Link>
        ))}
      </section>

      {venues.length === 0 && !error && (
        <p className="text-sm text-muted">No venues available yet.</p>
      )}
    </div>
  );
};

export default VenueList;
