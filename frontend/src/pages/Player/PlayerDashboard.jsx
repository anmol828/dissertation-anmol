import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const PlayerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    teamsJoined: 0,
    recruitmentPending: 0
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [invites, setInvites] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [bookingsRes, teamsRes, invitesRes] = await Promise.all([
        api.get("/bookings/my"),
        api.get("/teams/my"),
        api.get("/recruitment/my-requests")
      ]);

      const allBookings = bookingsRes.data.bookings || [];
      const teams = teamsRes.data.teams || [];
      const requests = invitesRes.data.requests || [];

      // Calculate upcoming bookings
      const now = new Date();
      const upcoming = allBookings.filter((b) => {
        return new Date(b.startTime) > now && b.status === "CONFIRMED";
      });

      // Calculate stats
      const pendingInvites = requests.filter((r) => r.status === "PENDING");
      
      setStats({
        totalBookings: allBookings.length,
        upcomingBookings: upcoming.length,
        teamsJoined: teams.length,
        recruitmentPending: pendingInvites.length
      });

      setUpcomingBookings(upcoming);
      setMyTeams(teams);
      setInvites(requests);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleInviteResponse = async (id, status) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");
      await api.patch(`/recruitment/${id}/respond`, { status });
      setSuccess(`Successfully ${status.toLowerCase()}ed the invitation!`);
      // Reload dashboard data
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to respond to invite.");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to resolve profile image URLs
  const resolveAssetUrl = (url) => {
    if (!url) return "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80";
    if (url.startsWith("http")) return url;
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
    return `${backendBase}${url.startsWith("/") ? url : `/${url}`}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-surface rounded-2xl p-6 border border-line shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name || "Player"}!
          </h1>
          <p className="text-muted mt-1">Here is a quick overview of your futsal schedule, teams, and invites.</p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-charcoal text-white shadow-sm">
            <span className="h-2 w-2 rounded-full bg-pitch animate-pulse"></span>
            {user?.role}
          </span>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}

      {/* Stats Row */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-28 rounded-2xl bg-surface border border-line p-5 animate-pulse flex flex-col justify-between">
              <div className="h-4 w-2/3 bg-surface-2 rounded"></div>
              <div className="h-8 w-1/3 bg-slate-300 rounded mt-2"></div>
            </div>
          ))
        ) : (
          [
            { label: "Total Bookings", value: stats.totalBookings, color: "text-foreground" },
            { label: "Upcoming Bookings", value: stats.upcomingBookings, color: "text-pitch" },
            { label: "Teams Joined", value: stats.teamsJoined, color: "text-blue-600" },
            { label: "Pending Invites", value: stats.recruitmentPending, color: "text-amber-600" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-surface border border-line rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-muted">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Upcoming Bookings Block */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Upcoming Bookings</h2>
            <Link to="/venues" className="text-sm font-semibold text-foreground hover:underline">
              Book a Court &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="h-20 bg-surface-2 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-line rounded-xl">
              <p className="text-muted font-medium">No upcoming bookings found</p>
              <p className="text-xs text-muted mt-1">Book your slots on any futsal venue.</p>
              <Link to="/venues" className="mt-4 px-4 py-2 bg-charcoal text-white rounded-xl text-sm font-medium hover:bg-charcoal transition-colors">
                Browse Venues
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="group relative flex flex-col sm:flex-row sm:items-center sm:justify-between border border-line rounded-xl p-4 hover:border-line transition-colors bg-surface-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground group-hover:text-pitch transition-colors">
                      {booking.court?.name || "Default Court"}
                    </p>
                    <p className="text-sm text-muted font-medium">
                      {booking.court?.venue?.name || "Futsal Venue"} • {booking.court?.venue?.city || "Kathmandu"}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(booking.startTime).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })} • {new Date(booking.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })} - {new Date(booking.endTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-3">
                    <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-pitch-soft text-pitch-strong">
                      {booking.status}
                    </span>
                    <Link to={`/bookings`} className="text-xs font-semibold text-muted hover:text-foreground bg-surface border border-line px-3 py-1.5 rounded-lg shadow-sm hover:bg-surface-2">
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Teams panel */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">My Teams</h2>
            <Link to="/teams" className="text-sm font-semibold text-foreground hover:underline">
              View All &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="h-16 bg-surface-2 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : myTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-line rounded-xl">
              <p className="text-muted font-medium">You haven't joined any teams</p>
              {user?.role === "PLAYER" && (
                <Link to="/teams" className="mt-3 px-4 py-2 bg-charcoal text-white rounded-xl text-sm font-medium hover:bg-charcoal transition-colors">
                  Create or Join Team
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {myTeams.map((team) => (
                <div key={team.id} className="flex items-center gap-3 border border-line rounded-xl p-3 bg-surface-2">
                  <img
                    src={resolveAssetUrl(team.logoImageUrl)}
                    alt={team.name}
                    className="h-11 w-11 rounded-lg object-cover border border-line bg-surface"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate">{team.name}</p>
                    <p className="text-xs text-muted">
                      Cap: {team.captainName || team.owner?.name || "Manager"} • {team.skillLevel || "Any skill"}
                    </p>
                  </div>
                  <Link to={`/teams`} className="text-xs font-semibold text-muted hover:text-foreground bg-surface border border-line px-2.5 py-1.5 rounded-lg shadow-sm">
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recruitment invites panel */}
      {user?.role === "PLAYER" && (
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-5">Recruitment Invites</h2>

          {loading ? (
            <div className="space-y-4">
              <div className="h-20 bg-surface-2 rounded-xl animate-pulse"></div>
            </div>
          ) : invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-line rounded-xl">
              <p className="text-muted font-medium">No pending recruitment invitations</p>
              <p className="text-xs text-muted mt-1">Teams looking for players will invite you here.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {invites.map((invite) => {
                const isPending = invite.status === "PENDING";
                return (
                  <div key={invite.id} className="flex flex-col justify-between border border-line rounded-xl p-4 bg-surface-2">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground truncate">{invite.team?.name}</p>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                          invite.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                          invite.status === "ACCEPTED" ? "bg-pitch-soft text-pitch-strong" : "bg-surface-2 text-foreground"
                        }`}>
                          {invite.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Needed: <span className="font-semibold text-foreground">{invite.post?.neededPosition || "Any"}</span> • {invite.post?.skillLevel || "Any Level"}
                      </p>
                      {invite.message && (
                        <p className="text-xs text-muted italic bg-surface border border-line rounded-lg p-2.5 mt-2">
                          "{invite.message}"
                        </p>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleInviteResponse(invite.id, "ACCEPTED")}
                          disabled={actionLoading}
                          className="flex-1 bg-charcoal text-white rounded-lg text-xs font-semibold py-2 hover:bg-charcoal transition-colors disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleInviteResponse(invite.id, "REJECTED")}
                          disabled={actionLoading}
                          className="flex-1 bg-surface border border-line text-red-600 rounded-lg text-xs font-semibold py-2 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerDashboard;
