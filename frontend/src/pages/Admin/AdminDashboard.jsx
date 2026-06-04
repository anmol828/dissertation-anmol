import React, { useEffect, useState } from "react";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVenues: 0,
    totalBookings: 0,
    totalRevenue: 0
  });
  const [chartData, setChartData] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [venuesList, setVenuesList] = useState([]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, usersRes, venuesRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/venues")
      ]);

      setStats(statsRes.data.stats || { totalUsers: 0, totalVenues: 0, totalBookings: 0, totalRevenue: 0 });
      setChartData(statsRes.data.monthlyRevenueChartData || []);
      setUsersList(usersRes.data.users || []);
      setVenuesList(venuesRes.data.venues || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin stats and list records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleUserStatus = async (userId) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const res = await api.patch(`/admin/users/${userId}/toggle`);
      setSuccess(`User status for ${res.data.user?.name} has been toggled!`);
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle user status.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            System Administration Panel
          </h1>
          <p className="text-slate-500 mt-1">Monitor users, futsal centers, booking statistics, and revenue collections.</p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-900 text-white shadow-sm">
            Platform Master Admin
          </span>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 bg-white border border-slate-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-96 bg-white border border-slate-200 rounded-2xl"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Users", value: stats.totalUsers, color: "text-slate-900" },
              { label: "Total Venues", value: stats.totalVenues, color: "text-blue-600" },
              { label: "Total Bookings", value: stats.totalBookings, color: "text-purple-600" },
              { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), color: "text-emerald-600" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue Bar Chart (recharts) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-5">Monthly Platform Revenue (Last 6 Months)</h2>
            {chartData.length === 0 ? (
              <div className="h-72 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                No monthly revenue chart data available.
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(num) => `Rs ${num}`}
                    />
                    <Tooltip
                      contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                      formatter={(value) => [`Rs ${value}`, "Revenue"]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Lists Block */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Recent Users Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-5">Platform Users</h2>
              {usersList.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center border border-dashed border-slate-200 rounded-xl">No users registered on the platform.</p>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map((usr) => (
                        <tr key={usr.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{usr.name}</div>
                            <div className="text-xs text-slate-500">{usr.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 text-3xs font-semibold rounded-full uppercase tracking-wider bg-slate-100 text-slate-800">
                              {usr.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {new Date(usr.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleToggleUserStatus(usr.id)}
                              disabled={actionLoading || usr.id === user.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors border ${
                                usr.isActive
                                  ? "bg-emerald-550 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                  : "bg-rose-550 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                              } disabled:opacity-50`}
                            >
                              {usr.isActive ? "Active" : "Banned"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Venues Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-5">Registered Futsal Venues</h2>
              {venuesList.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center border border-dashed border-slate-200 rounded-xl">No venues registered on the platform.</p>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50">
                      <tr>
                        <th className="py-3 px-4">Venue</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Admin</th>
                        <th className="py-3 px-4">Courts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {venuesList.map((vn) => (
                        <tr key={vn.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{vn.name}</td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">{vn.city}</td>
                          <td className="py-3.5 px-4">{vn.admin?.name || "No Admin"}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700 bg-slate-50/50 rounded-lg">
                            {vn.courts?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
