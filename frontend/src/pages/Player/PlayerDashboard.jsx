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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || "Player"}!
          </h1>
          <p className="text-slate-500 mt-1">Here is a quick overview of your futsal schedule, teams, and invites.</p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-900 text-white shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
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
            <div key={idx} className="h-28 rounded-2xl bg-white border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
              <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
              <div className="h-8 w-1/3 bg-slate-300 rounded mt-2"></div>
            </div>
          ))
        ) : (
          [
            { label: "Total Bookings", value: stats.totalBookings, color: "text-slate-900" },
            { label: "Upcoming Bookings", value: stats.upcomingBookings, color: "text-emerald-600" },
            { label: "Teams Joined", value: stats.teamsJoined, color: "text-blue-600" },
            { label: "Pending Invites", value: stats.recruitmentPending, color: "text-amber-600" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Upcoming Bookings Block */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Upcoming Bookings</h2>
            <Link to="/venues" className="text-sm font-semibold text-slate-900 hover:underline">
              Book a Court &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 font-medium">No upcoming bookings found</p>
              <p className="text-xs text-slate-400 mt-1">Book your slots on any futsal venue.</p>
              <Link to="/venues" className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                Browse Venues
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="group relative flex flex-col sm:flex-row sm:items-center sm:justify-between border border-slate-150 rounded-xl p-4 hover:border-slate-300 transition-colors bg-slate-50/50">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {booking.court?.name || "Default Court"}
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      {booking.court?.venue?.name || "Futsal Venue"} • {booking.court?.venue?.city || "Kathmandu"}
                    </p>
                    <p className="text-xs text-slate-500">
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
                    <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800">
                      {booking.status}
                    </span>
                    <Link to={`/bookings`} className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50">
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Teams panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">My Teams</h2>
            <Link to="/teams" className="text-sm font-semibold text-slate-900 hover:underline">
              View All &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : myTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 font-medium">You haven't joined any teams</p>
              {user?.role === "PLAYER" && (
                <Link to="/teams" className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                  Create or Join Team
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {myTeams.map((team) => (
                <div key={team.id} className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <img
                    src={resolveAssetUrl(team.logoImageUrl)}
                    alt={team.name}
                    className="h-11 w-11 rounded-lg object-cover border border-slate-200 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-slate-900 truncate">{team.name}</p>
                    <p className="text-xs text-slate-500">
                      Cap: {team.captainName || team.owner?.name || "Manager"} • {team.skillLevel || "Any skill"}
                    </p>
                  </div>
                  <Link to={`/teams`} className="text-xs font-semibold text-slate-600 hover:text-slate-955 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-sm">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-5">Recruitment Invites</h2>

          {loading ? (
            <div className="space-y-4">
              <div className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
            </div>
          ) : invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 font-medium">No pending recruitment invitations</p>
              <p className="text-xs text-slate-400 mt-1">Teams looking for players will invite you here.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {invites.map((invite) => {
                const isPending = invite.status === "PENDING";
                return (
                  <div key={invite.id} className="flex flex-col justify-between border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900 truncate">{invite.team?.name}</p>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                          invite.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                          invite.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                        }`}>
                          {invite.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Needed: <span className="font-semibold text-slate-700">{invite.post?.neededPosition || "Any"}</span> • {invite.post?.skillLevel || "Any Level"}
                      </p>
                      {invite.message && (
                        <p className="text-xs text-slate-600 italic bg-white border border-slate-100 rounded-lg p-2.5 mt-2">
                          "{invite.message}"
                        </p>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleInviteResponse(invite.id, "ACCEPTED")}
                          disabled={actionLoading}
                          className="flex-1 bg-slate-900 text-white rounded-lg text-xs font-semibold py-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleInviteResponse(invite.id, "REJECTED")}
                          disabled={actionLoading}
                          className="flex-1 bg-white border border-slate-200 text-rose-700 rounded-lg text-xs font-semibold py-2 hover:bg-rose-50 transition-colors disabled:opacity-50"
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
